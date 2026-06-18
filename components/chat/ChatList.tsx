"use client";
// ============================================================
// 채팅 목록 화면 — 내 채팅방 목록 + 새 채팅 시작
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Plus, Search } from "lucide-react";
import { Chat } from "@/types";
import {
  subscribeMyChatList,
  getOrCreateChat,
  getAllUsersForChat,
} from "@/services/chatService";
import { useAuthContext } from "@/context/AuthContext";
import { timeAgo, getInitial } from "@/utils/helpers";

interface UserItem {
  uid: string;
  name: string;
  photoURL: string;
  role: string;
}

export default function ChatList() {
  const router = useRouter();
  const { firebaseUser, userProfile } = useAuthContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = subscribeMyChatList(firebaseUser.uid, setChats);
    return () => unsub();
  }, [firebaseUser?.uid]);

  async function handleSelectUser(user: UserItem) {
    if (!firebaseUser || !userProfile) return;
    setCreatingChat(true);
    try {
      const chatId = await getOrCreateChat(
        firebaseUser.uid, userProfile.name, userProfile.photoURL || "",
        user.uid, user.name, user.photoURL
      );
      router.push(`/dashboard/chat/${chatId}`);
    } finally {
      setCreatingChat(false);
      setShowUserList(false);
    }
  }

  async function handleNewChat() {
    if (!firebaseUser?.uid) return;
    const data = await getAllUsersForChat(firebaseUser.uid);
    setUsers(data);
    setShowUserList(true);
  }

  function getOtherUid(chat: Chat): string {
    return chat.participants.find((p) => p !== firebaseUser?.uid) || "";
  }

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (showUserList) {
    return (
      <div className="p-4 space-y-3 animate-fadeIn">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowUserList(false)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← 뒤로</button>
          <h2 className="font-bold text-slate-800 dark:text-slate-100">대화 상대 선택</h2>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="이름으로 검색..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
        <ul className="space-y-1.5">
          {filteredUsers.map((user) => (
            <li key={user.uid} onClick={() => !creatingChat && handleSelectUser(user)}
              className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                  {getInitial(user.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                <p className="text-xs text-slate-400">{user.role === "admin" ? "관리자" : user.role === "manager" ? "담당자" : "멤버"}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">1:1 채팅</h2>
        <button onClick={handleNewChat}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">
          <Plus size={14} /> 새 채팅
        </button>
      </div>

      {chats.length === 0 ? (
        <div className="py-10 text-center">
          <MessageCircle size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">채팅 내역이 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1">[새 채팅] 버튼으로 대화를 시작해보세요.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {chats.map((chat) => {
            const otherUid = getOtherUid(chat);
            const otherName = chat.participantNames[otherUid] || "알 수 없음";
            const otherPhoto = chat.participantPhotos[otherUid] || "";
            const myUnread = chat.unreadCount[firebaseUser?.uid || ""] || 0;

            return (
              <li key={chat.id} onClick={() => router.push(`/dashboard/chat/${chat.id}`)}
                className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
                {/* 상대방 아바타 */}
                {otherPhoto ? (
                  <img src={otherPhoto} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-sm font-bold text-teal-700 flex-shrink-0">
                    {getInitial(otherName)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{otherName}</p>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{timeAgo(chat.lastMessageTime)}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{chat.lastMessage || "대화를 시작해보세요."}</p>
                </div>

                {/* 미읽음 배지 */}
                {myUnread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {myUnread}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
