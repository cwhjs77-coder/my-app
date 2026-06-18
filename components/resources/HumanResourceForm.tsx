"use client";
// ============================================================
// 인적 자원 등록·수정 폼
// ============================================================

import { useState } from "react";
import { User, Building2, Briefcase, Phone, Mail } from "lucide-react";
import { HumanResource, NoticeCategory } from "@/types";
import { addHumanResource, updateHumanResource } from "@/services/resourceService";
import { useAuthContext } from "@/context/AuthContext";
import FileUpload from "@/components/ui/FileUpload";
import ExternalNoticeField from "@/components/ui/ExternalNoticeField";
import { Attachment } from "@/types";
import { parseTags } from "@/utils/helpers";

interface Props {
  existing?: HumanResource;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function HumanResourceForm({ existing, onSuccess, onCancel }: Props) {
  const { userProfile } = useAuthContext();

  const [name, setName] = useState(existing?.name || "");
  const [organizationName, setOrganizationName] = useState(existing?.organizationName || userProfile?.organization || "");
  const [position, setPosition] = useState(existing?.position || "");
  const [expertiseStr, setExpertiseStr] = useState((existing?.expertise || []).join(", "));
  const [contact, setContact] = useState(existing?.contact || "");
  const [email, setEmail] = useState(existing?.email || "");
  const [description, setDescription] = useState(existing?.description || "");

  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeUrl, setNoticeUrl] = useState("");
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>("other");
  const [noticeTags, setNoticeTags] = useState("");

  const [attachments, setAttachments] = useState<Attachment[]>(existing?.attachments || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!userProfile) { setError("로그인이 필요합니다."); return; }

    setLoading(true);
    setError(null);

    const data: Omit<HumanResource, "id" | "createdAt" | "updatedAt"> = {
      name: name.trim(),
      organizationId: userProfile.organizationId || "",
      organizationName: organizationName.trim(),
      position: position.trim(),
      expertise: parseTags(expertiseStr),
      contact: contact.trim(),
      email: email.trim(),
      description: description.trim(),
      noticeUrl: noticeUrl.trim(),
      noticeTitle: noticeTitle.trim(),
      noticeCategory,
      noticeTags: parseTags(noticeTags),
      attachments,
      registeredBy: userProfile.uid,
    };

    try {
      if (existing) {
        await updateHumanResource(existing.id, data, userProfile.uid, userProfile.name);
      } else {
        await addHumanResource(data, userProfile.name);
      }
      onSuccess();
    } catch (err) {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
        {existing ? "인적자원 수정" : "인적자원 등록"}
      </h2>

      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">이름 *</label>
        <div className="relative">
          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 홍길동 교수" required
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">소속 기관</label>
        <div className="relative">
          <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="소속 기관명"
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">직책/역할</label>
        <div className="relative">
          <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="예: 교수, 연구원, 전문가"
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">전문 분야 (쉼표로 구분)</label>
        <input type="text" value={expertiseStr} onChange={(e) => setExpertiseStr(e.target.value)} placeholder="예: AI, 로봇공학, 반도체"
          className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">연락처</label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="tel" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="010-0000-0000"
              className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">이메일</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@univ.ac.kr"
              className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">소개</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="간단한 소개를 입력해주세요."
          className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:border-blue-500" />
      </div>

      <ExternalNoticeField
        noticeTitle={noticeTitle} noticeUrl={noticeUrl}
        noticeCategory={noticeCategory} noticeTags={noticeTags}
        onChangeTitle={setNoticeTitle} onChangeUrl={setNoticeUrl}
        onChangeCategory={setNoticeCategory} onChangeTags={setNoticeTags}
      />

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">첨부파일</label>
        <FileUpload
          storagePath={`human_resources/${Date.now()}`}
          onUploaded={(att) => setAttachments((prev) => [...prev, att])}
          existingFiles={attachments}
          onDelete={(att) => setAttachments((prev) => prev.filter((a) => a.url !== att.url))}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={loading}
          className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm">
          취소
        </button>
        <button type="submit" disabled={loading}
          className="flex-[2] h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
          {loading ? "저장 중..." : existing ? "수정 완료" : "등록"}
        </button>
      </div>
    </form>
  );
}
