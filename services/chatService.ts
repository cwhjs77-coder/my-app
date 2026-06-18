// ============================================================
// 1:1 채팅 서비스 — Firestore 기반 실시간 비밀 채팅
// chats/{chatId}/messages 서브컬렉션 구조 사용
// ============================================================

import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  increment,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Chat, ChatMessage } from "@/types";
import { getChatId } from "@/utils/helpers";

// 채팅방 생성 또는 기존 채팅방 ID 반환
export async function getOrCreateChat(
  uid1: string,
  name1: string,
  photo1: string,
  uid2: string,
  name2: string,
  photo2: string
): Promise<string> {
  const chatId = getChatId(uid1, uid2);
  const chatRef = doc(db, "chats", chatId);
  const snapshot = await getDoc(chatRef);

  if (!snapshot.exists()) {
    const chat: Omit<Chat, "id"> = {
      participants: [uid1, uid2],
      participantNames: { [uid1]: name1, [uid2]: name2 },
      participantPhotos: { [uid1]: photo1, [uid2]: photo2 },
      lastMessage: "",
      lastMessageTime: serverTimestamp() as any,
      unreadCount: { [uid1]: 0, [uid2]: 0 },
      createdAt: serverTimestamp() as any,
    };
    await setDoc(chatRef, chat);
  }

  return chatId;
}

// 사용자가 참여한 채팅방 목록 실시간 구독
export function subscribeMyChatList(
  uid: string,
  callback: (chats: Chat[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid)
  );

  return onSnapshot(q, (snapshot) => {
    const chats: Chat[] = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() })) as Chat[];
    // 마지막 메시지 시간 내림차순 정렬
    chats.sort((a, b) => {
      const ta = a.lastMessageTime instanceof Date
        ? a.lastMessageTime.getTime()
        : (a.lastMessageTime as any)?.seconds * 1000 || 0;
      const tb = b.lastMessageTime instanceof Date
        ? b.lastMessageTime.getTime()
        : (b.lastMessageTime as any)?.seconds * 1000 || 0;
      return tb - ta;
    });
    callback(chats);
  });
}

// 채팅방 메시지 실시간 구독
export function subscribeChatMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ChatMessage[];
    callback(messages);
  });
}

// 메시지 전송
export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  receiverId: string,
  message: string
): Promise<void> {
  // 메시지 서브컬렉션에 추가
  await addDoc(collection(db, "chats", chatId, "messages"), {
    chatId,
    senderId,
    senderName,
    receiverId,
    message,
    read: false,
    createdAt: serverTimestamp(),
  });

  // 채팅방 문서 업데이트 (마지막 메시지, 미읽음 카운트)
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: message,
    lastMessageTime: serverTimestamp(),
    [`unreadCount.${receiverId}`]: increment(1),
  });
}

// 메시지 읽음 처리 (채팅창 진입 시 호출)
export async function markChatAsRead(chatId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, "chats", chatId), {
    [`unreadCount.${uid}`]: 0,
  });
}

// 사용자 목록 조회 (채팅 상대 선택용)
export async function getAllUsersForChat(
  currentUid: string
): Promise<Array<{ uid: string; name: string; photoURL: string; role: string }>> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs
    .filter((d) => d.id !== currentUid)
    .map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        name: data.name || "이름없음",
        photoURL: data.photoURL || "",
        role: data.role || "member",
      };
    });
}
