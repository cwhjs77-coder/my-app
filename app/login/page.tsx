"use client";
// ============================================================
// 로그인 페이지
// ============================================================

import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
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
