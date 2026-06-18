"use client";
// ============================================================
// 공지/공고 목록 — 외부 링크 카드 + 직접 등록
// ============================================================

import { useEffect, useState } from "react";
import { Bell, ExternalLink, Plus, Eye } from "lucide-react";
import { Notice, NoticeCategory, NOTICE_CATEGORY_LABEL } from "@/types";
import {
  getAllNotices,
  addNotice,
  deleteNotice,
  incrementViewCount,
} from "@/services/noticeService";
import { useAuthContext } from "@/context/AuthContext";
import { formatDate, parseTags } from "@/utils/helpers";

const CATEGORY_COLORS: Record<NoticeCategory, string> = {
  policy: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  research: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  recruitment: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  other: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export default function NoticeList() {
  const { userProfile, isAdmin, isApprovedManager } = useAuthContext();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState<NoticeCategory | "all">("all");

  // 직접 등록 폼 상태
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("policy");
  const [tagsStr, setTagsStr] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setNotices(await getAllNotices());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim() || !userProfile) return;
    setFormLoading(true); setFormError(null);
    try {
      await addNotice({
        title: title.trim(),
        url: url.trim(),
        category,
        tags: parseTags(tagsStr),
        direct: true,
        registeredBy: userProfile.uid,
        registeredByName: userProfile.name,
      });
      setTitle(""); setUrl(""); setTagsStr(""); setShowForm(false); load();
    } catch { setFormError("등록 중 오류가 발생했습니다."); }
    finally { setFormLoading(false); }
  }

  async function handleOpen(notice: Notice) {
    await incrementViewCount(notice.id);
    window.open(notice.url, "_blank", "noopener,noreferrer");
  }

  const filtered = filterCat === "all" ? notices : notices.filter((n) => n.category === filterCat);

  const canWrite = isAdmin || isApprovedManager;

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">공지/공고 직접 등록</h2>
        {formError && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-700">{formError}</div>}
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">공고 제목 *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공고 제목" required
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" /></div>
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">외부 URL *</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" /></div>
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as NoticeCategory)}
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500">
            {(Object.entries(NOTICE_CATEGORY_LABEL) as [NoticeCategory, string][]).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select></div>
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">태그 (쉼표 구분)</label>
          <input type="text" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="예: AI, 채용, 반도체"
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" /></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300">취소</button>
          <button type="submit" disabled={formLoading} className="flex-[2] h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">{formLoading ? "등록 중..." : "등록"}</button>
        </div>
      </form>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">공지/공고 ({notices.length})</h2>
        {canWrite && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">
            <Plus size={14} /> 등록
          </button>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[["all","전체"], ["policy","정책공고"], ["research","연구공모"], ["recruitment","채용"], ["other","기타"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilterCat(k as any)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-colors duration-150 ${filterCat === k ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm">등록된 공지가 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((notice) => (
            <li key={notice.id} onClick={() => handleOpen(notice)}
              className="card p-3 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start gap-2">
                <Bell size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate flex-1">{notice.title}</p>
                    <ExternalLink size={12} className="text-slate-400 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${CATEGORY_COLORS[notice.category]}`}>
                      {NOTICE_CATEGORY_LABEL[notice.category]}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDate(notice.createdAt)}</span>
                    {notice.viewCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                        <Eye size={9} /> {notice.viewCount}
                      </span>
                    )}
                  </div>
                  {notice.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {notice.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
