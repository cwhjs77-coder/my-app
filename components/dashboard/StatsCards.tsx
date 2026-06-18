"use client";
// ============================================================
// 대시보드 상단 4대 통계 카드 — Firestore 실시간 카운트
// ============================================================

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Building2, Boxes, BarChart3 } from "lucide-react";

interface StatItem {
  label: string;
  count: number;
  icon: React.ReactNode;
  gradient: string;
  description: string;
}

export default function StatsCards() {
  const [stats, setStats] = useState({
    humanResources: 0,
    physicalResources: 0,
    organizations: 0,
    users: 0,
  });

  useEffect(() => {
    // 인적 자원 카운트
    const unsubHuman = onSnapshot(
      collection(db, "human_resources"),
      (snap) => setStats((prev) => ({ ...prev, humanResources: snap.size }))
    );
    // 물적 자원 카운트
    const unsubPhysical = onSnapshot(
      collection(db, "physical_resources"),
      (snap) => setStats((prev) => ({ ...prev, physicalResources: snap.size }))
    );
    // 참여 기관 카운트
    const unsubOrg = onSnapshot(
      collection(db, "organizations"),
      (snap) => setStats((prev) => ({ ...prev, organizations: snap.size }))
    );
    // 사용자 카운트
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => setStats((prev) => ({ ...prev, users: snap.size }))
    );

    return () => {
      unsubHuman();
      unsubPhysical();
      unsubOrg();
      unsubUsers();
    };
  }, []);

  const statItems: StatItem[] = [
    {
      label: "인적자원",
      count: stats.humanResources,
      icon: <Users size={20} className="text-white" />,
      gradient: "from-blue-500 to-blue-600",
      description: "전문가",
    },
    {
      label: "물적자원",
      count: stats.physicalResources,
      icon: <Boxes size={20} className="text-white" />,
      gradient: "from-emerald-500 to-emerald-600",
      description: "장비/시설",
    },
    {
      label: "참여기관",
      count: stats.organizations,
      icon: <Building2 size={20} className="text-white" />,
      gradient: "from-violet-500 to-violet-600",
      description: "기관/기업",
    },
    {
      label: "사용자",
      count: stats.users,
      icon: <BarChart3 size={20} className="text-white" />,
      gradient: "from-orange-500 to-orange-600",
      description: "회원",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 px-3 py-2">
      {statItems.map((item) => (
        <div
          key={item.label}
          className={`
            relative overflow-hidden rounded-xl p-2.5
            bg-gradient-to-br ${item.gradient}
            shadow-sm
          `}
        >
          {/* 배경 원형 장식 */}
          <div className="absolute -right-2 -top-2 w-10 h-10 rounded-full bg-white/10" />
          {/* 아이콘 */}
          <div className="mb-1">{item.icon}</div>
          {/* 숫자 */}
          <p className="text-xl font-bold text-white leading-none">
            {item.count.toLocaleString()}
          </p>
          {/* 레이블 */}
          <p className="text-[9px] text-white/80 mt-0.5 leading-none">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
