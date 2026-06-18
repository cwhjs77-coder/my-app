// ============================================================
// Firebase Storage 파일 업로드/다운로드 서비스
// ============================================================

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import { Attachment } from "@/types";

/**
 * 파일을 Firebase Storage에 업로드하고 Attachment 객체를 반환합니다.
 * @param file - 업로드할 File 객체
 * @param path - 저장 경로 (예: "organizations/orgId")
 * @param onProgress - 진행률 콜백 (0~100)
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<Attachment> {
  // 파일명에 타임스탬프를 추가하여 중복 방지
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._\-가-힣]/g, "_");
  const storageRef = ref(storage, `${path}/${timestamp}_${safeFileName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // 진행률 계산 및 콜백 호출
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error("[storageService] 업로드 오류:", error);
        reject(error);
      },
      async () => {
        // 업로드 완료 후 다운로드 URL 획득
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          name: file.name,
          url: downloadURL,
          type: file.type,
          size: file.size,
        });
      }
    );
  });
}

/**
 * Firebase Storage에서 파일을 삭제합니다.
 * @param url - 삭제할 파일의 다운로드 URL
 */
export async function deleteFile(url: string): Promise<void> {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (err) {
    // 파일이 이미 없거나 권한이 없는 경우 조용히 처리
    console.warn("[storageService] 파일 삭제 실패:", err);
  }
}

/**
 * 여러 파일을 순서대로 업로드합니다.
 */
export async function uploadMultipleFiles(
  files: File[],
  path: string,
  onProgress?: (progress: number, index: number) => void
): Promise<Attachment[]> {
  const attachments: Attachment[] = [];
  for (let i = 0; i < files.length; i++) {
    const attachment = await uploadFile(files[i], path, (progress) => {
      if (onProgress) onProgress(progress, i);
    });
    attachments.push(attachment);
  }
  return attachments;
}
