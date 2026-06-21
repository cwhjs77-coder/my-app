import type { NextConfig } from "next";

// ============================================================
// Next.js 설정
// ============================================================
// [핵심] firebase/messaging 은 브라우저 전용 모듈입니다.
// Next.js App Router 의 "use client" 컴포넌트도 서버(SSR)에서 먼저 렌더링되므로
// 서버 번들에 firebase/messaging 이 포함되면 Node.js 환경에서 즉시 충돌합니다.
// → 서버 webpack 번들에서 false(빈 모듈)로 대체하여 완전히 제외합니다.
// ============================================================

const nextConfig: NextConfig = {
  // ── 외부 이미지 도메인 허용
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
    ],
  },

  // ── Turbopack 설정 (Next.js 16 기본)
  turbopack: {},

  // ── Webpack 서버/클라이언트 번들 커스터마이징
  webpack: (config, { isServer }) => {
    if (isServer) {
      // ── 서버 번들: 브라우저 전용 Firebase 모듈 제외
      // firebase/messaging 은 IndexedDB · ServiceWorker · Notification API 등
      // 브라우저 전용 API를 모듈 평가 시점에 참조합니다.
      // 서버(Node.js)에서 import 되는 순간 ReferenceError 로 SSR이 전면 실패합니다.
      config.resolve.alias = {
        ...config.resolve.alias,
        "firebase/messaging": false,
      };
    } else {
      // ── 클라이언트 번들: Node.js 내장 모듈 폴리필 제외
      // firebase-admin 은 서버 전용 — 클라이언트 번들에 포함되지 않아야 합니다.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs:            false,
        net:           false,
        tls:           false,
        child_process: false,
        crypto:        false,
      };
    }
    return config;
  },
};

export default nextConfig;
