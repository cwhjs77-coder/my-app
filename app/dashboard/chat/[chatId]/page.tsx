"use client";
import { use } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ChatWindow from "@/components/chat/ChatWindow";

interface Props {
  params: Promise<{ chatId: string }>;
}

export default function ChatRoomPage({ params }: Props) {
  const { chatId } = use(params);
  return (
    <PageLayout title="채팅" showBack>
      <ChatWindow chatId={chatId} />
    </PageLayout>
  );
}
