// ============================================================
// usePushNotifications — Expo 푸시 알림 토큰 등록
// ============================================================
// 실기기(Device.isDevice === true)에서만 동작합니다.
// 시뮬레이터/에뮬레이터에서는 null 반환 후 종료합니다.
// ============================================================

import * as Notifications from "expo-notifications";
import * as Device        from "expo-device";
import Constants          from "expo-constants";
import { Platform }       from "react-native";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Expo 푸시 토큰 등록 및 Firestore 저장
export async function registerForPushNotifications(uid: string): Promise<string | null> {
  // 시뮬레이터/에뮬레이터 제외
  if (!Device.isDevice) {
    console.log("[PushNotifications] 실기기가 아님 — 토큰 등록 건너뜀");
    return null;
  }

  // 권한 확인 및 요청
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[PushNotifications] 알림 권한 거부됨");
    return null;
  }

  // Android 채널 보장
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name:             "기본 알림",
      importance:        Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       "#3b82f6",
      showBadge:        true,
    });
  }

  // EAS 프로젝트 ID 추출
  const projectId: string | undefined =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;

  if (!projectId) {
    console.warn(
      "[PushNotifications] EAS projectId 가 설정되지 않았습니다. " +
      "app.json extra.eas.projectId 에 실제 projectId 를 입력하세요. " +
      "(개발 중 Expo Go 앱에서는 이 경고가 발생할 수 있습니다)"
    );
  }

  // Expo Push Token 획득
  let expoPushToken: string;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    expoPushToken = tokenData.data;
  } catch (e: any) {
    console.error("[PushNotifications] 토큰 획득 실패:", e?.message);
    return null;
  }

  // Firestore 사용자 문서에 토큰 저장
  try {
    await setDoc(
      doc(db, "users", uid),
      { expoPushToken, lastLogin: serverTimestamp() },
      { merge: true }
    );
    console.log("[PushNotifications] 토큰 등록 완료:", expoPushToken.slice(0, 30) + "...");
  } catch (e: any) {
    console.error("[PushNotifications] Firestore 저장 실패:", e?.code, e?.message);
  }

  return expoPushToken;
}
