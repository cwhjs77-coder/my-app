"use client";

// ============================================================
// FCMConnector — Firebase Cloud Messaging 토큰 등록 컴포넌트
// ============================================================
// AuthContext 에서 next/dynamic + ssr:false 로 임포트됩니다.
// 이 컴포넌트는 절대 서버에서 렌더링되지 않으며,
// 브라우저에서만 마운트되어 useFCM 훅을 실행합니다.
// ============================================================

import { useFCM } from "@/hooks/useFCM";

interface Props {
  uid: string | undefined;
}

export default function FCMConnector({ uid }: Props) {
  // useFCM 이 firebase/messaging 을 동적 import 로 불러옵니다.
  // 이 컴포넌트 자체도 ssr:false 로 브라우저 전용이지만,
  // useFCM 내부의 동적 import 가 이중 안전장치 역할을 합니다.
  useFCM(uid);
  return null;
}
