"use client";
import PageLayout from "@/components/layout/PageLayout";
import OrgList from "@/components/organizations/OrgList";

export default function OrganizationsPage() {
  return (
    <PageLayout title="참여기관" showBack>
      <OrgList />
    </PageLayout>
  );
}
