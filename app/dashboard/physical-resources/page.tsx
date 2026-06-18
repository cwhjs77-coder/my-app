"use client";
import PageLayout from "@/components/layout/PageLayout";
import PhysicalResourceList from "@/components/resources/PhysicalResourceList";

export default function PhysicalResourcesPage() {
  return (
    <PageLayout title="물적자원" showBack>
      <PhysicalResourceList />
    </PageLayout>
  );
}
