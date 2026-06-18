"use client";
// ============================================================
// 1:1 채팅 창 — 카카오톡 스타일 실시간 메시지
// 보안: 채팅 참여자(senderId/receiverId)만 읽기·쓰기 가능
// ============================================================

import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Chat, ChatMessage } from "@/types";
import {
  subscribeChatMessages,
  sendMessage,
  markChatAsRead,
} from "@/services/chatService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { timeAgo, getInitial } from "@/utils/helpers";

interface Props {
  chatId: string;
}

export default function ChatWindow({ chatId }: Props) {
  const router = useRouter();
  const { firebaseUser, userProfile } = useAuthContext();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 채팅방 정보 로드
  useEffect(() => {
    async function loadChat() {
      const snap = await getDoc(doc(db, "chats", chatId));
      if (snap.exists()) {
        setChat({ id: snap.id, ...snap.data() } as Chat);
      }
      setLoadingChat(false);
    }
    loadChat();
  }, [chatId]);

  // 메시지 실시간 구독
  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeChatMessages(chatId, (msgs) => {
      setMessages(msgs);
      // 읽음 처리
      if (firebaseUser?.uid) {
        markChatAsRead(chatId, firebaseUser.uid);
      }
    });
    return () => unsub();
  }, [chatId, firebaseUser?.uid]);

  // 새 메시지가 오면 스크롤 아래로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 보안 확인: 현재 사용자가 채팅 참여자인지 확인
  const isParticipant = chat?.participants.includes(firebaseUser?.uid || "");

  const otherUid = chat?.participants.find((p) => p !== firebaseUser?.uid) || "";
  const otherName = chat?.participantNames[otherUid] || "대화 상대";
  const otherPhoto = chat?.participantPhotos[otherUid] || "";

  async function handleSend() {
    if (!input.trim() || !firebaseUser || !userProfile || !chat || sending) return;
    setSending(true);
    const msg = input.trim();
    setInput("");
    try {
      await sendMessage(chatId, firebaseUser.uid, userProfile.name, otherUid, msg);
    } catch (err) {
      console.error("[ChatWindow] 전송 오류:", err);
      setInput(msg); // 전송 실패 시 원복
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loadingChat) {
    return <div className="flex items-center justify-center h-full text-slate-400 text-sm">불러오는 중...</div>;
  }

  if (!isParticipant) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-slate-500">이 채팅방에 접근 권한이 없습니다.</p>
        <button onClick={() => router.back()} className="mt-3 text-blue-600 text-sm hover:underline">← 뒤로가기</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 채팅 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-blue-600">
          <ArrowLeft size={20} />
        </button>
        {otherPhoto ? (
          <img src={otherPhoto} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-xs font-bold text-teal-700">
            {getInitial(otherName)}
          </div>
        )}
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{otherName}</span>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50 dark:bg-slate-800/30">
        {messages.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-400">
            대화를 시작해보세요! 📨
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === firebaseUser?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fadeIn`}>
              <div className="max-w-[75%]">
                {/* 상대방 이름 표시 */}
                {!isMe && (
                  <p className="text-[10px] text-slate-400 mb-1 ml-1">{msg.senderName}</p>
                )}
                <div className={isMe ? "chat-bubble-me" : "chat-bubble-other"}>
                  <p className="text-sm">{msg.message}</p>
                </div>
                <p className={`text-[9px] text-slate-400 mt-0.5 ${isMe ? "text-right" : "text-left"}`}>
                  {timeAgo(msg.createdAt)}
                  {isMe && (
                    <span className="ml-1">{msg.read ? "읽음" : "•"}</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 메시지 입력창 */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="
              flex-1 h-10 px-4 rounded-full text-sm
              bg-slate-100 dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              text-slate-700 dark:text-slate-200
              placeholder:text-slate-400
              focus:outline-none focus:border-blue-500
            "
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="
              w-10 h-10 rounded-full bg-blue-600 text-white
              flex items-center justify-center
              hover:bg-blue-700 disabled:opacity-40
              transition-colors duration-150
            "
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
