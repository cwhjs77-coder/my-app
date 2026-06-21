import { redirect } from "next/navigation";

// 루트 진입 시 바로 대시보드로 이동 (로그인 여부와 무관)
export default function RootPage() {
  redirect("/dashboard");
}
