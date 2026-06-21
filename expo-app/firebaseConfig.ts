// ============================================================
// Firebase 프로젝트 설정
// .env 파일에서 EXPO_PUBLIC_ 접두사로 값을 주입합니다.
// 이 파일을 git에 커밋하지 마세요 (.gitignore 확인 필수)
// ============================================================

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

// 개발 환경에서 누락된 환경변수 조기 감지
if (__DEV__) {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => `EXPO_PUBLIC_FIREBASE_${k.replace(/([A-Z])/g, "_$1").toUpperCase()}`);

  if (missing.length > 0) {
    console.warn(
      "[Firebase] 누락된 환경변수:\n" + missing.map((v) => `  • ${v}`).join("\n") +
      "\nexpo-app/.env 파일에 값을 입력하세요."
    );
  }
}
