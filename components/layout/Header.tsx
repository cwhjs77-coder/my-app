"use client";
// ============================================================
// 상단 고정 헤더 컴포넌트
// 타이틀 + 테마 토글 + 알림 종 + 검색바 포함
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import NotificationBell from "@/components/ui/NotificationBell";

interface Props {
  /** 뒤로가기 버튼이 필요한 경우 true */
  showBack?: boolean;
  /** 현재 페이지 제목 (서브페이지에서 사용) */
  pageTitle?: string;
}

export default function Header({ showBack = false, pageTitle }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState("");
  const [searchVisible, setSearchVisible] = useState(true);
  const lastScrollY = useRef(0);

  // 스크롤 이벤트로 검색바 숨기기/보이기
  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 60) {
        setSearchVisible(false); // 아래로 스크롤 시 숨김
      } else {
        setSearchVisible(true);  // 위로 스크롤 시 보임
      }
      lastScrollY.current = currentY;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  }

  // 대시보드 홈이면 타이틀 표시, 서브페이지면 뒤로가기 + 서브타이틀
  const isDashboardHome = pathname === "/dashboard";

  return (
    <header className="
      sticky top-0 z-40 w-full
      bg-white/95 dark:bg-slate-900/95
      backdrop-blur-sm
      border-b border-slate-200 dark:border-slate-700
      shadow-sm
    ">
      {/* 메인 헤더 바 */}
      <div className="flex items-center justify-between h-14 px-4">
        {/* 좌측: 뒤로가기 또는 타이틀 */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack && (
            <button
              onClick={() => router.back()}
              aria-label="이전 페이지로"
              className="
                flex items-center justify-center w-8 h-8 rounded-full
                text-slate-600 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-700
                transition-colors duration-150 flex-shrink-0
              "
            >
              {/* ← 뒤로가기 SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {pageTitle ? (
            <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
              {pageTitle}
            </h1>
          ) : (
            <div
              className="cursor-pointer"
              onClick={() => router.push("/dashboard")}
            >
              <h1 className="text-[13px] sm:text-sm font-bold text-blue-700 dark:text-blue-400 leading-tight">
                경남 지산학연
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight">
                네트워크 플랫폼
              </p>
            </div>
          )}
        </div>

        {/* 우측: 테마 토글 + 알림 종 */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>

      {/* 통합 검색바 — 스크롤 시 부드럽게 숨겨짐 */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${searchVisible ? "max-h-14 opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <form onSubmit={handleSearch} className="px-4 pb-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="자원, 기관, 인재 통합 검색..."
              className="
                w-full h-9 pl-9 pr-8 rounded-full text-sm
                bg-slate-100 dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
                text-slate-700 dark:text-slate-200
                placeholder:text-slate-400
                focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                transition-all duration-200
              "
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>
      </div>
    </header>
  );
}
