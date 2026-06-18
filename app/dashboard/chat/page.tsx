"use client";
import PageLayout from "@/components/layout/PageLayout";
import ChatList from "@/components/chat/ChatList";

export default function ChatPage() {
  return (
    <PageLayout title="1:1 비밀채팅" showBack>
      <ChatList />
    </PageLayout>
  );
}
