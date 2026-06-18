import type { NextConfig } from "next";

// ============================================================
// Next.js 16 설정 파일
// Turbopack 기본 사용 + firebase-admin 서버 전용 모듈 처리
// ============================================================
const nextConfig: NextConfig = {
  // 외부 이미지 도메인 허용
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  // Turbopack 빈 설정 — Next.js 16에서 webpack config와 공존 오류 방지
  turbopack: {},
  // firebase-admin은 서버(API Route)에서만 사용 — 클라이언트 번들 제외
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
