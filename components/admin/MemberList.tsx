"use client";
// ============================================================
// 관리자 — 전체 회원 목록 및 역할·승인 관리
// /api/admin/members (GET·PATCH·DELETE) 연동
// ============================================================

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  ShieldCheck,
  UserCheck,
  Search,
  ChevronDown,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { UserRole } from "@/types";
import { useAuthContext } from "@/context/AuthContext";
import { formatDate, getInitial } from "@/utils/helpers";

// ─── 표시용 회원 타입 ─────────────────────────────────────────
interface MemberItem {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  approved: boolean;
  organization: string;
  photoURL: string;
  createdAt: string | null;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "관리자",
  manager: "담당자",
  member: "일반회원",
};

const ROLE_COLOR: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  member: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

type RoleFilter = UserRole | "all" | "pending";

const ROLE_FILTERS: Array<{ key: RoleFilter; label: string }> = [
  { key: "all", label: "전체" },
  { key: "member", label: "일반회원" },
  { key: "manager", label: "담당자" },
  { key: "admin", label: "관리자" },
  { key: "pending", label: "승인대기" },
];

// ─── 공통 input 클래스 ────────────────────────────────────────
const INPUT_CLS =
  "w-full px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500";

export default function MemberList() {
  const { getIdToken } = useAuthContext();

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ─── 회원 목록 불러오기 ──────────────────────────────────────
  const loadMembers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const idToken = await getIdToken();
      if (!idToken) {
        setFetchError("인증 토큰을 가져오지 못했습니다.");
        return;
      }

      const res = await fetch("/api/admin/members", {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        const data = await res.json();
        setFetchError(data.error ?? "회원 목록 조회 실패");
        return;
      }

      const data = await res.json();
      setMembers(data.users ?? []);
    } catch {
      setFetchError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  // ─── 역할 변경 ───────────────────────────────────────────────
  async function handleRoleChange(uid: string, newRole: UserRole) {
    setProcessing(uid);
    try {
      const idToken = await getIdToken();
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken ?? ""}`,
        },
        body: JSON.stringify({ uid, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "변경 실패");
        return;
      }

      await loadMembers();
      setExpandedUid(null);
    } finally {
      setProcessing(null);
    }
  }

  // ─── 승인 처리 ───────────────────────────────────────────────
  async function handleApprove(uid: string) {
    setProcessing(uid);
    try {
      const idToken = await getIdToken();
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken ?? ""}`,
        },
        body: JSON.stringify({ uid, approved: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "승인 실패");
        return;
      }

      await loadMembers();
    } finally {
      setProcessing(null);
    }
  }

  // ─── 회원 삭제 ───────────────────────────────────────────────
  async function handleDelete(uid: string, name: string) {
    if (
      !confirm(
        `"${name}" 회원을 삭제하시겠습니까?\n이 작업은 Firebase Auth와 Firestore를 모두 삭제합니다.`
      )
    )
      return;

    setProcessing(uid);
    try {
      const idToken = await getIdToken();
      const res = await fetch("/api/admin/members", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken ?? ""}`,
        },
        body: JSON.stringify({ uid }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error ?? "삭제 실패");
        return;
      }

      await loadMembers();
      setExpandedUid(null);
    } finally {
      setProcessing(null);
    }
  }

  // ─── 필터링 ──────────────────────────────────────────────────
  const filtered = members
    .filter((m) => {
      if (filter === "all") return true;
      if (filter === "pending") return m.role === "manager" && !m.approved;
      return m.role === filter;
    })
    .filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.organization.toLowerCase().includes(search.toLowerCase())
    );

  const pendingCount = members.filter((m) => m.role === "manager" && !m.approved).length;

  return (
    <div className="space-y-3">
      {/* 통계 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "전체 회원",
            count: members.length,
            color: "text-slate-700 dark:text-slate-200",
            bg: "bg-slate-50 dark:bg-slate-800",
          },
          {
            label: "승인 담당자",
            count: members.filter((m) => m.role === "manager" && m.approved).length,
            color: "text-blue-700 dark:text-blue-300",
            bg: "bg-blue-50 dark:bg-blue-900/20",
          },
          {
            label: "승인 대기",
            count: pendingCount,
            color: "text-orange-700 dark:text-orange-300",
            bg: "bg-orange-50 dark:bg-orange-900/20",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 오류 메시지 */}
      {fetchError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{fetchError}</span>
          <button onClick={loadMembers} className="text-red-600 hover:underline text-xs ml-2">
            재시도
          </button>
        </div>
      )}

      {/* 검색 + 새로고침 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 이메일, 기관 검색..."
            className={`${INPUT_CLS} h-9 pl-9`}
          />
        </div>
        <button
          onClick={loadMembers}
          disabled={loading}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-400 disabled:opacity-50 transition-colors flex-shrink-0"
          title="새로고침"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* 역할 필터 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {ROLE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-colors ${
              filter === key
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
            }`}
          >
            {label}
            {key === "pending" && pendingCount > 0 && (
              <span className="ml-1 px-1 py-0.5 rounded-full bg-red-500 text-white text-[9px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">
          불러오는 중...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center">
          <Users size={28} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
          <p className="text-sm text-slate-400">해당하는 회원이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((member) => (
            <li key={member.uid} className="card overflow-hidden">
              {/* 메인 행 */}
              <div className="p-3 flex items-center gap-3">
                {/* 아바타 */}
                {member.photoURL ? (
                  <img
                    src={member.photoURL}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                    {getInitial(member.name || "?")}
                  </div>
                )}

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {member.name}
                    </p>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${ROLE_COLOR[member.role]}`}
                    >
                      {ROLE_LABEL[member.role]}
                    </span>
                    {member.role === "manager" && !member.approved && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        승인대기
                      </span>
                    )}
                    {member.role === "manager" && member.approved && (
                      <UserCheck size={11} className="text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{member.email}</p>
                  {member.organization && (
                    <p className="text-xs text-slate-400 truncate">{member.organization}</p>
                  )}
                </div>

                {/* 확장 토글 */}
                <button
                  onClick={() =>
                    setExpandedUid(expandedUid === member.uid ? null : member.uid)
                  }
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                >
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-200 ${
                      expandedUid === member.uid ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* 확장 패널 */}
              {expandedUid === member.uid && (
                <div className="px-3 pb-3 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3 animate-fadeIn">
                  {member.createdAt && (
                    <p className="text-xs text-slate-400">
                      가입일: {new Date(member.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  )}

                  {/* 역할 변경 */}
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      역할 변경
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {(["member", "manager", "admin"] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(member.uid, r)}
                          disabled={processing === member.uid || member.role === r}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                            member.role === r
                              ? "bg-blue-600 text-white"
                              : "border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {processing === member.uid ? "처리 중..." : ROLE_LABEL[r]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 담당자 승인 버튼 */}
                  {member.role === "manager" && !member.approved && (
                    <button
                      onClick={() => handleApprove(member.uid)}
                      disabled={processing === member.uid}
                      className="w-full h-9 flex items-center justify-center gap-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
                    >
                      <ShieldCheck size={13} />
                      {processing === member.uid ? "처리 중..." : "담당자 승인"}
                    </button>
                  )}

                  {/* 삭제 */}
                  {member.role !== "admin" && (
                    <button
                      onClick={() => handleDelete(member.uid, member.name)}
                      disabled={processing === member.uid}
                      className="w-full h-9 flex items-center justify-center gap-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 transition-colors"
                    >
                      <Trash2 size={12} />
                      회원 삭제 (Auth + Firestore)
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
