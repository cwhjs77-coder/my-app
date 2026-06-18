"use client";
import PageLayout from "@/components/layout/PageLayout";
import IdeaList from "@/components/ideas/IdeaList";

export default function IdeasPage() {
  return (
    <PageLayout title="아이디어·협업" showBack>
      <IdeaList />
    </PageLayout>
  );
}
