"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext as useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/layout/PageLayout";
import AdminPanel from "@/components/admin/AdminPanel";

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, loading, router]);

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
        <span className="text-sm text-slate-400">접근 권한 확인 중...</span>
      </div>
    );
  }

  return (
    <PageLayout title="관리자" showBack={false}>
      <AdminPanel />
    </PageLayout>
  );
}
