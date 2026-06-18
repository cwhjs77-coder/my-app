"use client";
// ============================================================
// 물적 자원 등록·수정 폼 — 실험실습기자재 카테고리 포함
// ============================================================

import { useState } from "react";
import { Package, Building2, MapPin } from "lucide-react";
import { PhysicalResource, PhysicalResourceCategory, PHYSICAL_CATEGORY_LABEL, NoticeCategory } from "@/types";
import { addPhysicalResource, updatePhysicalResource } from "@/services/resourceService";
import { useAuthContext } from "@/context/AuthContext";
import FileUpload from "@/components/ui/FileUpload";
import ExternalNoticeField from "@/components/ui/ExternalNoticeField";
import { Attachment } from "@/types";
import { parseTags } from "@/utils/helpers";

interface Props {
  existing?: PhysicalResource;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PhysicalResourceForm({ existing, onSuccess, onCancel }: Props) {
  const { userProfile } = useAuthContext();

  const [name, setName] = useState(existing?.name || "");
  const [category, setCategory] = useState<PhysicalResourceCategory>(existing?.category || "equipment");
  const [orgName, setOrgName] = useState(existing?.organizationName || userProfile?.organization || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [location, setLocation] = useState(existing?.location || "");
  const [contact, setContact] = useState(existing?.contact || "");
  const [available, setAvailable] = useState(existing?.available ?? true);

  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeUrl, setNoticeUrl] = useState("");
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>("other");
  const [noticeTags, setNoticeTags] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>(existing?.attachments || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("자원명을 입력해주세요."); return; }
    if (!userProfile) { setError("로그인이 필요합니다."); return; }

    setLoading(true);
    setError(null);

    const data: Omit<PhysicalResource, "id" | "createdAt" | "updatedAt"> = {
      name: name.trim(),
      category,
      organizationId: userProfile.organizationId || "",
      organizationName: orgName.trim(),
      description: description.trim(),
      location: location.trim(),
      contact: contact.trim(),
      available,
      noticeUrl: noticeUrl.trim(),
      noticeTitle: noticeTitle.trim(),
      noticeCategory,
      noticeTags: parseTags(noticeTags),
      attachments,
      registeredBy: userProfile.uid,
    };

    try {
      if (existing) {
        await updatePhysicalResource(existing.id, data, userProfile.uid, userProfile.name);
      } else {
        await addPhysicalResource(data, userProfile.name);
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
        {existing ? "물적자원 수정" : "물적자원 등록"}
      </h2>

      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-300">{error}</div>}

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">자원명 *</label>
        <div className="relative">
          <Package size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 전자현미경 SEM-7000" required
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      {/* 카테고리 선택 — 실험실습기자재 포함 */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">자원 유형 *</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(PHYSICAL_CATEGORY_LABEL) as [PhysicalResourceCategory, string][]).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setCategory(key)}
              className={`h-10 rounded-lg text-xs font-medium border transition-colors duration-150 ${category === key ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">소속 기관</label>
        <div className="relative">
          <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="소속 기관명"
            className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">상세 설명</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="자원에 대한 상세 설명"
          className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:border-blue-500" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">위치</label>
          <div className="relative">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="예: 공학관 302호"
              className="w-full h-10 pl-9 pr-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">연락처</label>
          <input type="tel" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="담당자 연락처"
            className="w-full h-10 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      {/* 이용 가능 여부 */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">이용 가능 여부</label>
        <button type="button" onClick={() => setAvailable((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${available ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${available ? "translate-x-5" : "translate-x-0"}`} />
        </button>
        <span className={`text-xs ${available ? "text-blue-600" : "text-slate-400"}`}>{available ? "이용 가능" : "이용 불가"}</span>
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
          storagePath={`physical_resources/${Date.now()}`}
          onUploaded={(att) => setAttachments((prev) => [...prev, att])}
          existingFiles={attachments}
          onDelete={(att) => setAttachments((prev) => prev.filter((a) => a.url !== att.url))}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} disabled={loading}
          className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm">취소</button>
        <button type="submit" disabled={loading}
          className="flex-[2] h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
          {loading ? "저장 중..." : existing ? "수정 완료" : "등록"}
        </button>
      </div>
    </form>
  );
}
