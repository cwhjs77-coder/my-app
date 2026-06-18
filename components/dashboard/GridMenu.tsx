"use client";
// ============================================================
// 3x3 메인 그리드 메뉴 컴포넌트 — 9대 기능 아이콘 메뉴
// ============================================================

import { useRouter } from "next/navigation";

interface MenuItem {
  label: string;
  emoji: string;
  href: string;
  description: string;
  color: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: "기업회원",
    emoji: "🏢",
    href: "/dashboard/organizations",
    description: "기관·기업 정보",
    color: "from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/30 border-blue-200 dark:border-blue-700",
  },
  {
    label: "네트워킹",
    emoji: "🤝",
    href: "/dashboard/networking",
    description: "협업·기술공유",
    color: "from-teal-50 to-teal-100 dark:from-teal-900/40 dark:to-teal-800/30 border-teal-200 dark:border-teal-700",
  },
  {
    label: "공지사항",
    emoji: "📢",
    href: "/dashboard/notices",
    description: "공고·정책 안내",
    color: "from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-800/30 border-orange-200 dark:border-orange-700",
  },
  {
    label: "인적자원",
    emoji: "👥",
    href: "/dashboard/human-resources",
    description: "교수·전문가 정보",
    color: "from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/30 border-emerald-200 dark:border-emerald-700",
  },
  {
    label: "물적자원",
    emoji: "🔬",
    href: "/dashboard/physical-resources",
    description: "장비·시설·기자재",
    color: "from-violet-50 to-violet-100 dark:from-violet-900/40 dark:to-violet-800/30 border-violet-200 dark:border-violet-700",
  },
  {
    label: "인재·채용",
    emoji: "🎯",
    href: "/dashboard/talent",
    description: "채용·인재 등록",
    color: "from-pink-50 to-pink-100 dark:from-pink-900/40 dark:to-pink-800/30 border-pink-200 dark:border-pink-700",
  },
  {
    label: "1:1 채팅",
    emoji: "💬",
    href: "/dashboard/chat",
    description: "비밀 메시지",
    color: "from-cyan-50 to-cyan-100 dark:from-cyan-900/40 dark:to-cyan-800/30 border-cyan-200 dark:border-cyan-700",
  },
  {
    label: "통합검색",
    emoji: "🔍",
    href: "/dashboard/search",
    description: "전체 통합 검색",
    color: "from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-700/30 border-slate-200 dark:border-slate-600",
  },
  {
    label: "AI 챗봇",
    emoji: "🤖",
    href: "/dashboard/ai-chatbot",
    description: "AI 도우미",
    color: "from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/30 border-indigo-200 dark:border-indigo-700",
  },
];

export default function GridMenu() {
  const router = useRouter();

  return (
    <div className="px-3 py-2">
      <div className="grid grid-cols-3 gap-2">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`
              grid-menu-card
              flex flex-col items-center justify-center
              aspect-square
              rounded-xl border
              bg-gradient-to-br ${item.color}
              p-2 gap-1
            `}
          >
            <span className="text-2xl leading-none">{item.emoji}</span>
            <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight">
              {item.label}
            </span>
            <span className="text-[8px] text-slate-400 dark:text-slate-500 text-center leading-none">
              {item.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
