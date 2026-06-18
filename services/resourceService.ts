// ============================================================
// 자원(resources) 서비스 — 인적/물적 자원, 아이디어, 인재 CRUD
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
import {
  HumanResource,
  PhysicalResource,
  IdeaPost,
  TalentPost,
} from "@/types";
import { autoLinkNotice } from "./noticeService";
import { isValidUrl } from "@/utils/helpers";

// ─────────────────────────────────────────────
// 인적 자원
// ─────────────────────────────────────────────

export async function getAllHumanResources(): Promise<HumanResource[]> {
  const q = query(collection(db, "human_resources"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as HumanResource[];
}

export async function addHumanResource(
  data: Omit<HumanResource, "id" | "createdAt" | "updatedAt">,
  registeredByName: string
): Promise<string> {
  const docRef = await addDoc(collection(db, "human_resources"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (data.noticeUrl && isValidUrl(data.noticeUrl) && data.noticeTitle) {
    await autoLinkNotice({
      title: data.noticeTitle,
      url: data.noticeUrl,
      category: data.noticeCategory || "other",
      tags: data.noticeTags || [...(data.expertise || [])],
      sourceCollection: "human_resources",
      sourceId: docRef.id,
      registeredBy: data.registeredBy,
      registeredByName,
    });
  }

  return docRef.id;
}

export async function updateHumanResource(
  id: string,
  data: Partial<HumanResource>,
  registeredBy: string,
  registeredByName: string
): Promise<void> {
  await updateDoc(doc(db, "human_resources", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });

  if (data.noticeUrl && isValidUrl(data.noticeUrl) && data.noticeTitle) {
    await autoLinkNotice({
      title: data.noticeTitle,
      url: data.noticeUrl,
      category: data.noticeCategory || "other",
      tags: data.noticeTags || [],
      sourceCollection: "human_resources",
      sourceId: id,
      registeredBy,
      registeredByName,
    });
  }
}

export async function deleteHumanResource(id: string): Promise<void> {
  await deleteDoc(doc(db, "human_resources", id));
}

// ─────────────────────────────────────────────
// 물적 자원
// ─────────────────────────────────────────────

export async function getAllPhysicalResources(): Promise<PhysicalResource[]> {
  const q = query(collection(db, "physical_resources"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as PhysicalResource[];
}

export async function addPhysicalResource(
  data: Omit<PhysicalResource, "id" | "createdAt" | "updatedAt">,
  registeredByName: string
): Promise<string> {
  const docRef = await addDoc(collection(db, "physical_resources"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (data.noticeUrl && isValidUrl(data.noticeUrl) && data.noticeTitle) {
    await autoLinkNotice({
      title: data.noticeTitle,
      url: data.noticeUrl,
      category: data.noticeCategory || "other",
      tags: data.noticeTags || [],
      sourceCollection: "physical_resources",
      sourceId: docRef.id,
      registeredBy: data.registeredBy,
      registeredByName,
    });
  }

  return docRef.id;
}

export async function updatePhysicalResource(
  id: string,
  data: Partial<PhysicalResource>,
  registeredBy: string,
  registeredByName: string
): Promise<void> {
  await updateDoc(doc(db, "physical_resources", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });

  if (data.noticeUrl && isValidUrl(data.noticeUrl) && data.noticeTitle) {
    await autoLinkNotice({
      title: data.noticeTitle,
      url: data.noticeUrl,
      category: data.noticeCategory || "other",
      tags: data.noticeTags || [],
      sourceCollection: "physical_resources",
      sourceId: id,
      registeredBy,
      registeredByName,
    });
  }
}

export async function deletePhysicalResource(id: string): Promise<void> {
  await deleteDoc(doc(db, "physical_resources", id));
}

// ─────────────────────────────────────────────
// 아이디어/협업
// ─────────────────────────────────────────────

export async function getAllIdeas(): Promise<IdeaPost[]> {
  const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as IdeaPost[];
}

export async function addIdea(
  data: Omit<IdeaPost, "id" | "createdAt" | "updatedAt" | "viewCount">
): Promise<string> {
  const docRef = await addDoc(collection(db, "ideas"), {
    ...data,
    viewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (data.noticeUrl && isValidUrl(data.noticeUrl) && data.noticeTitle) {
    await autoLinkNotice({
      title: data.noticeTitle,
      url: data.noticeUrl,
      category: data.noticeCategory || "other",
      tags: data.noticeTags || [...(data.tags || [])],
      sourceCollection: "ideas",
      sourceId: docRef.id,
      registeredBy: data.authorId,
      registeredByName: data.authorName,
    });
  }

  return docRef.id;
}

export async function updateIdea(
  id: string,
  data: Partial<IdeaPost>
): Promise<void> {
  await updateDoc(doc(db, "ideas", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteIdea(id: string): Promise<void> {
  await deleteDoc(doc(db, "ideas", id));
}

// ─────────────────────────────────────────────
// 인재·채용
// ─────────────────────────────────────────────

export async function getAllTalentPosts(): Promise<TalentPost[]> {
  const q = query(collection(db, "talent"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as TalentPost[];
}

export async function addTalentPost(
  data: Omit<TalentPost, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, "talent"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (data.noticeUrl && isValidUrl(data.noticeUrl) && data.noticeTitle) {
    await autoLinkNotice({
      title: data.noticeTitle,
      url: data.noticeUrl,
      category: data.noticeCategory || "recruitment",
      tags: data.noticeTags || [...(data.skills || [])],
      sourceCollection: "talent",
      sourceId: docRef.id,
      registeredBy: data.authorId,
      registeredByName: data.authorName,
    });
  }

  return docRef.id;
}

export async function updateTalentPost(
  id: string,
  data: Partial<TalentPost>
): Promise<void> {
  await updateDoc(doc(db, "talent", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTalentPost(id: string): Promise<void> {
  await deleteDoc(doc(db, "talent", id));
}
