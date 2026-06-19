"use client";
// ============================================================
// 로그인 페이지
// ============================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuthContext();

  // 이미 로그인된 상태(Google redirect 복귀 포함)이면 대시보드로 이동
  useEffect(() => {
    if (!loading && firebaseUser) {
      router.replace("/dashboard");
    }
  }, [firebaseUser, loading, router]);

  // 로딩 중이거나 리다이렉트 대기 중이면 빈 화면
  if (loading || firebaseUser) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-[var(--color-background)]">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-violet-100/50 dark:bg-violet-900/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
