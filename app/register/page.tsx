"use client";
// ============================================================
// 회원가입 페이지
// ============================================================

import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-[var(--color-background)]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-emerald-100/50 dark:bg-emerald-900/10 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
