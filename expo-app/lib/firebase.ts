// ============================================================
// Firebase 초기화 — React Native (Expo) 전용
// ============================================================
// [중요] React Native에서는 브라우저의 localStorage 대신
// AsyncStorage 를 persistence 로 지정해야 로그인 상태가 앱 재시작 후에도 유지됩니다.
// getReactNativePersistence 를 누락하면 매 앱 실행 시 로그아웃됩니다.
// ============================================================

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig } from "../firebaseConfig";

// ── 앱 초기화 (핫리로딩 중복 방지)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ── Auth: AsyncStorage 기반 영속성 주입
// initializeAuth 는 앱당 한 번만 호출 가능 → try/catch 로 핫리로딩 대응
function buildAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth    = buildAuth();
export const db      = getFirestore(app);
export const storage = getStorage(app);

export default app;
