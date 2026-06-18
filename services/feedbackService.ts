// ============================================================
// 개선요청 게시판(feedback) 서비스
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FeedbackPost } from "@/types";

export async function getAllFeedback(): Promise<FeedbackPost[]> {
  const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as FeedbackPost[];
}

export async function addFeedback(
  data: Omit<FeedbackPost, "id" | "createdAt" | "updatedAt" | "status" | "adminReply">
): Promise<string> {
  const docRef = await addDoc(collection(db, "feedback"), {
    ...data,
    status: "pending",
    adminReply: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function replyToFeedback(
  id: string,
  adminReply: string
): Promise<void> {
  await updateDoc(doc(db, "feedback", id), {
    adminReply,
    status: "in_progress",
    updatedAt: serverTimestamp(),
  });
}

export async function resolveFeedback(id: string): Promise<void> {
  await updateDoc(doc(db, "feedback", id), {
    status: "resolved",
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFeedback(id: string): Promise<void> {
  await deleteDoc(doc(db, "feedback", id));
}
