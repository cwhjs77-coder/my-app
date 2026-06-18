// ============================================================
// Firebase Admin SDK 초기화 — 서버 전용 (API Route에서만 import)
// 클라이언트 컴포넌트에서 절대 import 금지!
//
// Lazy 초기화 패턴:
//   Next.js 빌드 시 모듈 로드만으로 초기화가 실행되면
//   환경변수 미설정 상태에서 에러 → adminDb() 등 함수 호출 시점에만 초기화
// ============================================================

import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";

// ─────────────────────────────────────────────────────────────
// 환경변수 유효성 검사
// ─────────────────────────────────────────────────────────────
function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[firebase-admin] 필수 환경변수가 누락되었습니다: ${name}\n` +
        `.env.local 또는 Vercel 환경변수 설정을 확인해주세요.`
    );
  }
  return value;
}

// ─────────────────────────────────────────────────────────────
// 싱글톤 앱 인스턴스 — 요청 시점에 초기화 (빌드 시점 X)
// ─────────────────────────────────────────────────────────────
let _app: App | undefined;

function initAdminApp(): App {
  if (_app) return _app;

  // Hot Reload 대응: 이미 초기화된 앱이 있으면 재사용
  const existing = getApps();
  if (existing.length > 0) {
    _app = existing[0];
    return _app;
  }

  const projectId = assertEnv("FIREBASE_ADMIN_PROJECT_ID");
  const clientEmail = assertEnv("FIREBASE_ADMIN_CLIENT_EMAIL");

  // .env.local의 줄바꿈 이스케이프(\n) → 실제 개행 문자 변환
  const privateKey = assertEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");

  _app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL: `https://${projectId}.firebaseio.com`,
  });

  return _app;
}

// ─────────────────────────────────────────────────────────────
// Lazy 서비스 게터 — API 라우트 핸들러에서 adminDb() 형태로 호출
// ─────────────────────────────────────────────────────────────

/** Admin Firestore — 보안 규칙 우회, 서버 전용 */
export const adminDb = () => getFirestore(initAdminApp());

/** Admin Auth — UID 검증, 커스텀 클레임, 사용자 삭제 */
export const adminAuth = () => getAuth(initAdminApp());

/** Admin Messaging — FCM 멀티캐스트 푸시 발송 */
export const adminMessaging = () => getMessaging(initAdminApp());
