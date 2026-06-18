"use client";
// ============================================================
// 알림(Notifications) 커스텀 훅
// Firestore 알림 구독 + FCM 웹 푸시 토큰 등록
// ============================================================

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppNotification } from "@/types";

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // 해당 사용자의 알림을 최신순으로 실시간 구독
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: AppNotification[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AppNotification[];

      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [userId]);

  // 개별 알림 읽음 처리
  async function markAsRead(notificationId: string) {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      });
    } catch (err) {
      console.error("[useNotifications] 읽음 처리 오류:", err);
    }
  }

  // 전체 알림 읽음 처리
  async function markAllAsRead() {
    if (!userId) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("[useNotifications] 전체 읽음 처리 오류:", err);
    }
  }

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
