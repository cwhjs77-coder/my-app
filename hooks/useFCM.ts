"use client";
// ============================================================
// FCM 웹 푸시 토큰 등록 훅
// VAPID 키 기반으로 브라우저 알림 권한을 요청하고
// FCM 토큰을 Firestore 사용자 문서에 저장합니다.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { getMessaging, getToken, onMessage, MessagePayload } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import app, { db } from "@/lib/firebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export interface FCMState {
  /** 토큰 등록 완료 여부 */
  registered: boolean;
  /** 브라우저 알림 권한 상태 */
  permission: NotificationPermission | "unknown";
  /** 토큰 등록 중 오류 */
  error: string | null;
}

export function useFCM(uid: string | undefined): FCMState {
  const [state, setState] = useState<FCMState>({
    registered: false,
    permission: typeof Notification !== "undefined" ? Notification.permission : "unknown",
    error: null,
  });

  const registeredRef = useRef(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !uid ||
      registeredRef.current ||
      !VAPID_KEY
    ) {
      return;
    }

    // HTTP 환경에서는 FCM 불가 (localhost는 예외)
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      setState((prev) => ({
        ...prev,
        error: "FCM은 HTTPS 환경에서만 동작합니다.",
      }));
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setState((prev) => ({
        ...prev,
        error: "이 브라우저는 푸시 알림을 지원하지 않습니다.",
      }));
      return;
    }

    async function registerFCM() {
      try {
        // 1. 알림 권한 요청
        const permission = await Notification.requestPermission();
        setState((prev) => ({ ...prev, permission }));

        if (permission !== "granted") {
          setState((prev) => ({
            ...prev,
            error: "알림 권한이 거부되었습니다.",
          }));
          return;
        }

        // 2. Service Worker 등록
        const swRegistration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );
        await navigator.serviceWorker.ready;

        // 3. Service Worker에 Firebase 설정 전달
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        const sendConfig = (sw: ServiceWorker | null) => {
          sw?.postMessage({ type: "FIREBASE_CONFIG", config: firebaseConfig });
        };

        sendConfig(swRegistration.active);

        // installing 상태에서 activated 될 때도 전달
        swRegistration.installing?.addEventListener("statechange", function () {
          if (this.state === "activated") sendConfig(swRegistration.active);
        });

        // 4. FCM 토큰 발급
        const messaging = getMessaging(app);
        const currentToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        });

        if (!currentToken) {
          setState((prev) => ({
            ...prev,
            error: "FCM 토큰을 발급받지 못했습니다. VAPID 키를 확인해주세요.",
          }));
          return;
        }

        // 5. Firestore에 토큰 저장
        await updateDoc(doc(db, "users", uid!), {
          fcmToken: currentToken,
        });

        registeredRef.current = true;
        setState({ registered: true, permission: "granted", error: null });

        // 6. 포그라운드 메시지 핸들러 (앱이 열린 상태에서 수신)
        onMessage(messaging, (payload: MessagePayload) => {
          const { title, body } = payload.notification ?? {};
          if (!title) return;

          if ("Notification" in window && Notification.permission === "granted") {
            const notif = new Notification(title, {
              body: body ?? "",
              icon: "/icons/icon-192x192.png",
              badge: "/icons/badge-72x72.png",
              tag: payload.data?.noticeId ?? "notice",
              data: payload.data,
            });

            notif.onclick = () => {
              const url = payload.data?.url ?? "/dashboard/notices";
              window.focus();
              window.location.href = url;
              notif.close();
            };
          }
        });
      } catch (err) {
        console.error("[useFCM] 등록 오류:", err);
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "FCM 등록 중 오류가 발생했습니다.",
        }));
      }
    }

    registerFCM();
  }, [uid]);

  return state;
}
