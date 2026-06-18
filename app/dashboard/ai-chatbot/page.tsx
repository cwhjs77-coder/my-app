"use client";
import PageLayout from "@/components/layout/PageLayout";
import AIChatbot from "@/components/ai/AIChatbot";

export default function AIChatbotPage() {
  return (
    <PageLayout title="AI 챗봇" showBack={false}>
      <AIChatbot />
    </PageLayout>
  );
}
