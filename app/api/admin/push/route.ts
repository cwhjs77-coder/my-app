// ============================================================
// 관리자 전용 FCM 푸시 알림 발송 API
// POST /api/admin/push
//
// 보안: Authorization 헤더의 Firebase ID 토큰을 검증하여
//       관리자(admin role 또는 NEXT_PUBLIC_ADMIN_UID) 여부 확인
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging, adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

interface PushRequestBody {
  /** 알림 제목 */
  title: string;
  /** 알림 본문 */
  body: string;
  /** 관심 태그 필터 — 빈 배열이면 전체 사용자 발송 */
  tags?: string[];
  /** 클릭 시 이동 URL (선택) */
  link?: string;
}

// ─────────────────────────────────────────────────────────────
// 헬퍼: Authorization 헤더에서 Firebase ID 토큰 파싱 및 검증
// ─────────────────────────────────────────────────────────────
async function verifyAdminToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const idToken = authHeader.slice(7);
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // UID가 .env.local의 ADMIN_UID이면 즉시 허용
    if (uid === process.env.NEXT_PUBLIC_ADMIN_UID) return uid;

    // Firestore에서 role 필드 확인
    const userSnap = await adminDb().collection("users").doc(uid).get();
    if (!userSnap.exists) return null;

    const role = userSnap.data()?.role;
    if (role !== "admin") return null;

    return uid;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// POST 핸들러
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. 관리자 인증
  const adminUid = await verifyAdminToken(req);
  if (!adminUid) {
    return NextResponse.json(
      { error: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  // 2. 요청 바디 파싱
  let body: PushRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { title, body: msgBody, tags = [], link = "/dashboard/notices" } = body;

  if (!title?.trim() || !msgBody?.trim()) {
    return NextResponse.json(
      { error: "title과 body는 필수입니다." },
      { status: 400 }
    );
  }

  // 3. 발송 대상 FCM 토큰 수집
  //    tags가 빈 배열이면 전체 승인 사용자, 있으면 관심분야 매칭
  const db = adminDb();
  const usersSnap = await db
    .collection("users")
    .where("approved", "==", true)
    .get();

  const tokens: string[] = [];
  const targetCount = { total: 0, matched: 0 };

  usersSnap.forEach((doc) => {
    const user = doc.data();
    const fcmToken: string | undefined = user.fcmToken;
    if (!fcmToken) return;

    targetCount.total++;

    if (tags.length === 0) {
      // 전체 발송
      tokens.push(fcmToken);
      targetCount.matched++;
    } else {
      // 관심분야 매칭
      const interests: string[] = user.interests ?? [];
      const isMatch = tags.some((tag: string) => interests.includes(tag));
      if (isMatch) {
        tokens.push(fcmToken);
        targetCount.matched++;
      }
    }
  });

  if (tokens.length === 0) {
    return NextResponse.json({
      sent: 0,
      failed: 0,
      message: "발송 대상 토큰이 없습니다.",
    });
  }

  // 4. FCM Multicast 발송 (최대 500개씩 배치)
  const messaging = adminMessaging();
  const BATCH_SIZE = 500;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    try {
      const result = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: {
          title: title.trim(),
          body: msgBody.trim(),
        },
        data: {
          link,
          adminUid,
          sentAt: new Date().toISOString(),
        },
        webpush: {
          notification: {
            icon: "/icons/icon-192x192.png",
            badge: "/icons/badge-72x72.png",
          },
          fcmOptions: { link },
        },
        android: {
          notification: {
            channelId: "default",
            priority: "high",
          },
        },
      });
      successCount += result.successCount;
      failureCount += result.failureCount;

      // 만료된(invalid) 토큰 자동 정리
      result.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          (resp.error?.code === "messaging/registration-token-not-registered" ||
            resp.error?.code === "messaging/invalid-registration-token")
        ) {
          const invalidToken = batch[idx];
          db.collection("users")
            .where("fcmToken", "==", invalidToken)
            .get()
            .then((snap) => {
              snap.forEach((d) =>
                d.ref.update({ fcmToken: null }).catch(() => null)
              );
            })
            .catch(() => null);
        }
      });
    } catch (err) {
      console.error(`[admin/push] 배치 ${i / BATCH_SIZE + 1} 발송 오류:`, err);
      failureCount += batch.length;
    }
  }

  // 5. 발송 이력 Firestore 저장
  try {
    await db.collection("push_logs").add({
      title: title.trim(),
      body: msgBody.trim(),
      tags,
      link,
      sentBy: adminUid,
      targetTotal: targetCount.total,
      targetMatched: targetCount.matched,
      successCount,
      failureCount,
      sentAt: new Date(),
    });
  } catch (err) {
    console.warn("[admin/push] 발송 이력 저장 실패:", err);
  }

  return NextResponse.json({
    sent: successCount,
    failed: failureCount,
    targetMatched: targetCount.matched,
  });
}
