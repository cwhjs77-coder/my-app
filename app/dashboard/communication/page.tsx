"use client";
import PageLayout from "@/components/layout/PageLayout";
import CommunicationPanel from "@/components/communication/CommunicationPanel";

export default function CommunicationPage() {
  return (
    <PageLayout title="문자/이메일 & 화상회의" showBack>
      <CommunicationPanel />
    </PageLayout>
  );
}
