"use client";
// ============================================================
// 테마 토글 버튼 — 다크/라이트 모드 전환
// ============================================================

import { Sun, Moon } from "lucide-react";
import { useThemeContext } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="
        relative w-9 h-9 rounded-full flex items-center justify-center
        bg-slate-100 hover:bg-slate-200
        dark:bg-slate-700 dark:hover:bg-slate-600
        text-slate-600 dark:text-slate-200
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
      "
    >
      {isDark ? (
        <Sun size={18} className="text-yellow-400" />
      ) : (
        <Moon size={18} className="text-slate-600" />
      )}
    </button>
  );
}
