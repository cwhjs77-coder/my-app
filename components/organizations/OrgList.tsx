"use client";
// ============================================================
// 기관/기업 목록 컴포넌트
// ============================================================

import { useEffect, useState } from "react";
import { Building2, ExternalLink, Edit, Plus, Globe } from "lucide-react";
import { Organization, ORG_TYPE_LABEL } from "@/types";
import { getAllOrganizations, deleteOrganization } from "@/services/orgService";
import { useAuthContext } from "@/context/AuthContext";
import OrgForm from "./OrgForm";
import { formatDate } from "@/utils/helpers";

export default function OrgList() {
  const { isAdmin, isApprovedManager, userProfile } = useAuthContext();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Organization | undefined>(undefined);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  async function loadOrgs() {
    setLoading(true);
    const data = await getAllOrganizations();
    setOrgs(data);
    setLoading(false);
  }

  useEffect(() => { loadOrgs(); }, []);

  function handleEdit(org: Organization) {
    setEditTarget(org);
    setShowForm(true);
    setSelectedOrg(null);
  }

  function handleFormSuccess() {
    setShowForm(false);
    setEditTarget(undefined);
    loadOrgs();
  }

  // 본인 기관 또는 admin인 경우 수정 버튼 표시
  const canEdit = isAdmin || isApprovedManager;

  if (showForm) {
    return (
      <OrgForm
        existing={editTarget}
        onSuccess={handleFormSuccess}
        onCancel={() => { setShowForm(false); setEditTarget(undefined); }}
      />
    );
  }

  if (selectedOrg) {
    return (
      <div className="p-4 space-y-4 animate-fadeIn">
        <button onClick={() => setSelectedOrg(null)} className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← 목록으로
        </button>

        <div className="card p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{selectedOrg.name}</h2>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {ORG_TYPE_LABEL[selectedOrg.type]}
              </span>
            </div>
            {canEdit && (
              <button onClick={() => handleEdit(selectedOrg)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600">
                <Edit size={13} /> 수정
              </button>
            )}
          </div>

          {selectedOrg.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300">{selectedOrg.description}</p>
          )}
          {selectedOrg.address && (
            <p className="text-sm text-slate-500 dark:text-slate-400">📍 {selectedOrg.address}</p>
          )}
          {selectedOrg.homepage && (
            <a href={selectedOrg.homepage} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
              <Globe size={13} /> {selectedOrg.homepage}
            </a>
          )}

          {/* 첨부파일 */}
          {selectedOrg.attachments && selectedOrg.attachments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">첨부파일</p>
              <ul className="space-y-1">
                {selectedOrg.attachments.map((att, idx) => (
                  <li key={idx}>
                    <a href={att.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      <ExternalLink size={12} /> {att.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 외부 공고 링크 */}
          {selectedOrg.noticeUrl && (
            <a href={selectedOrg.noticeUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 hover:underline">
              <ExternalLink size={14} />
              {selectedOrg.noticeTitle || "공고 바로가기"}
            </a>
          )}

          <p className="text-xs text-slate-400">등록일: {formatDate(selectedOrg.createdAt)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 animate-fadeIn">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">참여기관 ({orgs.length})</h2>
        {canEdit && (
          <button onClick={() => { setEditTarget(undefined); setShowForm(true); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">
            <Plus size={14} /> 등록
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm">불러오는 중...</div>
      ) : orgs.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm">등록된 기관이 없습니다.</div>
      ) : (
        <ul className="space-y-2">
          {orgs.map((org) => (
            <li key={org.id} onClick={() => setSelectedOrg(org)}
              className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow duration-150">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <Building2 size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{org.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{ORG_TYPE_LABEL[org.type]}</span>
                  {org.noticeUrl && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">공고</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
