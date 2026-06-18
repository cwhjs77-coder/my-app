"use client";
import PageLayout from "@/components/layout/PageLayout";
import TalentList from "@/components/talent/TalentList";

export default function TalentPage() {
  return (
    <PageLayout title="인재·채용" showBack>
      <TalentList />
    </PageLayout>
  );
}
