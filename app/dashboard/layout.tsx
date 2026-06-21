"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuthContext();
  const router = useRouter();

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* 비로그인 게스트 안내 배너 */}
      {!firebaseUser && (
        <div className="sticky top-0 z-50 w-full bg-blue-600 text-white text-sm py-2 px-4 flex items-center justify-between gap-2">
          <span className="truncate">
            게스트 모드 — 전체 기능 이용을 위해 로그인하세요
          </span>
          <button
            onClick={() => router.push("/login")}
            className="shrink-0 bg-white text-blue-600 font-semibold text-xs px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
          >
            로그인
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
