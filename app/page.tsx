"use client";
// ============================================================
// 루트 페이지 — 로그인 여부에 따라 자동 리다이렉트
// ============================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";

export default function RootPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuthContext();

  useEffect(() => {
    if (loading) return;
    if (firebaseUser) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [firebaseUser, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">경</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">경남 지산학연 네트워크 플랫폼</p>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-pulse-dot" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
