"use client";

// ============================================================
// useAuth — Firebase 인증 훅
// ============================================================
// auth 인스턴스는 lib/firebase.ts 에서 initializeAuth 로 초기화됩니다.
// browserPopupRedirectResolver 가 이미 auth 에 바인딩되어 있지만,
// signInWithPopup / signInWithRedirect 호출 시에도 명시적으로 전달해
// 혹시 모를 자동감지 실패를 이중으로 방지합니다.
// ============================================================

import { useState } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  browserPopupRedirectResolver,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Google 로그인
  // 1) signInWithPopup(resolver 명시) 시도
  // 2) auth/popup-blocked 이면 signInWithRedirect(resolver 명시) 폴백
  // 두 호출 모두 browserPopupRedirectResolver 를 명시적으로 전달해
  // SSR 환경에서 auth/network-request-failed 가 발생하지 않도록 합니다.
  async function loginWithGoogle(): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      return true;
    } catch (err: any) {
      const code: string = err?.code ?? "unknown";
      console.error("[useAuth] Google signInWithPopup 오류:", code, err?.message);

      // ── 팝업이 브라우저에 의해 차단된 경우: redirect 로 폴백
      if (code === "auth/popup-blocked") {
        console.warn("[useAuth] 팝업 차단 감지 → signInWithRedirect 폴백");
        try {
          await signInWithRedirect(auth, googleProvider, browserPopupRedirectResolver);
          // signInWithRedirect 는 페이지 전체가 이동하므로 이 줄은 실행되지 않습니다.
          return true;
        } catch (redirectErr: any) {
          const redirectCode: string = redirectErr?.code ?? "unknown";
          console.error("[useAuth] signInWithRedirect 폴백 오류:", redirectCode, redirectErr?.message);
          setError(`Google 로그인에 실패했습니다. (${redirectCode})`);
          return false;
        }
      }

      // ── 사용자가 팝업을 직접 닫은 경우: 에러 메시지 없음
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        return false;
      }

      // ── 도메인 미승인: Firebase Console → Authentication → 승인된 도메인에 추가 필요
      if (code === "auth/unauthorized-domain") {
        setError(
          "이 도메인은 Firebase에서 승인되지 않았습니다. " +
          "Firebase Console → Authentication → Settings → 승인된 도메인에 현재 도메인을 추가하세요."
        );
        return false;
      }

      // ── 그 외 오류
      setError(`Google 로그인에 실패했습니다. (${code})`);
      return false;
    } finally {
      setLoading(false);
    }
  }

  // ─── 이메일/비밀번호 로그인
  // Firestore lastLogin 업데이트는 AuthContext.onAuthStateChanged 에서 처리합니다.
  async function loginWithEmail(email: string, password: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return true;
    } catch (err: any) {
      const code: string = err?.code ?? "unknown";
      console.error("[useAuth] 이메일 로그인 오류:", code, err?.message);

      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found"     ||
        code === "auth/wrong-password"     ||
        code === "auth/invalid-email"
      ) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (code === "auth/too-many-requests") {
        setError("너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError(`로그인에 실패했습니다. (${code})`);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }

  // ─── 이메일/비밀번호 회원가입
  async function registerWithEmail(params: {
    email:        string;
    password:     string;
    name:         string;
    role:         UserRole;
    organization?: string;
    interests:    string[];
  }): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        params.email,
        params.password
      );
      const user = result.user;

      await updateProfile(user, { displayName: params.name });

      const isAdminUid  = user.uid === process.env.NEXT_PUBLIC_ADMIN_UID;
      const finalRole: UserRole = isAdminUid ? "admin" : params.role;
      const approved    = finalRole === "admin" || finalRole === "member";

      const profile: Omit<UserProfile, "uid"> = {
        name:         params.name,
        email:        params.email,
        photoURL:     "",
        role:         finalRole,
        approved,
        organization: params.organization ?? "",
        interests:    params.interests,
        createdAt:    serverTimestamp() as any,
        lastLogin:    serverTimestamp() as any,
      };

      await setDoc(doc(db, "users", user.uid), profile);
      return true;
    } catch (err: any) {
      const code: string = err?.code ?? "unknown";
      console.error("[useAuth] 회원가입 오류:", code, err?.message);

      if (code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일 주소입니다.");
      } else if (code === "auth/weak-password") {
        setError("비밀번호는 6자 이상이어야 합니다.");
      } else {
        setError(`회원가입에 실패했습니다. (${code})`);
      }
      return false;
    } finally {
      setLoading(false);
    }
  }

  // ─── 로그아웃
  async function logout(): Promise<void> {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("[useAuth] 로그아웃 오류:", err);
    } finally {
      setLoading(false);
    }
  }

  return {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    loading,
    error,
    clearError: () => setError(null),
  };
}
