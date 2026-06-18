// ============================================================
// 공지/공고(notices) 서비스
// 외부 URL 자동 연동 및 관심분야 기반 푸시 알림 트리거 포함
// ============================================================

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Notice, NoticeCategory } from "@/types";

// 공지 전체 목록 조회
export async function getAllNotices(): Promise<Notice[]> {
  const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Notice[];
}

// 공지 추가 — 등록 후 서버 API를 통해 관심분야 매칭 푸시 알림 발송
export async function addNotice(data: Omit<Notice, "id" | "createdAt" | "viewCount">): Promise<string> {
  const docRef = await addDoc(collection(db, "notices"), {
    ...data,
    viewCount: 0,
    createdAt: serverTimestamp(),
  });

  // 서버 API 호출 — 관심분야 매칭 사용자들에게 푸시 알림 발송
  try {
    await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        noticeId: docRef.id,
        title: data.title,
        category: data.category,
        tags: data.tags,
      }),
    });
  } catch (err) {
    // 알림 발송 실패는 치명적 오류가 아니므로 로그만 기록
    console.warn("[noticeService] 푸시 알림 발송 실패:", err);
  }

  return docRef.id;
}

// 공지 수정
export async function updateNotice(id: string, data: Partial<Notice>): Promise<void> {
  await updateDoc(doc(db, "notices", id), { ...data });
}

// 공지 삭제
export async function deleteNotice(id: string): Promise<void> {
  await deleteDoc(doc(db, "notices", id));
}

// 조회수 증가
export async function incrementViewCount(id: string): Promise<void> {
  await updateDoc(doc(db, "notices", id), {
    viewCount: increment(1),
  });
}

/**
 * 외부 공고 URL 자동 연동 헬퍼
 * (1)~(5) 메뉴 데이터 등록 폼에서 noticeUrl이 있을 때 호출
 */
export async function autoLinkNotice(params: {
  title: string;
  url: string;
  category: NoticeCategory;
  tags: string[];
  sourceCollection: string;
  sourceId: string;
  registeredBy: string;
  registeredByName: string;
}): Promise<string> {
  return await addNotice({
    title: params.title,
    url: params.url,
    category: params.category,
    tags: params.tags,
    sourceCollection: params.sourceCollection,
    sourceId: params.sourceId,
    direct: false,
    registeredBy: params.registeredBy,
    registeredByName: params.registeredByName,
  });
}
