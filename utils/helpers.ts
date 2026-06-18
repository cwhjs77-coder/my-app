// ============================================================
// 유틸리티 헬퍼 함수 모음
// ============================================================

import { Timestamp } from "firebase/firestore";
import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// ─────────────────────────────────────────────
// 날짜/시간 포맷 함수
// ─────────────────────────────────────────────

/** Firestore Timestamp 또는 Date를 Date 객체로 변환 */
export function toDate(value: Timestamp | Date | undefined | null): Date {
  if (!value) return new Date();
  if (value instanceof Timestamp) return value.toDate();
  return value;
}

/** 날짜를 "YYYY.MM.DD" 형식으로 포맷 */
export function formatDate(value: Timestamp | Date | undefined | null): string {
  const date = toDate(value);
  return format(date, "yyyy.MM.dd", { locale: ko });
}

/** 날짜를 "YYYY.MM.DD HH:mm" 형식으로 포맷 */
export function formatDateTime(value: Timestamp | Date | undefined | null): string {
  const date = toDate(value);
  return format(date, "yyyy.MM.dd HH:mm", { locale: ko });
}

/** 상대 시간 표시 (예: "3분 전", "2시간 전") */
export function timeAgo(value: Timestamp | Date | undefined | null): string {
  const date = toDate(value);
  return formatDistanceToNow(date, { addSuffix: true, locale: ko });
}

// ─────────────────────────────────────────────
// 파일 크기 포맷 함수
// ─────────────────────────────────────────────

/** 바이트를 사람이 읽기 좋은 형식으로 변환 (예: "1.2 MB") */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// ─────────────────────────────────────────────
// 문자열 유틸리티
// ─────────────────────────────────────────────

/** 긴 문자열을 지정 길이로 자르고 "..." 추가 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/** 이름에서 이니셜 추출 (예: "홍길동" → "홍") */
export function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

/** URL 유효성 검사 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// 채팅 ID 생성 (두 UID를 정렬하여 일관된 ID 생성)
// ─────────────────────────────────────────────

/**
 * 두 사용자의 UID로 채팅방 고유 ID를 생성합니다.
 * uid1과 uid2를 정렬하여 항상 같은 ID가 나오도록 보장합니다.
 */
export function getChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

// ─────────────────────────────────────────────
// 색상 유틸리티 (통계 카드 색상 등)
// ─────────────────────────────────────────────

/** 숫자에 따른 그라데이션 색상 클래스 반환 */
export function getStatColor(index: number): string {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-emerald-500 to-emerald-600",
    "from-violet-500 to-violet-600",
    "from-orange-500 to-orange-600",
  ];
  return colors[index % colors.length];
}

// ─────────────────────────────────────────────
// 태그 파싱 유틸리티
// ─────────────────────────────────────────────

/**
 * 쉼표 구분 문자열을 태그 배열로 변환
 * 예: "AI, 반도체, 바이오" → ["AI", "반도체", "바이오"]
 */
export function parseTags(input: string): string[] {
  return input
    .split(/[,，、\s]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * 태그 배열을 쉼표 구분 문자열로 변환
 * 예: ["AI", "반도체"] → "AI, 반도체"
 */
export function tagsToString(tags: string[]): string {
  return tags.join(", ");
}

// ─────────────────────────────────────────────
// 관심 분야 매칭 유틸리티
// ─────────────────────────────────────────────

/**
 * 공고 태그와 사용자 관심분야가 교집합이 있는지 확인
 * 알림 전송 여부를 결정하는 데 사용합니다.
 */
export function hasMatchingInterest(
  noticeTags: string[],
  userInterests: string[]
): boolean {
  if (!noticeTags?.length || !userInterests?.length) return false;
  const normalizedTags = noticeTags.map((t) => t.toLowerCase());
  const normalizedInterests = userInterests.map((i) => i.toLowerCase());
  return normalizedTags.some((tag) => normalizedInterests.includes(tag));
}
