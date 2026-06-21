"use client";

// ============================================================
// useFCM — Firebase Cloud Messaging 웹 푸시 토큰 등록 훅
// ============================================================
// [중요] firebase/messaging 은 브라우저 전용 모듈입니다.
// 최상단 정적 import 를 사용하면 SSR 시 서버에서 모듈을 평가해 즉시 충돌합니다.
// 반드시 useEffect 내부에서 동적 import(await import(...)) 로 불러와야 합니다.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { doc, updateDoc }              from "firebase/firestore";
import app, { db }                     from "@/lib/firebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export interface FCMState {
  registered: boolean;
  permission: NotificationPermission | "unknown";
  error:      string | null;
}

export function useFCM(uid: string | undefined): FCMState {
  const [state, setState] = useState<FCMState>({
    registered: false,
    // Notification API 는 브라우저 전용 — SSR 중에는 "unknown" 반환
    permission: typeof Notification !== "undefined" ? Notification.permission : "unknown",
    error:      null,
  });

  const registeredRef = useRef(false);

  useEffect(() => {
    // useEffect 는 브라우저에서만 실행됩니다.
    // 아래 조건 중 하나라도 해당되면 등록을 건너뜁니다.
    if (!uid)                  return; // 로그인 전
    if (registeredRef.current) return; // 이미 등록 완료
    if (!VAPID_KEY || VAPID_KEY === "YOUR_VAPID_KEY_HERE") {
      // VAPID 키 미설정 시 경고만 출력 — 앱 동작에는 영향 없음
      console.warn("[useFCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY 가 설정되지 않았습니다. 웹 푸시 알림이 비활성화됩니다.");
      return;
    }

    // HTTP 환경에서는 FCM 불가 (localhost 는 예외)
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      setState((prev) => ({ ...prev, error: "FCM은 HTTPS 환경에서만 동작합니다." }));
      return;
    }

    // Service Worker 미지원 브라우저 제외
    if (!("serviceWorker" in navigator)) {
      setState((prev) => ({ ...prev, error: "이 브라우저는 푸시 알림을 지원하지 않습니다." }));
      return;
    }

    async function registerFCM() {
      try {
        // ── 1. 알림 권한 요청
        const permission = await Notification.requestPermission();
        setState((prev) => ({ ...prev, permission }));

        if (permission !== "granted") {
          setState((prev) => ({ ...prev, error: "알림 권한이 거부되었습니다." }));
          return;
        }

        // ── 2. Service Worker 등록
        const swReg = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );
        await navigator.serviceWorker.ready;

        // ── 3. Service Worker 에 Firebase 설정 전달
        const firebaseConfig = {
          apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
        const sendConfig = (sw: ServiceWorker | null) => {
          sw?.postMessage({ type: "FIREBASE_CONFIG", config: firebaseConfig });
        };
        sendConfig(swReg.active);
        swReg.installing?.addEventListener("statechange", function () {
          if (this.state === "activated") sendConfig(swReg.active);
        });

        // ── 4. firebase/messaging 동적 import (브라우저에서만 실행됨을 보장)
        // 정적 import 대신 동적 import 를 사용해 SSR 서버에서 이 모듈이
        // 절대 평가되지 않도록 합니다. (서버에서 평가 시 즉시 충돌)
        const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

        // ── 5. FCM 토큰 발급
        const messaging    = getMessaging(app);
        const currentToken = await getToken(messaging, {
          vapidKey:                  VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (!currentToken) {
          setState((prev) => ({
            ...prev,
            error: "FCM 토큰을 발급받지 못했습니다. VAPID 키를 확인해주세요.",
          }));
          return;
        }

        // ── 6. Firestore 에 FCM 토큰 저장
        await updateDoc(doc(db, "users", uid!), { fcmToken: currentToken });

        registeredRef.current = true;
        setState({ registered: true, permission: "granted", error: null });

        // ── 7. 포그라운드 메시지 핸들러 (앱이 열린 상태에서 수신된 알림 처리)
        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification ?? {};
          if (!title) return;

          if ("Notification" in window && Notification.permission === "granted") {
            const notif = new Notification(title, {
              body:  body ?? "",
              icon:  "/icons/icon-192x192.png",
              badge: "/icons/badge-72x72.png",
              tag:   payload.data?.noticeId ?? "notice",
              data:  payload.data,
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
