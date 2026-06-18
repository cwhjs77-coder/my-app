"use client";
import PageLayout from "@/components/layout/PageLayout";
import FeedbackList from "@/components/feedback/FeedbackList";

export default function FeedbackPage() {
  return (
    <PageLayout title="피드백·설문" showBack>
      <FeedbackList />
    </PageLayout>
  );
}
