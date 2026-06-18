// ============================================================
// 관리자 회원 관리 API
// GET  /api/admin/members        — 전체 회원 목록 조회
// PATCH /api/admin/members       — 역할·승인 상태 변경
// DELETE /api/admin/members      — 회원 삭제 (Firestore + Auth)
//
// 보안: Authorization 헤더 Firebase ID 토큰 검증 (admin only)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────
// 헬퍼: 관리자 토큰 검증
// ─────────────────────────────────────────────────────────────
async function verifyAdminToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const decoded = await adminAuth().verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    if (uid === process.env.NEXT_PUBLIC_ADMIN_UID) return uid;

    const snap = await adminDb().collection("users").doc(uid).get();
    if (!snap.exists || snap.data()?.role !== "admin") return null;

    return uid;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// GET — 전체 회원 목록 (role, approved 포함)
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const adminUid = await verifyAdminToken(req);
  if (!adminUid) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const snap = await adminDb().collection("users").orderBy("createdAt", "desc").get();
    const users = snap.docs.map((d) => ({
      uid: d.id,
      name: d.data().name ?? "",
      email: d.data().email ?? "",
      role: d.data().role ?? "member",
      approved: d.data().approved ?? false,
      organization: d.data().organization ?? "",
      photoURL: d.data().photoURL ?? "",
      createdAt: d.data().createdAt?.toDate()?.toISOString() ?? null,
      lastLogin: d.data().lastLogin?.toDate()?.toISOString() ?? null,
    }));

    return NextResponse.json({ users });
  } catch (err) {
    console.error("[admin/members GET]", err);
    return NextResponse.json({ error: "회원 목록 조회 실패" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH — 역할 변경 또는 승인 처리
// Body: { uid: string; role?: UserRole; approved?: boolean }
// ─────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const adminUid = await verifyAdminToken(req);
  if (!adminUid) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let body: { uid: string; role?: UserRole; approved?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { uid, role, approved } = body;

  if (!uid) {
    return NextResponse.json({ error: "uid는 필수입니다." }, { status: 400 });
  }

  // 자기 자신의 admin 권한은 변경 불가
  if (uid === adminUid && role && role !== "admin") {
    return NextResponse.json(
      { error: "자신의 관리자 권한은 변경할 수 없습니다." },
      { status: 400 }
    );
  }

  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: adminUid,
    };

    if (role !== undefined) {
      const validRoles: UserRole[] = ["admin", "manager", "member"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "유효하지 않은 역할입니다." }, { status: 400 });
      }
      updateData.role = role;

      // role 변경 시 approved 자동 설정
      if (approved === undefined) {
        updateData.approved = role === "admin" || role === "member" ? true : false;
      }
    }

    if (approved !== undefined) {
      updateData.approved = approved;
    }

    await adminDb().collection("users").doc(uid).update(updateData);

    return NextResponse.json({ success: true, uid, ...updateData });
  } catch (err) {
    console.error("[admin/members PATCH]", err);
    return NextResponse.json({ error: "회원 정보 수정 실패" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE — 회원 삭제 (Firestore 문서 + Firebase Auth 계정)
// Body: { uid: string }
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const adminUid = await verifyAdminToken(req);
  if (!adminUid) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let body: { uid: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { uid } = body;

  if (!uid) {
    return NextResponse.json({ error: "uid는 필수입니다." }, { status: 400 });
  }

  // 자기 자신은 삭제 불가
  if (uid === adminUid) {
    return NextResponse.json({ error: "자신의 계정은 삭제할 수 없습니다." }, { status: 400 });
  }

  const db = adminDb();

  // 삭제 대상이 admin인지 확인 (admin 삭제 차단)
  const targetSnap = await db.collection("users").doc(uid).get();
  if (targetSnap.exists && targetSnap.data()?.role === "admin") {
    return NextResponse.json({ error: "관리자 계정은 삭제할 수 없습니다." }, { status: 400 });
  }

  const errors: string[] = [];

  // 1. Firebase Auth 계정 삭제
  try {
    await adminAuth().deleteUser(uid);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("no user record")) {
      errors.push(`Auth 삭제 실패: ${msg}`);
    }
  }

  // 2. Firestore 사용자 문서 삭제
  try {
    await db.collection("users").doc(uid).delete();
  } catch (err) {
    errors.push(`Firestore 삭제 실패: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 500 });
  }

  return NextResponse.json({ success: true, uid });
}
