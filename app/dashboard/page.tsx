"use client";
// ============================================================
// 대시보드 홈 페이지 — 통계 카드 + 3x3 그리드 메뉴
// 모바일 화면에 꽉 차도록 flex 비율로 최적화
// ============================================================

import PageLayout from "@/components/layout/PageLayout";
import StatsCards from "@/components/dashboard/StatsCards";
import GridMenu from "@/components/dashboard/GridMenu";
import { useAuthContext } from "@/context/AuthContext";

export default function DashboardPage() {
  const { userProfile } = useAuthContext();

  return (
    <PageLayout>
      {/* 전체를 flex 컬럼으로 구성하여 뷰포트를 꽉 채움 */}
      <div className="flex flex-col min-h-[calc(100vh-56px-64px)] /* 헤더56 + 탭바64 제외 */">

        {/* ─── 환영 메시지 ─── */}
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            안녕하세요,{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {userProfile?.name || "게스트"}
            </span>
            님! 👋
          </p>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            경남 지산학연 네트워크 플랫폼
          </h2>
        </div>

        {/* ─── 4대 통계 카드 ─── */}
        <div className="flex-shrink-0">
          <StatsCards />
        </div>

        {/* ─── 구분선 ─── */}
        <div className="px-4 py-1">
          <div className="h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* ─── 3x3 그리드 메뉴 (남은 공간을 채움) ─── */}
        <div className="flex-1 flex flex-col justify-center">
          <GridMenu />
        </div>

        {/* ─── 승인 대기 안내 (manager인데 미승인 상태) ─── */}
        {userProfile?.role === "manager" && !userProfile?.approved && (
          <div className="mx-4 mb-3 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">승인 대기 중</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
              기관/기업 담당자 계정 승인을 기다리고 있습니다. 최고 관리자 승인 후 모든 기능을 이용할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
