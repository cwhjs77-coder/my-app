"use client";
// ============================================================
// 아이디어·협업 목록 + 등록 폼 통합 컴포넌트
// ============================================================

import { useEffect, useState } from "react";
import { Lightbulb, Plus, ExternalLink, Eye } from "lucide-react";
import { IdeaPost, NoticeCategory } from "@/types";
import { getAllIdeas, addIdea, updateIdea } from "@/services/resourceService";
import { useAuthContext } from "@/context/AuthContext";
import FileUpload from "@/components/ui/FileUpload";
import ExternalNoticeField from "@/components/ui/ExternalNoticeField";
import { Attachment } from "@/types";
import { formatDate, parseTags } from "@/utils/helpers";

export default function IdeaList() {
  const { userProfile } = useAuthContext();
  const [items, setItems] = useState<IdeaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<IdeaPost | undefined>();
  const [selected, setSelected] = useState<IdeaPost | null>(null);

  // 폼 상태
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [recruiting, setRecruiting] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeUrl, setNoticeUrl] = useState("");
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>("other");
  const [noticeTags, setNoticeTags] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setItems(await getAllIdeas());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openForm(item?: IdeaPost) {
    setEditTarget(item);
    setTitle(item?.title || "");
    setContent(item?.content || "");
    setTagsStr((item?.tags || []).join(", "));
    setRecruiting(item?.recruiting ?? false);
    setAttachments(item?.attachments || []);
    setNoticeTitle(""); setNoticeUrl(""); setNoticeTags("");
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !userProfile) return;
    setFormLoading(true); setFormError(null);
    try {
      const data = {
        title: title.trim(), content: content.trim(),
        authorId: userProfile.uid, authorName: userProfile.name,
        authorOrg: userProfile.organization,
        tags: parseTags(tagsStr), recruiting,
        noticeUrl: noticeUrl.trim(), noticeTitle: noticeTitle.trim(),
        noticeCategory, noticeTags: parseTags(noticeTags), attachments,
      };
      if (editTarget) { await updateIdea(editTarget.id, data); }
      else { await addIdea(data); }
      setShowForm(false); load();
    } catch { setFormError("저장 중 오류가 발생했습니다."); }
    finally { setFormLoading(false); }
  }

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{editTarget ? "아이디어 수정" : "아이디어/협업 등록"}</h2>
        {formError && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-700">{formError}</div>}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">제목 *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="아이디어 또는 협업 제안 제목" required
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">내용</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="상세 내용을 입력해주세요."
            className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">태그 (쉼표 구분)</label>
          <input type="text" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="예: AI, 환경, 스타트업"
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">협업 모집</label>
          <button type="button" onClick={() => setRecruiting((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${recruiting ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${recruiting ? "translate-x-5" : ""}`} />
          </button>
          <span className={`text-xs ${recruiting ? "text-blue-600" : "text-slate-400"}`}>{recruiting ? "모집 중" : "모집 안함"}</span>
        </div>
        <ExternalNoticeField noticeTitle={noticeTitle} noticeUrl={noticeUrl} noticeCategory={noticeCategory} noticeTags={noticeTags} onChangeTitle={setNoticeTitle} onChangeUrl={setNoticeUrl} onChangeCategory={setNoticeCategory} onChangeTags={setNoticeTags} />
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">첨부파일</label><FileUpload storagePath={`ideas/${Date.now()}`} onUploaded={(a) => setAttachments((p) => [...p, a])} existingFiles={attachments} onDelete={(a) => setAttachments((p) => p.filter((x) => x.url !== a.url))} /></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300">취소</button>
          <button type="submit" disabled={formLoading} className="flex-[2] h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">{formLoading ? "저장 중..." : "등록"}</button>
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
            {selected.authorId === userProfile?.uid && <button onClick={() => { openForm(selected); setSelected(null); }} className="text-xs text-slate-500 hover:text-blue-600 ml-2">수정</button>}
          </div>
          <p className="text-xs text-slate-400">{selected.authorName} · {selected.authorOrg} · {formatDate(selected.createdAt)}</p>
          {selected.recruiting && <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700">협업 모집 중</span>}
          {selected.content && <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selected.content}</p>}
          <div className="flex flex-wrap gap-1.5">{selected.tags?.map((t) => <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{t}</span>)}</div>
          {selected.attachments?.map((att, i) => <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink size={12} />{att.name}</a>)}
          {selected.noticeUrl && <a href={selected.noticeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 hover:underline"><ExternalLink size={14} />{selected.noticeTitle || "공고 바로가기"}</a>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">아이디어·협업 ({items.length})</h2>
        {userProfile && <button onClick={() => openForm()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"><Plus size={14} /> 등록</button>}
      </div>
      {loading ? <div className="py-10 text-center text-slate-400 text-sm">불러오는 중...</div> : items.length === 0 ? <div className="py-10 text-center text-slate-400 text-sm">등록된 아이디어가 없습니다.</div> : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} onClick={() => setSelected(item)} className="card p-3 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start gap-2">
                <Lightbulb size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.authorName} · {formatDate(item.createdAt)}</p>
                  {item.recruiting && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700">협업모집</span>}
                </div>
                <Eye size={12} className="text-slate-400 flex-shrink-0 mt-1" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
