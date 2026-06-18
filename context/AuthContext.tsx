"use client";
// ============================================================
// 인증(Auth) Context
// 로그인 상태, 사용자 프로필, FCM 토큰 등록을 전역 관리합니다.
// ============================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { useFCM } from "@/hooks/useFCM";

// ─────────────────────────────────────────────────────────────
// Context 타입 정의
// ─────────────────────────────────────────────────────────────
interface AuthContextType {
  /** Firebase Auth의 기본 사용자 객체 */
  firebaseUser: FirebaseUser | null;
  /** Firestore에서 읽어온 상세 프로필 */
  userProfile: UserProfile | null;
  /** 초기 로딩 중 여부 */
  loading: boolean;
  /** 관리자 여부 (role===admin 또는 ADMIN_UID 일치) */
  isAdmin: boolean;
  /** 승인된 담당자(manager) 여부 */
  isApprovedManager: boolean;
  /** Firebase ID 토큰 비동기 반환 (API 호출 시 Authorization 헤더용) */
  getIdToken: () => Promise<string | null>;
}

// ─────────────────────────────────────────────────────────────
// Context 생성 (기본값)
// ─────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  isApprovedManager: false,
  getIdToken: async () => null,
});

// ─────────────────────────────────────────────────────────────
// FCM 연결 내부 컴포넌트
// AuthProvider 안에서 uid를 받아 useFCM 훅을 실행합니다.
// (훅은 컴포넌트 최상위에서만 호출 가능하므로 분리)
// ─────────────────────────────────────────────────────────────
function FCMConnector({ uid }: { uid: string | undefined }) {
  useFCM(uid);
  return null;
}

// ─────────────────────────────────────────────────────────────
// AuthProvider
// ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase Auth 상태 변화 감지
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);

      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // Firestore 사용자 프로필 실시간 구독
      const userDocRef = doc(db, "users", user.uid);
      const unsubscribeProfile = onSnapshot(
        userDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error("[AuthContext] Firestore 구독 오류:", error);
          setLoading(false);
        }
      );

      // cleanup: Auth 리스너 제거 시 Profile 리스너도 해제
      return () => unsubscribeProfile();
    });

    return () => unsubscribeAuth();
  }, []);

  // ─── 편의 플래그 ────────────────────────────────────────────
  const isAdmin =
    userProfile?.role === "admin" ||
    firebaseUser?.uid === process.env.NEXT_PUBLIC_ADMIN_UID;

  const isApprovedManager =
    userProfile?.role === "manager" && userProfile?.approved === true;

  // ─── Firebase ID 토큰 반환 (관리자 API 호출용) ───────────────
  async function getIdToken(): Promise<string | null> {
    if (!firebaseUser) return null;
    try {
      return await firebaseUser.getIdToken();
    } catch (err) {
      console.error("[AuthContext] getIdToken 오류:", err);
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        loading,
        isAdmin,
        isApprovedManager,
        getIdToken,
      }}
    >
      {/* FCM 토큰 자동 등록 — 로그인된 사용자에게만 */}
      <FCMConnector uid={firebaseUser?.uid} />
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// 커스텀 훅 — 컴포넌트에서 간편하게 사용
// ─────────────────────────────────────────────────────────────
export function useAuthContext() {
  return useContext(AuthContext);
}
