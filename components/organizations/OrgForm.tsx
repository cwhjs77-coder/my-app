"use client";
// ============================================================
// 기관/기업 등록·수정 폼 — 외부 공고 URL 자동 연동 포함
// ============================================================

import { useState } from "react";
import { Building2, Globe, MapPin, AlignLeft } from "lucide-react";
import { Organization, OrgType, ORG_TYPE_LABEL, NoticeCategory } from "@/types";
import { addOrganization, updateOrganization } from "@/services/orgService";
import { useAuthContext } from "@/context/AuthContext";
import FileUpload from "@/components/ui/FileUpload";
import ExternalNoticeField from "@/components/ui/ExternalNoticeField";
import { Attachment } from "@/types";
import { parseTags } from "@/utils/helpers";

interface Props {
  existing?: Organization;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function OrgForm({ existing, onSuccess, onCancel }: Props) {
  const { userProfile } = useAuthContext();

  const [name, setName] = useState(existing?.name || "");
  const [type, setType] = useState<OrgType>(existing?.type || "company");
  const [homepage, setHomepage] = useState(existing?.homepage || "");
  const [address, setAddress] = useState(existing?.address || "");
  const [description, setDescription] = useState(existing?.description || "");

  // 외부 공고 URL 필드
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeUrl, setNoticeUrl] = useState("");
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>("other");
  const [noticeTags, setNoticeTags] = useState("");

  // 첨부파일
  const [attachments, setAttachments] = useState<Attachment[]>(existing?.attachments || []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("기관명을 입력해주세요."); return; }
    if (!userProfile) { setError("로그인이 필요합니다."); return; }

    setLoading(true);
    setError(null);

    const data: Omit<Organization, "id" | "createdAt" | "updatedAt"> = {
      name: name.trim(),
      type,
      homepage: homepage.trim(),
      address: address.trim(),
      description: description.trim(),
      managerId: userProfile.uid,
      managerEmail: userProfile.email,
      noticeUrl: noticeUrl.trim(),
      noticeTitle: noticeTitle.trim(),
      noticeCategory,
      noticeTags: parseTags(noticeTags),
      attachments,
    };

    try {
      if (existing) {
        await updateOrganization(existing.id, data, userProfile.uid, userProfile.name);
      } else {
        await addOrganization(data, userProfile.uid, userProfile.name);
      }
      onSuccess();
    } catch (err) {
      console.error("[OrgForm] 저장 오류:", err);
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
        {existing ? "기관 정보 수정" : "신규 기관/기업 등록"}
      </h2>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 기관명 */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">기관/기업명 *</label>
        <div className="relative">
          <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 경남테크노파크" required
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      {/* 기관 유형 */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">기관 유형</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(ORG_TYPE_LABEL) as [OrgType, string][]).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setType(key)}
              className={`h-9 rounded-lg text-xs font-medium border transition-colors duration-150 ${type === key ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 홈페이지 */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">홈페이지 URL</label>
        <div className="relative">
          <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="url" value={homepage} onChange={(e) => setHomepage(e.target.value)} placeholder="https://www.example.or.kr"
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      {/* 주소 */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">주소</label>
        <div className="relative">
          <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="경남 창원시..."
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      {/* 소개 */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">기관 소개</label>
        <div className="relative">
          <AlignLeft size={15} className="absolute left-3 top-3 text-slate-400" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            placeholder="기관/기업 소개를 입력해주세요."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      {/* 외부 공고 URL 자동 연동 */}
      <ExternalNoticeField
        noticeTitle={noticeTitle} noticeUrl={noticeUrl}
        noticeCategory={noticeCategory} noticeTags={noticeTags}
        onChangeTitle={setNoticeTitle} onChangeUrl={setNoticeUrl}
        onChangeCategory={setNoticeCategory} onChangeTags={setNoticeTags}
      />

      {/* 파일 첨부 */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">첨부파일</label>
        <FileUpload
          storagePath={`organizations/${Date.now()}`}
          onUploaded={(att) => setAttachments((prev) => [...prev, att])}
          existingFiles={attachments}
          onDelete={(att) => setAttachments((prev) => prev.filter((a) => a.url !== att.url))}
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={loading}
          className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium">
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
