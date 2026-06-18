"use client";
// ============================================================
// 페이지 레이아웃 래퍼 — 헤더 + 콘텐츠 + 하단 탭바
// 모든 서브페이지에서 이 컴포넌트를 사용하여 일관된 레이아웃 유지
// ============================================================

import Header from "./Header";
import BottomTabBar from "./BottomTabBar";

interface Props {
  children: React.ReactNode;
  /** 현재 페이지 제목 (서브페이지에서만 사용) */
  title?: string;
  /** 뒤로가기 버튼 표시 여부 (서브페이지에서 true) */
  showBack?: boolean;
  /** 배경색 오버라이드 */
  className?: string;
}

export default function PageLayout({
  children,
  title,
  showBack = false,
  className = "",
}: Props) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background)]">
      {/* 상단 고정 헤더 */}
      <Header showBack={showBack} pageTitle={title} />

      {/* 메인 콘텐츠 영역 (하단 탭바 높이만큼 padding-bottom) */}
      <main
        className={`
          flex-1 overflow-y-auto
          pb-20 /* 하단 탭바(h-16=64px) + 여유공간 */
          ${className}
        `}
      >
        {children}
      </main>

      {/* 하단 탭바 */}
      <BottomTabBar />
    </div>
  );
}
