"use client";
// ============================================================
// 관리자 — manager 가입 승인/반려 UI
// ============================================================

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldX, Clock, Building2 } from "lucide-react";
import { UserProfile } from "@/types";
import { getPendingManagers, approveManager, rejectManager } from "@/services/userService";
import { formatDate } from "@/utils/helpers";

export default function ApprovalList() {
  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setManagers(await getPendingManagers());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(uid: string) {
    setProcessing(uid);
    await approveManager(uid);
    await load();
    setProcessing(null);
  }

  async function handleReject(uid: string) {
    if (!confirm("이 계정을 반려하시겠습니까? 역할이 일반 멤버로 변경됩니다.")) return;
    setProcessing(uid);
    await rejectManager(uid);
    await load();
    setProcessing(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          담당자 승인 대기
          {managers.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-600">
              {managers.length}건
            </span>
          )}
        </h3>
      </div>

      {loading ? (
        <div className="py-6 text-center text-sm text-slate-400">불러오는 중...</div>
      ) : managers.length === 0 ? (
        <div className="py-6 text-center">
          <Clock size={28} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">승인 대기 중인 담당자가 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {managers.map((manager) => (
            <li key={manager.uid} className="card p-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                  {manager.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{manager.name}</p>
                  <p className="text-xs text-slate-500 truncate">{manager.email}</p>
                  {manager.organization && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 size={11} className="text-slate-400" />
                      <p className="text-xs text-slate-500">{manager.organization}</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">가입일: {formatDate(manager.createdAt)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(manager.uid)}
                  disabled={processing === manager.uid}
                  className="flex-1 h-8 flex items-center justify-center gap-1 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60"
                >
                  <ShieldCheck size={13} />
                  {processing === manager.uid ? "처리 중..." : "승인"}
                </button>
                <button
                  onClick={() => handleReject(manager.uid)}
                  disabled={processing === manager.uid}
                  className="flex-1 h-8 flex items-center justify-center gap-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-60"
                >
                  <ShieldX size={13} />
                  반려
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
