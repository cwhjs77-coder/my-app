// ============================================================
// App.tsx — 경남 지산학연 네트워크 플랫폼 (Expo)
// ============================================================
// 진입점 파일. 반드시 맨 첫 줄에 react-native-gesture-handler 임포트 필요.
// 순서: GestureHandler → SplashScreen 제어 → SafeArea → Notifications → Auth → Navigation
// ============================================================

import "react-native-gesture-handler"; // ← 반드시 최상단 첫 번째 임포트

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  useColorScheme,
  AppState,
  type AppStateStatus,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider }        from "react-native-safe-area-context";
import { StatusBar }               from "expo-status-bar";
import * as SplashScreen           from "expo-splash-screen";
import * as Notifications          from "expo-notifications";
import * as Device                 from "expo-device";

import { AuthProvider }  from "@/context/AuthContext";
import AppNavigator      from "@/navigation/AppNavigator";
import { light, dark }   from "@/constants/colors";

// ─── SplashScreen: 앱이 준비될 때까지 자동 숨김 방지
SplashScreen.preventAutoHideAsync();

// ─── 전역 알림 핸들러
// 앱이 포그라운드에 있을 때 수신된 알림 처리 방식을 설정합니다.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // 배너/알럿 표시
    shouldPlaySound: true,   // 소리 재생
    shouldSetBadge:  true,   // 배지 업데이트
  }),
});

// ─── 안드로이드 알림 채널 생성
// Android 8.0(Oreo)+ 에서는 알림 채널 등록이 필수입니다.
async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name:              "기본 알림",
    importance:         Notifications.AndroidImportance.MAX,
    vibrationPattern:  [0, 250, 250, 250],
    lightColor:        "#3b82f6",
    showBadge:         true,
  });
}

// ─── 메인 앱 컴포넌트
export default function App() {
  const scheme                 = useColorScheme();
  const C                      = scheme === "dark" ? dark : light;
  const [appReady, setAppReady] = useState(false);

  // 수신 알림 리스너 ref (cleanup 용)
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener     = useRef<Notifications.EventSubscription | null>(null);

  // ── 앱 초기화 (폰트 로드, 채널 등록 등)
  useEffect(() => {
    async function prepare() {
      try {
        await ensureAndroidNotificationChannel();
        // 필요한 경우 여기서 폰트 로드 추가:
        // await Font.loadAsync({ "NotoSansKR": require("./assets/fonts/NotoSansKR.ttf") });
      } catch (e) {
        console.warn("[App] 초기화 오류:", e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  // ── 알림 이벤트 리스너 등록 / 해제
  useEffect(() => {
    // 포그라운드 알림 수신
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[App] 알림 수신:", notification.request.content.title);
      }
    );

    // 알림 탭(사용자 응답) 처리
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log("[App] 알림 탭 — 데이터:", data);
        // 필요한 경우 여기서 딥링크 처리 추가
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // ── AppState 변화 감지 (백그라운드 → 포그라운드 복귀 시 배지 초기화)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState: AppStateStatus) => {
        if (nextState === "active") {
          await Notifications.setBadgeCountAsync(0);
        }
      }
    );
    return () => subscription.remove();
  }, []);

  // ── SplashScreen 숨김 (레이아웃 완료 후)
  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  // 앱 준비 전: 아직 SplashScreen이 표시되고 있으므로 null 반환
  if (!appReady) return null;

  return (
    // ── GestureHandlerRootView: react-native-gesture-handler 필수 래퍼
    <GestureHandlerRootView style={styles.root}>
      {/* ── SafeAreaProvider: notch / 상태바 / 홈 인디케이터 영역 처리 */}
      <SafeAreaProvider>
        {/* ── StatusBar: 시스템 상태바 스타일 제어 */}
        <StatusBar
          style={scheme === "dark" ? "light" : "dark"}
          backgroundColor={C.surface}
          translucent={false}
        />

        {/* ── 레이아웃 완료 시 SplashScreen 숨김 */}
        <View style={styles.root} onLayout={onLayoutRootView}>
          {/* ── AuthProvider: Firebase 인증 상태 + Firestore 프로필 전역 제공 */}
          <AuthProvider>
            {/* ── AppNavigator: 로그인/메인 화면 전환 + 전체 네비게이션 트리 */}
            <AppNavigator />
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
