"use client";

// ============================================================
// AuthContext — Firebase 인증 상태 + Firestore 프로필 전역 관리
// ============================================================
// [핵심] FCMConnector 는 firebase/messaging 을 사용하므로 브라우저 전용입니다.
// next/dynamic + ssr:false 로 서버 렌더링에서 완전히 제외합니다.
// ============================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  onAuthStateChanged,
  getRedirectResult,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";

// ── FCMConnector: SSR 에서 완전히 제외 (firebase/messaging 은 브라우저 전용)
// ssr:false 를 지정하지 않으면 서버가 firebase/messaging 을 평가하다 충돌합니다.
const FCMConnector = dynamic(
  () => import("@/components/FCMConnector"),
  { ssr: false }
);

// ── 컨텍스트 타입
interface AuthContextType {
  firebaseUser:      FirebaseUser | null;
  userProfile:       UserProfile  | null;
  loading:           boolean;
  isAdmin:           boolean;
  isApprovedManager: boolean;
  getIdToken:        () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser:      null,
  userProfile:       null,
  loading:           true,
  isAdmin:           false,
  isApprovedManager: false,
  getIdToken:        async () => null,
});

// ── AuthProvider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile,  setUserProfile]  = useState<UserProfile  | null>(null);
  const [loading,      setLoading]      = useState(true);

  // ── signInWithRedirect 복귀 처리
  // Redirect 방식 Google 로그인 후 앱으로 돌아오면 결과를 회수합니다.
  // Firestore 처리는 아래 onAuthStateChanged 에서 수행합니다.
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("[AuthContext] Google redirect 로그인 완료:", result.user.email);
        }
      })
      .catch((err) => {
        const code: string = err?.code ?? "unknown";
        // auth/no-auth-event 는 redirect 가 아닌 일반 페이지 로드 시 항상 발생 — 무시
        if (code !== "auth/no-auth-event") {
          console.error("[AuthContext] getRedirectResult 오류:", code, err?.message);
        }
      });
  }, []);

  // ── 인증 상태 변화 감지 + Firestore 사용자 문서 관리
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);

      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // ── Firestore 사용자 문서 생성/업데이트 (async IIFE)
      // 이 IIFE 안에서 발생한 Firestore 오류는 로그인 흐름 전체를 막지 않습니다.
      (async () => {
        try {
          const userRef = doc(db, "users", user.uid);
          const snap    = await getDoc(userRef);

          if (!snap.exists()) {
            // 신규 Google 사용자 → 문서 자동 생성
            const isGoogleUser = user.providerData.some(
              (p) => p.providerId === "google.com"
            );
            if (isGoogleUser) {
              const isAdminUid  = user.uid === process.env.NEXT_PUBLIC_ADMIN_UID;
              const role: UserRole = isAdminUid ? "admin" : "member";
              await setDoc(userRef, {
                name:      user.displayName ?? "이름없음",
                email:     user.email       ?? "",
                photoURL:  user.photoURL    ?? "",
                role,
                approved:  true,
                interests: [],
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
              });
            }
          } else {
            // 기존 사용자 → 마지막 로그인 시각만 갱신 (role/approved 변경 없음)
            await setDoc(
              userRef,
              { lastLogin: serverTimestamp() },
              { merge: true }
            );
          }
        } catch (e: any) {
          console.error("[AuthContext] Firestore 문서 처리 오류:", e?.code, e?.message);
        }
      })();

      // ── Firestore 사용자 프로필 실시간 구독
      const userRef      = doc(db, "users", user.uid);
      const unsubProfile = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error("[AuthContext] Firestore 구독 오류:", err?.code, err?.message);
          setLoading(false);
        }
      );

      return () => unsubProfile();
    });

    return () => unsubAuth();
  }, []);

  // ── 파생 권한
  const isAdmin =
    userProfile?.role === "admin" ||
    firebaseUser?.uid === process.env.NEXT_PUBLIC_ADMIN_UID;

  const isApprovedManager =
    userProfile?.role === "manager" && userProfile?.approved === true;

  // ── Firebase ID 토큰 (API Route 인증용)
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
      {/* FCMConnector: ssr:false 로 서버에서 절대 실행되지 않음 */}
      <FCMConnector uid={firebaseUser?.uid} />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
