"use client";
// ============================================================
// 외부 공고 URL 입력 필드 컴포넌트
// (1)~(5) 메뉴 등록 폼에서 공통으로 사용
// URL 입력 시 notices 컬렉션에 자동 연동됨을 안내합니다.
// ============================================================

import { ExternalLink, Info } from "lucide-react";
import { NoticeCategory, NOTICE_CATEGORY_LABEL } from "@/types";
import { parseTags } from "@/utils/helpers";

interface Props {
  noticeTitle: string;
  noticeUrl: string;
  noticeCategory: NoticeCategory;
  noticeTags: string;
  onChangeTitle: (v: string) => void;
  onChangeUrl: (v: string) => void;
  onChangeCategory: (v: NoticeCategory) => void;
  onChangeTags: (v: string) => void;
}

export default function ExternalNoticeField({
  noticeTitle,
  noticeUrl,
  noticeCategory,
  noticeTags,
  onChangeTitle,
  onChangeUrl,
  onChangeCategory,
  onChangeTags,
}: Props) {
  return (
    <div className="
      rounded-xl border border-blue-200 dark:border-blue-800
      bg-blue-50 dark:bg-blue-950/30
      p-4 space-y-3
    ">
      {/* 섹션 안내 */}
      <div className="flex items-start gap-2">
        <ExternalLink size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            공지/공고 사항 링크 자동 연동
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            아래 URL을 입력하면 [공지/공고] 탭에 자동 등록되며, 관심분야 사용자에게 푸시 알림이 발송됩니다.
          </p>
        </div>
      </div>

      {/* 공고 제목 */}
      <div>
        <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
          공고 제목 *
        </label>
        <input
          type="text"
          value={noticeTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="예: 2025년 산학협력 기술개발 과제 공모"
          className="
            w-full h-9 px-3 rounded-lg text-sm
            bg-white dark:bg-slate-800
            border border-blue-200 dark:border-blue-700
            text-slate-700 dark:text-slate-200
            focus:outline-none focus:ring-1 focus:ring-blue-500
          "
        />
      </div>

      {/* 외부 URL */}
      <div>
        <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
          외부 공고 URL *
        </label>
        <input
          type="url"
          value={noticeUrl}
          onChange={(e) => onChangeUrl(e.target.value)}
          placeholder="https://www.example.go.kr/notice/..."
          className="
            w-full h-9 px-3 rounded-lg text-sm
            bg-white dark:bg-slate-800
            border border-blue-200 dark:border-blue-700
            text-slate-700 dark:text-slate-200
            focus:outline-none focus:ring-1 focus:ring-blue-500
          "
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
          공고 카테고리
        </label>
        <select
          value={noticeCategory}
          onChange={(e) => onChangeCategory(e.target.value as NoticeCategory)}
          className="
            w-full h-9 px-3 rounded-lg text-sm
            bg-white dark:bg-slate-800
            border border-blue-200 dark:border-blue-700
            text-slate-700 dark:text-slate-200
            focus:outline-none focus:ring-1 focus:ring-blue-500
          "
        >
          {(Object.entries(NOTICE_CATEGORY_LABEL) as [NoticeCategory, string][]).map(
            ([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      {/* 관심분야 태그 */}
      <div>
        <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
          관심분야 태그 (쉼표로 구분, 알림 발송 기준)
        </label>
        <input
          type="text"
          value={noticeTags}
          onChange={(e) => onChangeTags(e.target.value)}
          placeholder="예: AI, 채용, 반도체"
          className="
            w-full h-9 px-3 rounded-lg text-sm
            bg-white dark:bg-slate-800
            border border-blue-200 dark:border-blue-700
            text-slate-700 dark:text-slate-200
            focus:outline-none focus:ring-1 focus:ring-blue-500
          "
        />
        <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1 flex items-center gap-1">
          <Info size={10} />
          입력한 태그를 관심분야로 등록한 사용자에게 실시간 알림이 발송됩니다.
        </p>
      </div>
    </div>
  );
}
