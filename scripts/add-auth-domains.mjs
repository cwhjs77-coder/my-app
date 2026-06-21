// Firebase Authentication Authorized Domains 자동 추가 스크립트
// 서비스 계정 JSON 파일을 직접 읽어 사용 (.env.local 파싱 불필요)
import { readFileSync } from "fs";
import { cert } from "firebase-admin/app";

const SA_PATH = "C:/Users/user/Downloads/gyeongnam-network-platform-firebase-adminsdk-fbsvc-51db57ec0b.json";
const sa = JSON.parse(readFileSync(SA_PATH, "utf-8"));

const credential = cert({
  projectId:   sa.project_id,
  clientEmail: sa.client_email,
  privateKey:  sa.private_key,   // JSON.parse가 \n → 실제 개행으로 변환
});

console.log("projectId  :", sa.project_id);
console.log("clientEmail:", sa.client_email);

const { access_token } = await credential.getAccessToken();

const API = `https://identitytoolkit.googleapis.com/admin/v2/projects/${sa.project_id}/config`;
const headers = { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" };

// 현재 승인 도메인 조회
const configRes = await fetch(API, { headers });
const config = await configRes.json();
if (config.error) { console.error("설정 조회 실패:", JSON.stringify(config.error)); process.exit(1); }
console.log("현재 승인 도메인:", config.authorizedDomains);

// 추가할 Vercel 도메인
const toAdd = [
  "my-app-inky-nine-80.vercel.app",
  "my-rew0fzeo2-cwhjs77-2806s-projects.vercel.app",
  "my-6nfu4xhnc-cwhjs77-2806s-projects.vercel.app",
];
const updated = [...new Set([...(config.authorizedDomains ?? []), ...toAdd])];

// PATCH 업데이트
const patchRes = await fetch(`${API}?updateMask=authorizedDomains`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ authorizedDomains: updated }),
});
const result = await patchRes.json();
if (result.error) { console.error("업데이트 실패:", JSON.stringify(result.error)); process.exit(1); }

console.log("✓ 완료. 승인 도메인:", result.authorizedDomains);
