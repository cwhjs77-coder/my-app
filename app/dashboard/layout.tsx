"use client";
// ============================================================
// 대시보드 레이아웃 — 로그인 보호 + 헤더 + 탭바 공통 래핑
// ============================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { firebaseUser, loading } = useAuthContext();

  // 비로그인 접근 차단
  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
  }, [firebaseUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold">경</span>
          </div>
          <p className="text-sm text-slate-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return null;

  return <>{children}</>;
}
