// ============================================================
// Firebase 클라이언트 SDK 초기화
// ============================================================
// [핵심] Next.js App Router SSR 환경에서 getAuth() 자동감지가 실패하면
// signInWithPopup / signInWithRedirect 모두 auth/network-request-failed 를 유발합니다.
// 브라우저 환경에서는 initializeAuth + browserLocalPersistence + browserPopupRedirectResolver를
// 명시적으로 지정해 이 문제를 방지합니다.
// ============================================================

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  EmailAuthProvider,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ─── Firebase 프로젝트 설정 — 환경변수에서 읽어옵니다
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? "",
};

// ─── 앱 초기화 (Next.js 핫리로딩 중복 방지)
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ─── Auth 초기화
// 브라우저 전용 구현체를 명시적으로 주입해야 OAuth 팝업/리다이렉트가 정상 동작합니다.
// SSR(서버) 환경에서는 브라우저 API가 없으므로 getAuth()로 폴백합니다.
function buildAuth(): Auth {
  if (typeof window === "undefined") {
    // 서버사이드 렌더링: DOM/localStorage 없는 환경
    return getAuth(app);
  }

  // ── 브라우저 환경: 필수 환경변수 조기 감지 ──
  const missing: string[] = [];
  if (!firebaseConfig.apiKey)            missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!firebaseConfig.authDomain)        missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig.projectId)         missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.storageBucket)     missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  if (!firebaseConfig.messagingSenderId) missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  if (!firebaseConfig.appId)             missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (missing.length > 0) {
    console.error(
      "[Firebase] 누락된 환경변수가 있습니다. Google 로그인(OAuth)은 authDomain 없이 동작하지 않습니다.\n" +
      "Vercel 대시보드 → 프로젝트 → Settings → Environment Variables 에서 아래 변수를 추가하세요:\n" +
      missing.map((v) => `  • ${v}`).join("\n")
    );
  }

  // ── initializeAuth: 브라우저 구현체 명시적 주입 ──
  // - browserLocalPersistence : 로그인 상태를 localStorage에 유지 (새로고침 후에도 유지)
  // - browserPopupRedirectResolver : signInWithPopup / signInWithRedirect에서 사용할 resolver
  //   → 이것을 지정하지 않으면 Next.js App Router SSR 환경에서 resolver 감지가 실패해
  //     auth/network-request-failed 에러가 발생합니다.
  try {
    return initializeAuth(app, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    // Firebase는 initializeAuth를 앱당 한 번만 허용합니다.
    // 핫리로딩으로 재실행될 경우 이미 초기화된 인스턴스를 반환합니다.
    return getAuth(app);
  }
}

export const auth    = buildAuth();
export const db      = getFirestore(app);
export const storage = getStorage(app);

// ─── Google 로그인 Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({ prompt: "select_account" });

// ─── 이메일/비밀번호 Provider
export const emailProvider = new EmailAuthProvider();

export default app;
