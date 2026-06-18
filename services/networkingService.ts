// ============================================================
// 네트워킹 게시판 서비스 — Firestore CRUD
// ============================================================

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  onSnapshot,
  Unsubscribe,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NetworkPost, NetworkComment, NetworkCategory } from "@/types";

const POSTS_PER_PAGE = 20;

// ─── 게시글 목록 조회 ─────────────────────────────────────────
export async function getNetworkPosts(
  category?: NetworkCategory,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ posts: NetworkPost[]; lastDoc: QueryDocumentSnapshot | null }> {
  let q = category
    ? query(
        collection(db, "networking_posts"),
        where("category", "==", category),
        orderBy("pinned", "desc"),
        orderBy("createdAt", "desc"),
        limit(POSTS_PER_PAGE)
      )
    : query(
        collection(db, "networking_posts"),
        orderBy("pinned", "desc"),
        orderBy("createdAt", "desc"),
        limit(POSTS_PER_PAGE)
      );

  if (lastDoc) {
    q = category
      ? query(
          collection(db, "networking_posts"),
          where("category", "==", category),
          orderBy("pinned", "desc"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(POSTS_PER_PAGE)
        )
      : query(
          collection(db, "networking_posts"),
          orderBy("pinned", "desc"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(POSTS_PER_PAGE)
        );
  }

  const snap = await getDocs(q);
  const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as NetworkPost[];
  const last = snap.docs[snap.docs.length - 1] ?? null;
  return { posts, lastDoc: last };
}

// ─── 단일 게시글 조회 + 조회수 증가 ──────────────────────────
export async function getNetworkPost(postId: string): Promise<NetworkPost | null> {
  const snap = await getDoc(doc(db, "networking_posts", postId));
  if (!snap.exists()) return null;
  await updateDoc(doc(db, "networking_posts", postId), { viewCount: increment(1) });
  return { id: snap.id, ...snap.data() } as NetworkPost;
}

// ─── 게시글 생성 ──────────────────────────────────────────────
export async function createNetworkPost(
  data: Omit<NetworkPost, "id" | "viewCount" | "commentCount" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "networking_posts"), {
    ...data,
    viewCount: 0,
    commentCount: 0,
    pinned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ─── 게시글 수정 ──────────────────────────────────────────────
export async function updateNetworkPost(
  postId: string,
  data: Partial<Pick<NetworkPost, "title" | "content" | "category" | "tags" | "pinned">>
): Promise<void> {
  await updateDoc(doc(db, "networking_posts", postId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── 게시글 삭제 ──────────────────────────────────────────────
export async function deleteNetworkPost(postId: string): Promise<void> {
  await deleteDoc(doc(db, "networking_posts", postId));
}

// ─── 댓글 실시간 구독 ─────────────────────────────────────────
export function subscribeNetworkComments(
  postId: string,
  callback: (comments: NetworkComment[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "networking_posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as NetworkComment[];
    callback(comments);
  });
}

// ─── 댓글 작성 ────────────────────────────────────────────────
export async function addNetworkComment(
  postId: string,
  data: Omit<NetworkComment, "id" | "postId" | "createdAt">
): Promise<void> {
  await addDoc(collection(db, "networking_posts", postId, "comments"), {
    ...data,
    postId,
    createdAt: serverTimestamp(),
  });
  // 게시글 commentCount 증가
  await updateDoc(doc(db, "networking_posts", postId), {
    commentCount: increment(1),
  });
}

// ─── 댓글 삭제 ────────────────────────────────────────────────
export async function deleteNetworkComment(
  postId: string,
  commentId: string
): Promise<void> {
  await deleteDoc(doc(db, "networking_posts", postId, "comments", commentId));
  await updateDoc(doc(db, "networking_posts", postId), {
    commentCount: increment(-1),
  });
}
