"use client";
// ============================================================
// 인증 커스텀 훅 — 로그인/로그아웃/회원가입 액션을 제공합니다.
// ============================================================

import { useState } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Google 로그인 ───
  async function loginWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 최초 로그인 시 Firestore에 사용자 문서 생성
      const userDocRef = doc(db, "users", user.uid);
      const snapshot = await getDoc(userDocRef);

      if (!snapshot.exists()) {
        // 최고 관리자 UID인지 확인
        const isAdminUid = user.uid === process.env.NEXT_PUBLIC_ADMIN_UID;
        const role: UserRole = isAdminUid ? "admin" : "member";

        const profile: Omit<UserProfile, "uid"> = {
          name: user.displayName || "이름없음",
          email: user.email || "",
          photoURL: user.photoURL || "",
          role,
          approved: role === "admin" ? true : role === "member" ? true : false,
          interests: [],
          createdAt: serverTimestamp() as any,
          lastLogin: serverTimestamp() as any,
        };
        await setDoc(userDocRef, profile);
      } else {
        // 로그인 시간 업데이트
        await setDoc(
          userDocRef,
          { lastLogin: serverTimestamp() },
          { merge: true }
        );
      }
    } catch (err: any) {
      console.error("[useAuth] Google 로그인 오류:", err);
      setError("Google 로그인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  // ─── 이메일/비밀번호 로그인 ───
  async function loginWithEmail(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await setDoc(
        doc(db, "users", user.uid),
        { lastLogin: serverTimestamp() },
        { merge: true }
      );
    } catch (err: any) {
      console.error("[useAuth] 이메일 로그인 오류:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (err.code === "auth/too-many-requests") {
        setError("너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── 이메일/비밀번호 회원가입 ───
  async function registerWithEmail(params: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    organization?: string;
    interests: string[];
  }) {
    setLoading(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        params.email,
        params.password
      );
      const user = result.user;

      // Firebase Auth 프로필에 이름 저장
      await updateProfile(user, { displayName: params.name });

      // 최고 관리자 UID인지 확인
      const isAdminUid = user.uid === process.env.NEXT_PUBLIC_ADMIN_UID;
      const finalRole: UserRole = isAdminUid ? "admin" : params.role;

      // manager는 admin 승인 전까지 approved: false
      const approved =
        finalRole === "admin" || finalRole === "member" ? true : false;

      const profile: Omit<UserProfile, "uid"> = {
        name: params.name,
        email: params.email,
        photoURL: "",
        role: finalRole,
        approved,
        organization: params.organization || "",
        interests: params.interests,
        createdAt: serverTimestamp() as any,
        lastLogin: serverTimestamp() as any,
      };

      await setDoc(doc(db, "users", user.uid), profile);
    } catch (err: any) {
      console.error("[useAuth] 회원가입 오류:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일 주소입니다.");
      } else if (err.code === "auth/weak-password") {
        setError("비밀번호는 6자 이상이어야 합니다.");
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── 로그아웃 ───
  async function logout() {
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
