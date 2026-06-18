// ============================================================
// 사용자(users) 서비스 — Firestore CRUD
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";

/** 단일 사용자 프로필 조회 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  return { uid: snapshot.id, ...snapshot.data() } as UserProfile;
}

/** 모든 사용자 목록 조회 (admin 전용) */
export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() })) as UserProfile[];
}

/** 승인 대기 중인 manager 목록 조회 */
export async function getPendingManagers(): Promise<UserProfile[]> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "manager"),
    where("approved", "==", false)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() })) as UserProfile[];
}

/** manager 승인 처리 */
export async function approveManager(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    approved: true,
    approvedAt: serverTimestamp(),
  });
}

/** manager 반려 처리 (role을 member로 변경) */
export async function rejectManager(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    role: "member" as UserRole,
    approved: false,
  });
}

/** 사용자 프로필 업데이트 */
export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** FCM 토큰 업데이트 */
export async function updateFCMToken(uid: string, token: string): Promise<void> {
  await setDoc(
    doc(db, "users", uid),
    { fcmToken: token, lastLogin: serverTimestamp() },
    { merge: true }
  );
}

/** 특정 관심분야를 가진 사용자 uid 목록 조회 (알림 발송용) */
export async function getUsersByInterests(tags: string[]): Promise<UserProfile[]> {
  // Firestore는 array-contains-any로 최대 30개 원소까지 검색 가능
  const chunked: string[][] = [];
  for (let i = 0; i < tags.length; i += 10) {
    chunked.push(tags.slice(i, i + 10));
  }

  const results: UserProfile[] = [];
  for (const chunk of chunked) {
    const q = query(
      collection(db, "users"),
      where("interests", "array-contains-any", chunk)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((d) => {
      const user = { uid: d.id, ...d.data() } as UserProfile;
      if (!results.find((r) => r.uid === user.uid)) {
        results.push(user);
      }
    });
  }
  return results;
}

/** 기관별 manager 조회 (기관당 1명 제한 검사용) */
export async function getManagerByOrganization(
  organization: string
): Promise<UserProfile | null> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "manager"),
    where("organization", "==", organization)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { uid: d.id, ...d.data() } as UserProfile;
}
