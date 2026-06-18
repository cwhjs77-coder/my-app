import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

// ─── 앱 메타데이터 ───
export const metadata: Metadata = {
  title: "경남 지산학연 네트워크 플랫폼",
  description: "경상남도 대학·기업·공공기관·연구기관을 연결하는 AI 기반 산학연관 네트워크 플랫폼",
  keywords: ["경남", "지산학연", "산학협력", "네트워크", "RISE", "글로컬대학"],
  authors: [{ name: "경남 지산학연 네트워크 플랫폼" }],
  manifest: "/manifest.json",
};

// ─── 모바일 뷰포트 최적화 ───
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 웹 폰트 — Noto Sans KR 로드 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
        {/* 테마 Provider (최외곽 — dark 클래스 관리) */}
        <ThemeProvider>
          {/* 인증 Provider */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
