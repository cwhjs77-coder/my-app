// ============================================================
// Firebase Cloud Messaging 서비스 워커
// 백그라운드 푸시 알림 수신 및 클릭 처리
//
// 동작 방식:
//   1. 클라이언트(useFCM 훅)가 postMessage로 Firebase 설정 전달
//   2. 설정을 받으면 Firebase를 초기화하고 messaging 리스너 등록
//   3. 백그라운드 메시지 수신 → 시스템 알림 표시
//   4. 알림 클릭 → 해당 URL로 이동
// ============================================================

/* global firebase, clients, self */

// Firebase SDK (Compat 버전 — Service Worker에서 importScripts 사용)
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// ─── 상태 플래그 ─────────────────────────────────────────────
let isFirebaseInitialized = false;
let messagingInstance = null;

// ─── 서비스 워커 설치 ─────────────────────────────────────────
self.addEventListener("install", (event) => {
  // 새 SW가 즉시 활성화되도록 대기 건너뜀
  self.skipWaiting();
});

// ─── 서비스 워커 활성화 ───────────────────────────────────────
self.addEventListener("activate", (event) => {
  // 기존 클라이언트를 새 SW가 즉시 제어하도록
  event.waitUntil(clients.claim());
});

// ─── 클라이언트에서 Firebase 설정 수신 ───────────────────────
self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "FIREBASE_CONFIG") return;

  const config = event.data.config;

  // 필수 설정 확인
  if (!config || !config.apiKey || !config.projectId || !config.messagingSenderId) {
    console.warn("[SW] Firebase 설정이 불완전합니다.");
    return;
  }

  // 이미 초기화된 경우 건너뜀
  if (isFirebaseInitialized) return;

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    messagingInstance = firebase.messaging();

    // ─── 백그라운드 메시지 핸들러 ──────────────────────────────
    messagingInstance.onBackgroundMessage((payload) => {
      const { title, body, image } = payload.notification ?? {};
      const data = payload.data ?? {};

      const notificationTitle = title ?? "경남 지산학연 알림";
      const notificationOptions = {
        body: body ?? "",
        icon: image ?? "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        // 동일 tag는 기존 알림을 교체 (중복 방지)
        tag: data.noticeId ?? data.tag ?? "notice",
        renotify: true,
        requireInteraction: false,
        data: {
          url: data.url ?? data.link ?? "/dashboard/notices",
          noticeId: data.noticeId ?? "",
        },
        actions: [
          { action: "open", title: "바로가기" },
          { action: "dismiss", title: "닫기" },
        ],
      };

      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    });

    isFirebaseInitialized = true;
    console.log("[SW] Firebase Messaging 초기화 완료");
  } catch (err) {
    console.error("[SW] Firebase 초기화 오류:", err);
  }
});

// ─── 알림 클릭 핸들러 ────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;

  // "닫기" 액션은 그냥 닫음
  if (action === "dismiss") return;

  const targetUrl =
    event.notification.data?.url ?? "/dashboard/notices";
  const fullUrl = self.location.origin + targetUrl;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 탭이 있으면 포커스 후 이동
        for (const client of clientList) {
          if (
            client.url.startsWith(self.location.origin) &&
            "focus" in client
          ) {
            client.focus();
            client.navigate(fullUrl);
            return;
          }
        }
        // 열린 탭이 없으면 새 탭 열기
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      })
  );
});

// ─── 알림 닫기 핸들러 ────────────────────────────────────────
self.addEventListener("notificationclose", (event) => {
  // 필요 시 분석 이벤트 기록 가능
  console.log("[SW] 알림 닫힘:", event.notification.tag);
});

// ─── Push 이벤트 (직접 처리 — Firebase SDK 우회 시) ──────────
// Firebase Messaging SDK가 초기화되지 않은 경우를 위한 폴백
self.addEventListener("push", (event) => {
  // Firebase SDK가 초기화된 경우 SDK가 처리 → 이 핸들러는 건너뜀
  if (isFirebaseInitialized) return;

  try {
    const data = event.data ? event.data.json() : {};
    const title = data.notification?.title ?? "경남 지산학연 알림";
    const options = {
      body: data.notification?.body ?? "",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      tag: "notice-fallback",
      data: { url: "/dashboard/notices" },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // JSON 파싱 실패 시 무시
  }
});
