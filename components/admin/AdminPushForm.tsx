"use client";
// ============================================================
// 관리자 — 전역 FCM 푸시 알림 발송 UI
// /api/admin/push 엔드포인트와 연동 (Firebase Auth 토큰 검증)
// ============================================================

import { useState } from "react";
import { Bell, Send, Check, AlertCircle } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { INTEREST_KEYWORDS } from "@/types";

interface SendResult {
  sent: number;
  failed: number;
  targetMatched: number;
}

const INPUT_CLS =
  "w-full px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500";

export default function AdminPushForm() {
  const { getIdToken } = useAuthContext();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("/dashboard/notices");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSending(true);
    setError(null);
    setResult(null);

    try {
      // Firebase ID 토큰 획득 (관리자 권한 검증용)
      const idToken = await getIdToken();
      if (!idToken) {
        setError("인증 토큰을 가져오지 못했습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch("/api/admin/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          tags: sendToAll ? [] : selectedTags,
          link: link.trim() || "/dashboard/notices",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "알림 발송에 실패했습니다.");
        return;
      }

      setResult(data);
      setTitle("");
      setBody("");
      setSelectedTags([]);

      // 5초 후 결과 초기화
      setTimeout(() => setResult(null), 5000);
    } catch (err) {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 제목 */}
      <div className="flex items-center gap-2">
        <Bell size={15} className="text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          FCM 푸시 알림 발송
        </h3>
      </div>

      {/* 성공 결과 */}
      {result && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 font-medium mb-1">
            <Check size={14} /> 발송 완료
          </div>
          <p className="text-xs text-green-600 dark:text-green-400">
            대상 {result.targetMatched}명 중 {result.sent}명 성공
            {result.failed > 0 && `, ${result.failed}명 실패`}
          </p>
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-start gap-2">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-3">
        {/* 알림 제목 */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            알림 제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 새 지원사업 공고 안내"
            required
            maxLength={100}
            className={`${INPUT_CLS} h-10`}
          />
        </div>

        {/* 알림 내용 */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            알림 내용 *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="발송할 알림 내용을 입력하세요."
            required
            rows={3}
            maxLength={300}
            className={`${INPUT_CLS} py-2 resize-none`}
          />
          <p className="text-[10px] text-slate-400 text-right mt-0.5">
            {body.length}/300
          </p>
        </div>

        {/* 이동 링크 */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            클릭 시 이동 URL
          </label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/dashboard/notices"
            className={`${INPUT_CLS} h-10`}
          />
        </div>

        {/* 전체/타겟 발송 토글 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {sendToAll ? "전체 사용자 발송" : "관심분야 타겟 발송"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {sendToAll
                ? "승인된 모든 사용자에게 발송됩니다."
                : "선택한 관심분야 사용자에게만 발송됩니다."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSendToAll((v) => !v);
              setSelectedTags([]);
            }}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
              sendToAll ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
            }`}
            aria-label="발송 대상 전환"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                sendToAll ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>

        {/* 관심분야 태그 선택 (타겟 발송 시) */}
        {!sendToAll && (
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              관심분야 선택
              {selectedTags.length > 0 && (
                <span className="ml-1 text-blue-600">({selectedTags.length}개 선택)</span>
              )}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => toggleTag(kw)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    selectedTags.includes(kw)
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400"
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>
            {!sendToAll && selectedTags.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">
                ⚠️ 관심분야를 선택하지 않으면 발송되지 않습니다.
              </p>
            )}
          </div>
        )}

        {/* 발송 버튼 */}
        <button
          type="submit"
          disabled={
            sending ||
            !title.trim() ||
            !body.trim() ||
            (!sendToAll && selectedTags.length === 0)
          }
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={15} />
          {sending ? "발송 중..." : "알림 발송"}
        </button>
      </form>
    </div>
  );
}
