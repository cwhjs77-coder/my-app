"use client";
// ============================================================
// 관리자 — 배치 클리너 (오래된 데이터 정리 UI)
// ============================================================

import { useState } from "react";
import { Trash2, AlertTriangle, Check } from "lucide-react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function BatchCleaner() {
  const [cleaning, setCleaning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 30일 이상 된 읽은 알림 삭제
  async function cleanOldNotifications() {
    setCleaning(true); setResult(null); setError(null);
    try {
      const cutoff = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const q = query(
        collection(db, "notifications"),
        where("read", "==", true),
        where("createdAt", "<", cutoff)
      );
      const snap = await getDocs(q);
      let count = 0;
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "notifications", d.id));
        count++;
      }
      setResult(`✅ 오래된 알림 ${count}개를 삭제했습니다.`);
    } catch (err) {
      setError("정리 중 오류가 발생했습니다.");
    } finally {
      setCleaning(false);
    }
  }

  // 해결된 피드백 90일 이상 된 것 삭제
  async function cleanResolvedFeedback() {
    setCleaning(true); setResult(null); setError(null);
    try {
      const cutoff = Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
      const q = query(
        collection(db, "feedback"),
        where("status", "==", "resolved"),
        where("createdAt", "<", cutoff)
      );
      const snap = await getDocs(q);
      let count = 0;
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "feedback", d.id));
        count++;
      }
      setResult(`✅ 오래된 해결된 피드백 ${count}개를 삭제했습니다.`);
    } catch (err) {
      setError("정리 중 오류가 발생했습니다.");
    } finally {
      setCleaning(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trash2 size={16} className="text-red-500" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">데이터 배치 클리너</h3>
      </div>

      {/* 경고 */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <AlertTriangle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          삭제된 데이터는 복구할 수 없습니다. 신중하게 실행해주세요.
        </p>
      </div>

      {result && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-sm text-green-700 flex items-center gap-2">
          <Check size={14} />{result}
        </div>
      )}
      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-700">{error}</div>}

      <div className="space-y-2">
        <button onClick={cleanOldNotifications} disabled={cleaning}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60">
          <Trash2 size={14} />
          {cleaning ? "처리 중..." : "30일 이상 읽은 알림 삭제"}
        </button>

        <button onClick={cleanResolvedFeedback} disabled={cleaning}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60">
          <Trash2 size={14} />
          {cleaning ? "처리 중..." : "90일 이상 해결된 피드백 삭제"}
        </button>
      </div>
    </div>
  );
}
