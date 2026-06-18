"use client";
// ============================================================
// 인재·채용 목록 + 등록 폼 통합 컴포넌트
// ============================================================

import { useEffect, useState } from "react";
import { Target, Plus, ExternalLink } from "lucide-react";
import { TalentPost, TalentType, NoticeCategory } from "@/types";
import { getAllTalentPosts, addTalentPost, updateTalentPost } from "@/services/resourceService";
import { useAuthContext } from "@/context/AuthContext";
import FileUpload from "@/components/ui/FileUpload";
import ExternalNoticeField from "@/components/ui/ExternalNoticeField";
import { Attachment } from "@/types";
import { formatDate, parseTags } from "@/utils/helpers";

export default function TalentList() {
  const { userProfile } = useAuthContext();
  const [items, setItems] = useState<TalentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<TalentPost | undefined>();
  const [selected, setSelected] = useState<TalentPost | null>(null);
  const [filterType, setFilterType] = useState<"all" | TalentType>("all");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<TalentType>("recruitment");
  const [skillsStr, setSkillsStr] = useState("");
  const [deadline, setDeadline] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeUrl, setNoticeUrl] = useState("");
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>("recruitment");
  const [noticeTags, setNoticeTags] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() { setLoading(true); setItems(await getAllTalentPosts()); setLoading(false); }
  useEffect(() => { load(); }, []);

  function openForm(item?: TalentPost) {
    setEditTarget(item);
    setTitle(item?.title || ""); setContent(item?.content || "");
    setType(item?.type || "recruitment"); setSkillsStr((item?.skills || []).join(", "));
    setDeadline(item?.deadline || ""); setSalary(item?.salary || ""); setLocation(item?.location || "");
    setAttachments(item?.attachments || []); setNoticeTitle(""); setNoticeUrl(""); setNoticeTags("");
    setFormError(null); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !userProfile) return;
    setFormLoading(true); setFormError(null);
    try {
      const data = {
        title: title.trim(), content: content.trim(), type,
        organizationId: userProfile.organizationId, organizationName: userProfile.organization,
        authorId: userProfile.uid, authorName: userProfile.name,
        skills: parseTags(skillsStr), deadline, salary, location,
        noticeUrl: noticeUrl.trim(), noticeTitle: noticeTitle.trim(),
        noticeCategory, noticeTags: parseTags(noticeTags), attachments,
      };
      if (editTarget) { await updateTalentPost(editTarget.id, data); }
      else { await addTalentPost(data); }
      setShowForm(false); load();
    } catch { setFormError("저장 중 오류가 발생했습니다."); }
    finally { setFormLoading(false); }
  }

  const filtered = filterType === "all" ? items : items.filter((i) => i.type === filterType);

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{editTarget ? "수정" : "인재·채용 등록"}</h2>
        {formError && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-700">{formError}</div>}
        <div className="grid grid-cols-2 gap-2">
          {(["recruitment", "talent_profile"] as TalentType[]).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`h-10 rounded-lg text-xs font-medium border transition-colors duration-150 ${type === t ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}>
              {t === "recruitment" ? "채용 공고" : "인재 프로필"}
            </button>
          ))}
        </div>
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">제목 *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "recruitment" ? "예: 2025 상반기 SW개발자 채용" : "예: AI 전문가 협업 파트너 구합니다"} required
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" /></div>
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">상세 내용</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="상세 내용을 입력해주세요."
            className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:border-blue-500" /></div>
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">기술/역량 키워드</label>
          <input type="text" value={skillsStr} onChange={(e) => setSkillsStr(e.target.value)} placeholder="예: Python, AI, 데이터분석"
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" /></div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">마감일</label><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full h-10 px-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">급여/보상</label><input type="text" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="협의 가능" className="w-full h-10 px-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" /></div>
          <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">근무지</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="예: 창원" className="w-full h-10 px-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" /></div>
        </div>
        <ExternalNoticeField noticeTitle={noticeTitle} noticeUrl={noticeUrl} noticeCategory={noticeCategory} noticeTags={noticeTags} onChangeTitle={setNoticeTitle} onChangeUrl={setNoticeUrl} onChangeCategory={setNoticeCategory} onChangeTags={setNoticeTags} />
        <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">첨부파일</label><FileUpload storagePath={`talent/${Date.now()}`} onUploaded={(a) => setAttachments((p) => [...p, a])} existingFiles={attachments} onDelete={(a) => setAttachments((p) => p.filter((x) => x.url !== a.url))} /></div>
        <div className="flex gap-2"><button type="button" onClick={() => setShowForm(false)} className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300">취소</button><button type="submit" disabled={formLoading} className="flex-[2] h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">{formLoading ? "저장 중..." : "등록"}</button></div>
      </form>
    );
  }

  if (selected) {
    return (
      <div className="p-4 space-y-4 animate-fadeIn">
        <button onClick={() => setSelected(null)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← 목록으로</button>
        <div className="card p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{selected.title}</h2>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${selected.type === "recruitment" ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700"}`}>{selected.type === "recruitment" ? "채용 공고" : "인재 프로필"}</span>
            </div>
            {selected.authorId === userProfile?.uid && <button onClick={() => { openForm(selected); setSelected(null); }} className="text-xs text-slate-500 hover:text-blue-600">수정</button>}
          </div>
          {selected.organizationName && <p className="text-sm text-slate-500">🏢 {selected.organizationName}</p>}
          <div className="flex flex-wrap gap-1.5">{selected.skills?.map((s) => <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700">{s}</span>)}</div>
          {selected.content && <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selected.content}</p>}
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
            {selected.deadline && <p>마감: {selected.deadline}</p>}
            {selected.salary && <p>급여: {selected.salary}</p>}
            {selected.location && <p>위치: {selected.location}</p>}
          </div>
          {selected.attachments?.map((att, i) => <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink size={12} />{att.name}</a>)}
          {selected.noticeUrl && <a href={selected.noticeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 hover:underline"><ExternalLink size={14} />{selected.noticeTitle || "공고 바로가기"}</a>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">인재·채용 ({items.length})</h2>
        {userProfile && <button onClick={() => openForm()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"><Plus size={14} /> 등록</button>}
      </div>
      <div className="flex gap-1.5">
        {[["all","전체"],["recruitment","채용공고"],["talent_profile","인재프로필"]].map(([k,l]) => (
          <button key={k} onClick={() => setFilterType(k as any)} className={`px-3 py-1 rounded-full text-xs border transition-colors duration-150 ${filterType === k ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}>{l}</button>
        ))}
      </div>
      {loading ? <div className="py-10 text-center text-slate-400 text-sm">불러오는 중...</div> : filtered.length === 0 ? <div className="py-10 text-center text-slate-400 text-sm">등록된 게시물이 없습니다.</div> : (
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li key={item.id} onClick={() => setSelected(item)} className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === "recruitment" ? "bg-pink-100 dark:bg-pink-900/40" : "bg-blue-100 dark:bg-blue-900/40"}`}>
                <Target size={18} className={item.type === "recruitment" ? "text-pink-600" : "text-blue-600"} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.organizationName || item.authorName} · {formatDate(item.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
