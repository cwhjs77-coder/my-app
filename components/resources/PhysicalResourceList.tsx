"use client";
// ============================================================
// 물적 자원 목록 컴포넌트
// ============================================================

import { useEffect, useState } from "react";
import { Package, Plus, ExternalLink } from "lucide-react";
import { PhysicalResource, PHYSICAL_CATEGORY_LABEL } from "@/types";
import { getAllPhysicalResources } from "@/services/resourceService";
import { useAuthContext } from "@/context/AuthContext";
import PhysicalResourceForm from "./PhysicalResourceForm";
import { formatDate } from "@/utils/helpers";

export default function PhysicalResourceList() {
  const { isAdmin, isApprovedManager } = useAuthContext();
  const [items, setItems] = useState<PhysicalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<PhysicalResource | undefined>();
  const [selected, setSelected] = useState<PhysicalResource | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");

  async function load() {
    setLoading(true);
    const data = await getAllPhysicalResources();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const canWrite = isAdmin || isApprovedManager;
  const filtered = filterCat === "all" ? items : items.filter((i) => i.category === filterCat);

  if (showForm) {
    return <PhysicalResourceForm existing={editTarget} onSuccess={() => { setShowForm(false); setEditTarget(undefined); load(); }} onCancel={() => { setShowForm(false); setEditTarget(undefined); }} />;
  }

  if (selected) {
    return (
      <div className="p-4 space-y-4 animate-fadeIn">
        <button onClick={() => setSelected(null)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← 목록으로</button>
        <div className="card p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{selected.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">{PHYSICAL_CATEGORY_LABEL[selected.category]}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${selected.available ? "bg-green-100 dark:bg-green-900/30 text-green-700" : "bg-red-100 dark:bg-red-900/30 text-red-700"}`}>
                  {selected.available ? "이용 가능" : "이용 불가"}
                </span>
              </div>
            </div>
            {canWrite && <button onClick={() => { setEditTarget(selected); setShowForm(true); setSelected(null); }} className="text-xs text-slate-500 hover:text-blue-600">수정</button>}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">🏢 {selected.organizationName}</p>
          {selected.location && <p className="text-sm text-slate-500">📍 {selected.location}</p>}
          {selected.description && <p className="text-sm text-slate-600 dark:text-slate-300">{selected.description}</p>}
          {selected.contact && <p className="text-sm text-slate-500">📞 {selected.contact}</p>}
          {selected.attachments?.map((att, i) => (
            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><ExternalLink size={12} /> {att.name}</a>
          ))}
          {selected.noticeUrl && (
            <a href={selected.noticeUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 hover:underline">
              <ExternalLink size={14} /> {selected.noticeTitle || "공고 바로가기"}
            </a>
          )}
          <p className="text-xs text-slate-400">등록일: {formatDate(selected.createdAt)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">물적자원 ({items.length})</h2>
        {canWrite && (
          <button onClick={() => { setEditTarget(undefined); setShowForm(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">
            <Plus size={14} /> 등록
          </button>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[["all", "전체"], ["equipment", "연구장비"], ["facility", "시설"], ["lab_instrument", "실험실습기자재"]].map(([key, label]) => (
          <button key={key} onClick={() => setFilterCat(key)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-colors duration-150 ${filterCat === key ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm">등록된 물적자원이 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => (
            <li key={item.id} onClick={() => setSelected(item)}
              className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-500">{PHYSICAL_CATEGORY_LABEL[item.category]}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{item.available ? "이용가능" : "이용불가"}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
