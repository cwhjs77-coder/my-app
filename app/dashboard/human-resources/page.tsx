"use client";
import PageLayout from "@/components/layout/PageLayout";
import HumanResourceList from "@/components/resources/HumanResourceList";

export default function HumanResourcesPage() {
  return (
    <PageLayout title="인적자원" showBack>
      <HumanResourceList />
    </PageLayout>
  );
}
