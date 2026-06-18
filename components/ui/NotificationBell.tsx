"use client";
// ============================================================
// 알림 종(Bell) 아이콘 — 미읽음 배지 포함
// ============================================================

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { timeAgo } from "@/utils/helpers";
import { AppNotification } from "@/types";

export default function NotificationBell() {
  const { userProfile } = useAuthContext();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(userProfile?.uid);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle() {
    setOpen((prev) => !prev);
  }

  function handleNotificationClick(n: AppNotification) {
    markAsRead(n.id);
    if (n.noticeUrl) {
      window.open(n.noticeUrl, "_blank", "noopener,noreferrer");
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell 버튼 */}
      <button
        onClick={handleToggle}
        aria-label="알림 보기"
        className="
          relative w-9 h-9 rounded-full flex items-center justify-center
          bg-slate-100 hover:bg-slate-200
          dark:bg-slate-700 dark:hover:bg-slate-600
          text-slate-600 dark:text-slate-200
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        "
      >
        <Bell size={18} />
        {/* 미읽음 배지 */}
        {unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
            bg-red-500 text-white text-[10px] font-bold
            rounded-full flex items-center justify-center
            animate-pulse
          ">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {open && (
        <div className="
          absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          rounded-xl shadow-xl z-50
          animate-fadeIn
        ">
          {/* 드롭다운 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              알림
              {unreadCount > 0 && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                  ({unreadCount}개 미읽음)
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              알림이 없습니다.
            </div>
          ) : (
            <ul>
              {notifications.slice(0, 20).map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`
                    px-4 py-3 cursor-pointer border-b border-slate-100 dark:border-slate-700
                    hover:bg-slate-50 dark:hover:bg-slate-700
                    transition-colors duration-150
                    ${!n.read ? "bg-blue-50 dark:bg-slate-700/60" : ""}
                  `}
                >
                  <p className={`text-sm ${!n.read ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
