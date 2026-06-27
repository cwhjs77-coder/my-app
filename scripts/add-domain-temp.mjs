import { readFileSync } from "fs";
import { cert, initializeApp } from "firebase-admin/app";

const sa = JSON.parse(readFileSync("C:/Users/user/Downloads/gyeongnam-network-platform-firebase-adminsdk-fbsvc-51db57ec0b.json", "utf8"));
const app = initializeApp({ credential: cert(sa) });
const projectId = "gyeongnam-network-platform";
const newDomain = process.argv[2] ?? "my-app-inky-nine-80.vercel.app";

const token = await app.options.credential.getAccessToken();
const res = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`, {
  headers: { Authorization: `Bearer ${token.access_token}` }
});
const config = await res.json();
const existing = config.authorizedDomains ?? [];

if (!existing.includes(newDomain)) {
  const updated = [...existing, newDomain];
  const patch = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config?updateMask=authorizedDomains`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ authorizedDomains: updated }),
  });
  const result = await patch.json();
  console.log("Firebase 승인 도메인 추가 완료. 총", result.authorizedDomains?.length, "개");
} else {
  console.log("이미 존재:", newDomain);
}
