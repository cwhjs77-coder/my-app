"use client";
import PageLayout from "@/components/layout/PageLayout";
import NetworkingBoard from "@/components/networking/NetworkingBoard";

export default function NetworkingPage() {
  return (
    <PageLayout title="네트워킹 게시판" showBack>
      <NetworkingBoard />
    </PageLayout>
  );
}
