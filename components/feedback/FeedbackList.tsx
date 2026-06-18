"use client";
// ============================================================
// 개선요청 게시판 — 등록 + 목록 + 상세 통합
// ============================================================

import { useEffect, useState } from "react";
import { ClipboardList, Plus, MessageSquare } from "lucide-react";
import { FeedbackPost, FeedbackStatus } from "@/types";
import { getAllFeedback, addFeedback, replyToFeedback, resolveFeedback } from "@/services/feedbackService";
import { useAuthContext } from "@/context/AuthContext";
import { formatDate, timeAgo } from "@/utils/helpers";

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  pending: "접수됨",
  in_progress: "처리 중",
  resolved: "해결됨",
};
const STATUS_COLOR: Record<FeedbackStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

export default function FeedbackList() {
  const { userProfile, isAdmin } = useAuthContext();
  const [items, setItems] = useState<FeedbackPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<FeedbackPost | null>(null);
  const [adminReply, setAdminReply] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() { setLoading(true); setItems(await getAllFeedback()); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !userProfile) return;
    setFormLoading(true); setFormError(null);
    try {
      await addFeedback({ title: title.trim(), content: content.trim(), authorId: userProfile.uid, authorName: userProfile.name });
      setTitle(""); setContent(""); setShowForm(false); load();
    } catch { setFormError("등록 중 오류가 발생했습니다."); }
    finally { setFormLoading(false); }
  }

  async function handleReply() {
    if (!selected || !adminReply.trim()) return;
    await replyToFeedback(selected.id, adminReply.trim());
    setAdminReply(""); load();
    const updated = (await getAllFeedback()).find((f) => f.id === selected.id);
    if (updated) setSelected(updated);
  }

  async function handleResolve() {
    if (!selected) return;
    await resolveFeedback(selected.id);
    const updated = (await getAllFeedback()).find((f) => f.id === selected.id);
    if (updated) setSelected(updated);
    load();
  }

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">개선요청 등록</h2>
        {formError && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-700">{formError}</div>}
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">제목 *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="개선이 필요한 사항의 제목" required
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" /></div>
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">상세 내용</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="불편사항이나 개선 요청 내용을 상세히 작성해주세요."
            className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:border-blue-500" /></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300">취소</button>
          <button type="submit" disabled={formLoading} className="flex-[2] h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">{formLoading ? "등록 중..." : "등록"}</button>
        </div>
      </form>
    );
  }

  if (selected) {
    return (
      <div className="p-4 space-y-4 animate-fadeIn">
        <button onClick={() => setSelected(null)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← 목록으로</button>
        <div className="card p-4 space-y-3">
          <div className="flex items-start justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex-1">{selected.title}</h2>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${STATUS_COLOR[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>
          </div>
          <p className="text-xs text-slate-400">{selected.authorName} · {timeAgo(selected.createdAt)}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selected.content}</p>

          {/* 관리자 답변 */}
          {selected.adminReply && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">관리자 답변</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{selected.adminReply}</p>
            </div>
          )}

          {/* Admin 답변 입력 */}
          {isAdmin && selected.status !== "resolved" && (
            <div className="space-y-2">
              <textarea value={adminReply} onChange={(e) => setAdminReply(e.target.value)} rows={3} placeholder="관리자 답변을 입력하세요."
                className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:border-blue-500" />
              <div className="flex gap-2">
                <button type="button" onClick={handleReply} className="flex-1 h-9 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">답변 저장</button>
                <button type="button" onClick={handleResolve} className="flex-1 h-9 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700">해결 완료</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">개선요청 게시판 ({items.length})</h2>
        {userProfile && <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"><Plus size={14} /> 등록</button>}
      </div>
      {loading ? <div className="py-10 text-center text-slate-400 text-sm">불러오는 중...</div> : items.length === 0 ? <div className="py-10 text-center text-slate-400 text-sm">등록된 개선요청이 없습니다.</div> : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} onClick={() => setSelected(item)} className="card p-3 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start gap-2">
                <ClipboardList size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate flex-1">{item.title}</p>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] flex-shrink-0 ${STATUS_COLOR[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.authorName} · {timeAgo(item.createdAt)}</p>
                  {item.adminReply && <div className="flex items-center gap-1 mt-0.5"><MessageSquare size={10} className="text-blue-500" /><span className="text-[10px] text-blue-600">답변 있음</span></div>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
