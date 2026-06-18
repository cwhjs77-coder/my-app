"use client";
// ============================================================
// 관리자 패널 — 탭: 회원관리 / 승인관리 / 푸시발송 / 데이터정리
// ============================================================

import { useState } from "react";
import MemberList from "./MemberList";
import ApprovalList from "./ApprovalList";
import AdminPushForm from "./AdminPushForm";
import BatchCleaner from "./BatchCleaner";

type Tab = "members" | "approvals" | "push" | "batch";

const TABS: { key: Tab; label: string }[] = [
  { key: "members", label: "회원관리" },
  { key: "approvals", label: "승인관리" },
  { key: "push", label: "푸시발송" },
  { key: "batch", label: "데이터정리" },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("members");

  return (
    <div className="flex flex-col h-full">
      {/* 탭 바 */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 sticky top-14 bg-[var(--color-background)] z-10 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-[70px] py-3 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "members" && <MemberList />}
        {activeTab === "approvals" && <ApprovalList />}
        {activeTab === "push" && <AdminPushForm />}
        {activeTab === "batch" && <BatchCleaner />}
      </div>
    </div>
  );
}
