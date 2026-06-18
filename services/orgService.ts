// ============================================================
// 기관/기업(organizations) 서비스 — Firestore CRUD
// ============================================================

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Organization } from "@/types";
import { autoLinkNotice } from "./noticeService";
import { isValidUrl } from "@/utils/helpers";

// 기관 전체 목록 조회
export async function getAllOrganizations(): Promise<Organization[]> {
  const q = query(collection(db, "organizations"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Organization[];
}

// 단일 기관 조회
export async function getOrganization(id: string): Promise<Organization | null> {
  const snapshot = await getDoc(doc(db, "organizations", id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Organization;
}

// 기관 추가
export async function addOrganization(
  data: Omit<Organization, "id" | "createdAt" | "updatedAt">,
  registeredBy: string,
  registeredByName: string
): Promise<string> {
  const docRef = await addDoc(collection(db, "organizations"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 외부 공고 URL이 있으면 notices 컬렉션에 자동 연동
  if (data.noticeUrl && isValidUrl(data.noticeUrl) && data.noticeTitle) {
    await autoLinkNotice({
      title: data.noticeTitle,
      url: data.noticeUrl,
      category: data.noticeCategory || "other",
      tags: data.noticeTags || [],
      sourceCollection: "organizations",
      sourceId: docRef.id,
      registeredBy,
      registeredByName,
    });
  }

  return docRef.id;
}

// 기관 수정
export async function updateOrganization(
  id: string,
  data: Partial<Organization>,
  registeredBy: string,
  registeredByName: string
): Promise<void> {
  await updateDoc(doc(db, "organizations", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });

  // 공고 URL이 새로 추가된 경우 notices 자동 연동
  if (data.noticeUrl && isValidUrl(data.noticeUrl) && data.noticeTitle) {
    await autoLinkNotice({
      title: data.noticeTitle,
      url: data.noticeUrl,
      category: data.noticeCategory || "other",
      tags: data.noticeTags || [],
      sourceCollection: "organizations",
      sourceId: id,
      registeredBy,
      registeredByName,
    });
  }
}

// 기관 삭제 (admin 전용)
export async function deleteOrganization(id: string): Promise<void> {
  await deleteDoc(doc(db, "organizations", id));
}
