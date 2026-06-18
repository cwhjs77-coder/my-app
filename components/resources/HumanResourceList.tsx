"use client";
// ============================================================
// 인적 자원 목록 컴포넌트
// ============================================================

import { useEffect, useState } from "react";
import { Users, Plus, ExternalLink } from "lucide-react";
import { HumanResource } from "@/types";
import { getAllHumanResources } from "@/services/resourceService";
import { useAuthContext } from "@/context/AuthContext";
import HumanResourceForm from "./HumanResourceForm";
import { formatDate } from "@/utils/helpers";

export default function HumanResourceList() {
  const { isAdmin, isApprovedManager } = useAuthContext();
  const [items, setItems] = useState<HumanResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<HumanResource | undefined>();
  const [selected, setSelected] = useState<HumanResource | null>(null);

  async function load() {
    setLoading(true);
    const data = await getAllHumanResources();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const canWrite = isAdmin || isApprovedManager;

  if (showForm) {
    return <HumanResourceForm existing={editTarget} onSuccess={() => { setShowForm(false); setEditTarget(undefined); load(); }} onCancel={() => { setShowForm(false); setEditTarget(undefined); }} />;
  }

  if (selected) {
    return (
      <div className="p-4 space-y-4 animate-fadeIn">
        <button onClick={() => setSelected(null)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← 목록으로</button>
        <div className="card p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{selected.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selected.position} · {selected.organizationName}</p>
            </div>
            {canWrite && (
              <button onClick={() => { setEditTarget(selected); setShowForm(true); setSelected(null); }} className="text-xs text-slate-500 hover:text-blue-600">수정</button>
            )}
          </div>
          {selected.expertise?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.expertise.map((e) => <span key={e} className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{e}</span>)}
            </div>
          )}
          {selected.description && <p className="text-sm text-slate-600 dark:text-slate-300">{selected.description}</p>}
          {selected.contact && <p className="text-sm text-slate-500">📞 {selected.contact}</p>}
          {selected.email && <p className="text-sm text-slate-500">✉️ {selected.email}</p>}
          {selected.attachments?.map((att, i) => (
            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <ExternalLink size={12} /> {att.name}
            </a>
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
        <h2 className="font-bold text-slate-800 dark:text-slate-100">인적자원 ({items.length})</h2>
        {canWrite && (
          <button onClick={() => { setEditTarget(undefined); setShowForm(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">
            <Plus size={14} /> 등록
          </button>
        )}
      </div>
      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm">등록된 인적자원이 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} onClick={() => setSelected(item)}
              className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.position} · {item.organizationName}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
