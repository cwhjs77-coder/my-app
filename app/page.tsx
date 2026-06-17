"use client";

import { useEffect, useState } from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, provider, db } from "../lib/firebase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          lastLogin: new Date().toISOString(),
        },
        { merge: true }
      );

      setUser(user);
    } catch (error) {
      console.error("로그인 오류:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <main style={{ padding: "40px" }}>
        <h2>로딩 중...</h2>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>경남 네트워크 플랫폼</h1>

      {!user ? (
        <button
          onClick={login}
          style={{
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          Google 로그인
        </button>
      ) : (
        <>
          <h2>환영합니다.</h2>

          {user.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              width={120}
              height={120}
              style={{
                borderRadius: "50%",
                marginBottom: "20px",
              }}
            />
          )}

          <p>
            <strong>이름:</strong> {user.displayName}
          </p>

          <p>
            <strong>이메일:</strong> {user.email}
          </p>

          <button
            onClick={logout}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </>
      )}
    </main>
  );
}