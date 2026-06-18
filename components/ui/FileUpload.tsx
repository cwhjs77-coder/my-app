"use client";
// ============================================================
// 파일 업로드 컴포넌트 — Firebase Storage 업로드 + 진행률 표시
// ============================================================

import { useState, useRef, ChangeEvent } from "react";
import { Paperclip, X, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { uploadFile } from "@/services/storageService";
import { Attachment } from "@/types";
import { formatFileSize } from "@/utils/helpers";

interface Props {
  /** 업로드 경로 (예: "organizations/orgId") */
  storagePath: string;
  /** 업로드 완료 시 호출 */
  onUploaded: (attachment: Attachment) => void;
  /** 이미 업로드된 파일 목록 */
  existingFiles?: Attachment[];
  /** 파일 삭제 핸들러 */
  onDelete?: (attachment: Attachment) => void;
  /** 허용 파일 타입 */
  accept?: string;
  /** 최대 파일 크기 (bytes) */
  maxSize?: number;
}

export default function FileUpload({
  storagePath,
  onUploaded,
  existingFiles = [],
  onDelete,
  accept = "*/*",
  maxSize = 50 * 1024 * 1024, // 기본 50MB
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검사
    if (file.size > maxSize) {
      setError(`파일 크기가 ${formatFileSize(maxSize)}를 초과합니다.`);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const attachment = await uploadFile(file, storagePath, (p) => {
        setProgress(p);
      });
      onUploaded(attachment);
    } catch (err) {
      console.error("[FileUpload] 업로드 오류:", err);
      setError("파일 업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setUploading(false);
      setProgress(0);
      // 입력 초기화 (같은 파일 다시 선택 가능하게)
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {/* 업로드 버튼 */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed
          border-slate-300 dark:border-slate-600
          hover:border-blue-400 dark:hover:border-blue-500
          cursor-pointer transition-colors duration-200
          ${uploading ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {uploading ? (
          <Upload size={18} className="text-blue-500 animate-bounce" />
        ) : (
          <Paperclip size={18} className="text-slate-500 dark:text-slate-400" />
        )}
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {uploading ? `업로드 중... ${progress}%` : "파일 첨부 (클릭하여 선택)"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {/* 진행률 바 */}
      {uploading && (
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* 업로드된 파일 목록 */}
      {existingFiles.length > 0 && (
        <ul className="space-y-2">
          {existingFiles.map((file, idx) => (
            <li
              key={idx}
              className="
                flex items-center justify-between px-3 py-2 rounded-lg
                bg-slate-50 dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
              "
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                >
                  {file.name}
                </a>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              {onDelete && (
                <button
                  onClick={() => onDelete(file)}
                  className="ml-2 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                  aria-label="파일 삭제"
                >
                  <X size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
