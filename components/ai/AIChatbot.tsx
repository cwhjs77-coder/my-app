"use client";
// ============================================================
// AI 챗봇 컴포넌트 — OpenAI API 연동 (경남 정책 특화)
// ============================================================

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Loader2, RefreshCw } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_SYSTEM_PROMPT = `당신은 경남 지산학연 네트워크 플랫폼의 AI 비서입니다.
경상남도의 산학연관 협력, 기업지원사업, 대학 정보, RISE 사업, 글로컬대학 사업,
취업 정보, 연구개발 공모, 정책 안내 등을 전문적으로 안내합니다.
항상 친절하고 정확한 정보를 한국어로 답변해주세요.
모르는 내용은 솔직하게 모른다고 말하고, 관련 기관 연락처를 안내해주세요.`;

const QUICK_QUESTIONS = [
  "RISE 사업이 무엇인가요?",
  "경남 기업지원사업 찾는 방법?",
  "글로컬대학 30 사업이란?",
  "산학협력 신청 방법?",
  "경남 스타트업 지원 정보",
];

export default function AIChatbot() {
  const { userProfile } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(userInput: string) {
    if (!userInput.trim() || loading) return;

    const userMessage: Message = { role: "user", content: userInput.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt: INITIAL_SYSTEM_PROMPT,
          userId: userProfile?.uid,
        }),
      });

      if (!response.ok) throw new Error("API 오류");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? data.answer ?? "응답을 받지 못했습니다." }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function resetChat() {
    setMessages([]);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      {/* AI 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">경남 AI 정책비서</p>
            <p className="text-[10px] text-blue-200">RISE · 글로컬 · 기업지원 전문</p>
          </div>
        </div>
        <button onClick={resetChat} className="text-blue-200 hover:text-white" title="대화 초기화">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50 dark:bg-slate-800/30">
        {/* 초기 안내 메시지 */}
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-white" />
              </div>
              <div className="chat-bubble-other">
                <p className="text-sm">안녕하세요! 저는 경남 지산학연 네트워크 플랫폼의 AI 정책비서입니다. 🏛️</p>
                <p className="text-sm mt-2">경상남도의 산학연관 협력, 기업지원사업, RISE 사업, 취업 정보 등을 안내해드립니다.</p>
                <p className="text-sm mt-2">아래 빠른 질문을 클릭하거나 직접 질문해주세요!</p>
              </div>
            </div>

            {/* 빠른 질문 버튼 */}
            <div className="flex flex-col gap-2 ml-9">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-left px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-700 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  💬 {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 대화 메시지 */}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 animate-fadeIn ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={msg.role === "user" ? "chat-bubble-me" : "chat-bubble-other"}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {/* 로딩 중 표시 */}
        {loading && (
          <div className="flex gap-2 animate-fadeIn">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="chat-bubble-other flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-blue-500" />
              <span className="text-sm text-slate-500">생각 중...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="경남 정책이나 사업을 물어보세요..."
            disabled={loading}
            className="
              flex-1 h-10 px-4 rounded-full text-sm
              bg-slate-100 dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              text-slate-700 dark:text-slate-200
              placeholder:text-slate-400
              focus:outline-none focus:border-blue-500
              disabled:opacity-60
            "
          />
          <button type="submit" disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition-colors">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
