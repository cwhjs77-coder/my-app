// ============================================================
// AuthContext — Firebase 인증 + Firestore 프로필 구독
// ============================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { registerForPushNotifications } from "@/hooks/usePushNotifications";

// ─── 타입 정의
export interface UserProfile {
  uid:             string;
  name:            string;
  email:           string;
  photoURL?:       string;
  role:            "admin" | "manager" | "member";
  approved:        boolean;
  organization?:   string;
  organizationId?: string;
  interests:       string[];
  expoPushToken?:  string;
}

interface AuthContextType {
  firebaseUser: User | null;
  userProfile:  UserProfile | null;
  loading:      boolean;
  isAdmin:      boolean;
  logout:       () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile:  null,
  loading:      true,
  isAdmin:      false,
  logout:       async () => {},
});

// ─── AuthProvider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile,  setUserProfile]  = useState<UserProfile | null>(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);

      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // ── 푸시 토큰 등록 (실기기에서만 동작, 시뮬레이터에서는 무시됨)
      registerForPushNotifications(user.uid).catch((e) =>
        console.warn("[AuthContext] 푸시 토큰 등록 실패:", e?.message)
      );

      // ── Firestore 사용자 문서 보장 (IIFE — 오류가 로그인 흐름을 막지 않도록)
      (async () => {
        try {
          const ref  = doc(db, "users", user.uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              name:      user.displayName ?? "이름없음",
              email:     user.email       ?? "",
              photoURL:  user.photoURL    ?? "",
              role:      "member",
              approved:  true,
              interests: [],
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
          } else {
            await setDoc(ref, { lastLogin: serverTimestamp() }, { merge: true });
          }
        } catch (e: any) {
          console.error("[AuthContext] Firestore 문서 처리 오류:", e?.code, e?.message);
        }
      })();

      // ── Firestore 프로필 실시간 구독
      const ref          = doc(db, "users", user.uid);
      const unsubProfile = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            setUserProfile({ uid: snap.id, ...snap.data() } as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error("[AuthContext] 프로필 구독 오류:", err?.code);
          setLoading(false);
        }
      );

      return () => unsubProfile();
    });

    return () => unsubAuth();
  }, []);

  async function logout() {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("[AuthContext] 로그아웃 오류:", e);
    }
  }

  const isAdmin = userProfile?.role === "admin";

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
