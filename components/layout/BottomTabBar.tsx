"use client";
// ============================================================
// 하단 탭바 — [홈, 공지사항, 네트워킹, 채팅, 관리자]
// 관리자 탭은 admin 계정에서만 노출됩니다.
// ============================================================

import { usePathname, useRouter } from "next/navigation";
import { Home, Bell, Users2, MessageCircle, ShieldCheck } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

interface TabItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  badge?: number;
}

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, isAdmin } = useAuthContext();
  const { unreadCount } = useNotifications(userProfile?.uid);

  const tabs: TabItem[] = [
    {
      label: "홈",
      href: "/dashboard",
      icon: <Home size={21} />,
    },
    {
      label: "공지사항",
      href: "/dashboard/notices",
      icon: <Bell size={21} />,
      badge: unreadCount,
    },
    {
      label: "네트워킹",
      href: "/dashboard/networking",
      icon: <Users2 size={21} />,
    },
    {
      label: "채팅",
      href: "/dashboard/chat",
      icon: <MessageCircle size={21} />,
    },
    {
      label: "관리자",
      href: "/dashboard/admin",
      icon: <ShieldCheck size={21} />,
      adminOnly: true,
    },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-40
      h-16 flex items-stretch
      bg-white dark:bg-slate-900
      border-t border-slate-200 dark:border-slate-700
    ">
      {visibleTabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            aria-label={tab.label}
            className={`
              flex-1 flex flex-col items-center justify-center gap-0.5 relative
              select-none transition-colors duration-150
              ${
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }
            `}
          >
            {/* 활성 탭 상단 라인 */}
            {active && (
              <span className="absolute top-0 left-[22%] right-[22%] h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}

            {/* 아이콘 (배지 포함) */}
            <div className="relative">
              {tab.icon}
              {(tab.badge ?? 0) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {(tab.badge ?? 0) > 99 ? "99+" : tab.badge}
                </span>
              )}
            </div>

            {/* 레이블 */}
            <span className={`text-[9px] leading-none ${active ? "font-semibold" : "font-normal"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
