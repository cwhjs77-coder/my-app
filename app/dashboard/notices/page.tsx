"use client";
import PageLayout from "@/components/layout/PageLayout";
import NoticeList from "@/components/notices/NoticeList";

export default function NoticesPage() {
  return (
    <PageLayout title="공지·공고" showBack={false}>
      <NoticeList />
    </PageLayout>
  );
}
