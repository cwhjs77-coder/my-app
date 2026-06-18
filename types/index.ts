// ============================================================
// 경남 지산학연 네트워크 플랫폼 — 전역 TypeScript 타입 정의
// 모든 Firestore 컬렉션 문서 구조를 인터페이스로 정의합니다.
// ============================================================

import { Timestamp } from "firebase/firestore";

// ─────────────────────────────────────────────
// 공통 타입
// ─────────────────────────────────────────────

/** 파일 첨부 정보 */
export interface Attachment {
  name: string;      // 파일명
  url: string;       // Firebase Storage 다운로드 URL
  type: string;      // MIME 타입 (예: "application/pdf")
  size: number;      // 파일 크기(bytes)
}

/** 공지/공고 카테고리 */
export type NoticeCategory = "policy" | "research" | "recruitment" | "other";

/** 공지/공고 카테고리 한글 매핑 */
export const NOTICE_CATEGORY_LABEL: Record<NoticeCategory, string> = {
  policy: "정책 공고",
  research: "연구기술 개발 공모",
  recruitment: "채용 공고",
  other: "기타",
};

// ─────────────────────────────────────────────
// users 컬렉션 — /users/{uid}
// ─────────────────────────────────────────────

/** 사용자 권한 역할 */
export type UserRole = "admin" | "manager" | "member";

/** 사용자 문서 구조 */
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  /** manager 계정만 해당: admin 승인 여부 */
  approved: boolean;
  /** 소속 기관명 (manager의 경우 대표하는 기관) */
  organization?: string;
  /** 소속 기관 문서 ID */
  organizationId?: string;
  /** 관심분야 키워드 배열 (예: ["AI", "반도체", "채용"]) */
  interests: string[];
  /** FCM 토큰 (웹 푸시 알림용) */
  fcmToken?: string;
  /** Expo 푸시 토큰 (모바일 알림용) */
  expoPushToken?: string;
  createdAt: Timestamp | Date;
  lastLogin: Timestamp | Date;
}

// ─────────────────────────────────────────────
// organizations 컬렉션 — /organizations/{id}
// ─────────────────────────────────────────────

/** 기관 유형 */
export type OrgType = "university" | "company" | "government" | "research";

/** 기관 유형 한글 매핑 */
export const ORG_TYPE_LABEL: Record<OrgType, string> = {
  university: "대학",
  company: "기업",
  government: "공공기관",
  research: "연구기관",
};

/** 기관/기업 문서 구조 */
export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  homepage?: string;
  address?: string;
  description?: string;
  /** 담당자(manager) uid */
  managerId?: string;
  managerEmail?: string;
  /** 외부 공고 URL — 입력 시 notices 컬렉션에 자동 연동 */
  noticeUrl?: string;
  noticeTitle?: string;
  noticeCategory?: NoticeCategory;
  noticeTags?: string[];
  attachments?: Attachment[];
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

// ─────────────────────────────────────────────
// human_resources 컬렉션 — /human_resources/{id}
// ─────────────────────────────────────────────

/** 인적 자원 문서 구조 */
export interface HumanResource {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  /** 직책/역할 (교수, 연구원, 전문가 등) */
  position: string;
  /** 전문 분야 키워드 배열 */
  expertise: string[];
  contact?: string;
  email?: string;
  description?: string;
  noticeUrl?: string;
  noticeTitle?: string;
  noticeCategory?: NoticeCategory;
  noticeTags?: string[];
  attachments?: Attachment[];
  registeredBy: string;    // 등록자 uid
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

// ─────────────────────────────────────────────
// physical_resources 컬렉션 — /physical_resources/{id}
// ─────────────────────────────────────────────

/** 물적 자원 카테고리 */
export type PhysicalResourceCategory = "equipment" | "facility" | "lab_instrument";

/** 물적 자원 카테고리 한글 매핑 */
export const PHYSICAL_CATEGORY_LABEL: Record<PhysicalResourceCategory, string> = {
  equipment: "연구 장비",
  facility: "시설",
  lab_instrument: "실험실습 기자재",
};

/** 물적 자원 문서 구조 */
export interface PhysicalResource {
  id: string;
  name: string;
  category: PhysicalResourceCategory;
  organizationId: string;
  organizationName: string;
  description: string;
  /** 대여/사용 가능 여부 */
  available: boolean;
  location?: string;
  contact?: string;
  noticeUrl?: string;
  noticeTitle?: string;
  noticeCategory?: NoticeCategory;
  noticeTags?: string[];
  attachments?: Attachment[];
  registeredBy: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

// ─────────────────────────────────────────────
// ideas 컬렉션 — /ideas/{id}
// ─────────────────────────────────────────────

/** 아이디어/협업 문서 구조 */
export interface IdeaPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorOrg?: string;
  tags: string[];
  /** 협업 모집 여부 */
  recruiting: boolean;
  viewCount: number;
  noticeUrl?: string;
  noticeTitle?: string;
  noticeCategory?: NoticeCategory;
  noticeTags?: string[];
  attachments?: Attachment[];
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

// ─────────────────────────────────────────────
// talent 컬렉션 — /talent/{id}
// ─────────────────────────────────────────────

/** 인재·채용 게시물 타입 */
export type TalentType = "recruitment" | "talent_profile";

/** 인재·채용 문서 구조 */
export interface TalentPost {
  id: string;
  title: string;
  content: string;
  type: TalentType;
  organizationId?: string;
  organizationName?: string;
  authorId: string;
  authorName: string;
  /** 필요 또는 보유 기술 키워드 */
  skills: string[];
  deadline?: string;
  salary?: string;
  location?: string;
  noticeUrl?: string;
  noticeTitle?: string;
  noticeCategory?: NoticeCategory;
  noticeTags?: string[];
  attachments?: Attachment[];
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

// ─────────────────────────────────────────────
// notices 컬렉션 — /notices/{id}
// (외부 공고 URL 자동 연동 및 직접 등록 공지)
// ─────────────────────────────────────────────

/** 공지/공고 문서 구조 */
export interface Notice {
  id: string;
  title: string;
  /** 외부 웹사이트 URL */
  url: string;
  category: NoticeCategory;
  /** 관심 분야 매칭용 태그 */
  tags: string[];
  /** 어느 컬렉션에서 자동 연동되었는지 */
  sourceCollection?: string;
  /** 원본 문서 ID */
  sourceId?: string;
  /** 직접 등록 여부 */
  direct?: boolean;
  registeredBy?: string;
  registeredByName?: string;
  /** 조회수 */
  viewCount: number;
  createdAt: Timestamp | Date;
}

// ─────────────────────────────────────────────
// chats 컬렉션 — /chats/{chatId}
// 메시지 서브컬렉션 — /chats/{chatId}/messages/{msgId}
// ─────────────────────────────────────────────

/** 채팅방 문서 구조 */
export interface Chat {
  id: string;
  /** [uid1, uid2] — 반드시 두 참여자 UID */
  participants: [string, string];
  participantNames: Record<string, string>; // { uid: name }
  participantPhotos: Record<string, string>; // { uid: photoURL }
  lastMessage: string;
  lastMessageTime: Timestamp | Date;
  /** 각 사용자의 미읽음 카운트 */
  unreadCount: Record<string, number>;
  createdAt: Timestamp | Date;
}

/** 채팅 메시지 문서 구조 */
export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | Date;
}

// ─────────────────────────────────────────────
// notifications 컬렉션 — /notifications/{id}
// ─────────────────────────────────────────────

/** 앱 내 알림 문서 구조 */
export interface AppNotification {
  id: string;
  /** 알림 수신자 uid */
  userId: string;
  title: string;
  message: string;
  read: boolean;
  /** 관련 공지 ID (클릭 시 이동) */
  noticeId?: string;
  noticeUrl?: string;
  createdAt: Timestamp | Date;
}

// ─────────────────────────────────────────────
// feedback 컬렉션 — /feedback/{id}
// ─────────────────────────────────────────────

/** 개선요청 게시물 상태 */
export type FeedbackStatus = "pending" | "in_progress" | "resolved";

/** 개선요청 게시물 문서 구조 */
export interface FeedbackPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  status: FeedbackStatus;
  adminReply?: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

// ─────────────────────────────────────────────
// ai_logs 컬렉션 — /ai_logs/{id}
// ─────────────────────────────────────────────

/** AI 사용 로그 */
export interface AILog {
  id: string;
  userId: string;
  question: string;
  answer: string;
  model: string;
  tokensUsed?: number;
  createdAt: Timestamp | Date;
}

// ─────────────────────────────────────────────
// 관심분야 키워드 사전 정의 목록
// ─────────────────────────────────────────────
export const INTEREST_KEYWORDS = [
  "AI", "반도체", "바이오", "채용", "환경", "에너지",
  "소재", "로봇", "드론", "스마트팩토리", "빅데이터",
  "블록체인", "헬스케어", "교육", "농업", "해양",
  "방산", "문화콘텐츠", "관광", "스타트업", "정책",
  "연구개발", "산학협력", "창업", "취업", "인턴십",
];

// ─────────────────────────────────────────────
// networking_posts 컬렉션 — /networking_posts/{id}
// 네트워킹 게시판 게시글
// ─────────────────────────────────────────────

export type NetworkCategory =
  | "collaboration" // 협업제안
  | "tech_share"    // 기술공유
  | "event"         // 행사·세미나
  | "free";         // 자유게시판

export const NETWORK_CATEGORY_LABEL: Record<NetworkCategory, string> = {
  collaboration: "협업제안",
  tech_share: "기술공유",
  event: "행사·세미나",
  free: "자유게시판",
};

export const NETWORK_CATEGORY_COLOR: Record<NetworkCategory, string> = {
  collaboration: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  tech_share: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  event: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  free: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export interface NetworkPost {
  id: string;
  title: string;
  content: string;
  category: NetworkCategory;
  authorId: string;
  authorName: string;
  authorOrg?: string;
  authorPhotoURL?: string;
  tags: string[];
  viewCount: number;
  commentCount: number;
  pinned?: boolean;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface NetworkComment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Timestamp | Date;
}

// ─────────────────────────────────────────────
// 대시보드 통계 카드 타입
// ─────────────────────────────────────────────
export interface StatCard {
  label: string;
  count: number;
  icon: string;
  color: string;
  collection: string;
}
