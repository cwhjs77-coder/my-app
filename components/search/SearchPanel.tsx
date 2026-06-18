"use client";
// ============================================================
// 통합 검색 패널 — 전체 컬렉션 키워드 검색
// ============================================================

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Building2, Users, Package, Lightbulb, Target, Bell, Loader2 } from "lucide-react";
import { globalSearch, SearchResult } from "@/services/searchService";

const TYPE_ICON: Record<SearchResult["type"], React.ReactNode> = {
  organization: <Building2 size={15} className="text-blue-500" />,
  human_resource: <Users size={15} className="text-emerald-500" />,
  physical_resource: <Package size={15} className="text-violet-500" />,
  idea: <Lightbulb size={15} className="text-yellow-500" />,
  talent: <Target size={15} className="text-pink-500" />,
  notice: <Bell size={15} className="text-orange-500" />,
};

const TYPE_LABEL: Record<SearchResult["type"], string> = {
  organization: "참여기관",
  human_resource: "인적자원",
  physical_resource: "물적자원",
  idea: "아이디어",
  talent: "인재·채용",
  notice: "공지/공고",
};

export default function SearchPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setKeyword(q);
      runSearch(q);
    }
  }, [searchParams]);

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setSearching(true);
    setSearched(false);
    const res = await globalSearch(q.trim());
    setResults(res);
    setSearched(true);
    setSearching(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    router.push(`/dashboard/search?q=${encodeURIComponent(keyword.trim())}`);
  }

  // 타입별 결과 그룹화
  const grouped: Partial<Record<SearchResult["type"], SearchResult[]>> = {};
  results.forEach((r) => {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type]!.push(r);
  });

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      <h2 className="font-bold text-slate-800 dark:text-slate-100">통합 검색</h2>

      {/* 검색 폼 */}
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="자원, 기관, 인재, 공고 통합 검색..."
            className="
              w-full h-11 pl-10 pr-24 rounded-xl text-sm
              bg-slate-50 dark:bg-slate-800
              border border-slate-200 dark:border-slate-700
              text-slate-700 dark:text-slate-200
              placeholder:text-slate-400
              focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            "
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 h-7 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
          >
            검색
          </button>
        </div>
      </form>

      {/* 검색 중 */}
      {searching && (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">검색 중...</span>
        </div>
      )}

      {/* 결과 없음 */}
      {searched && !searching && results.length === 0 && (
        <div className="py-10 text-center">
          <Search size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">&apos;{searchParams.get("q")}&apos;에 대한 검색 결과가 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1">다른 키워드로 검색해보세요.</p>
        </div>
      )}

      {/* 검색 결과 */}
      {searched && !searching && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            총 <span className="font-semibold text-slate-800 dark:text-slate-100">{results.length}</span>개 결과
          </p>

          {(Object.entries(grouped) as [SearchResult["type"], SearchResult[]][]).map(([type, items]) => (
            <section key={type}>
              <div className="flex items-center gap-2 mb-2">
                {TYPE_ICON[type]}
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{TYPE_LABEL[type]}</span>
                <span className="text-xs text-slate-400">({items.length})</span>
              </div>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    className="card p-3 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.subtitle}</p>
                    )}
                    {item.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* 초기 화면 */}
      {!searched && !searching && (
        <div className="py-8 text-center">
          <Search size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">검색어를 입력하면 전체 자원을 한 번에 검색합니다.</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["AI", "반도체", "채용", "협업", "장비"].map((kw) => (
              <button key={kw} onClick={() => { setKeyword(kw); router.push(`/dashboard/search?q=${kw}`); }}
                className="px-3 py-1.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors">
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
