"use client";
import { Suspense } from "react";
import PageLayout from "@/components/layout/PageLayout";
import SearchPanel from "@/components/search/SearchPanel";

export default function SearchPage() {
  return (
    <PageLayout title="통합검색" showBack>
      <Suspense fallback={<div className="p-4 text-sm text-slate-400">검색 초기화 중...</div>}>
        <SearchPanel />
      </Suspense>
    </PageLayout>
  );
}
