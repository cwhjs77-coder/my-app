"use client";
// ============================================================
// 문자/이메일 & 화상회의 패널
// ============================================================

import { useState } from "react";
import { Mail, Video, Phone, Copy, ExternalLink, Check } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export default function CommunicationPanel() {
  const { userProfile } = useAuthContext();
  const [copied, setCopied] = useState(false);

  const videoMeetingLinks = [
    { name: "Google Meet", url: "https://meet.google.com/new", icon: "🎥", description: "무료 화상회의 (Google 계정 필요)" },
    { name: "Zoom", url: "https://zoom.us/start/videomeeting", icon: "📹", description: "최대 100명 무료 화상회의" },
    { name: "Microsoft Teams", url: "https://teams.microsoft.com", icon: "💼", description: "기업용 화상회의 및 협업" },
    { name: "Webex", url: "https://www.webex.com/ko/index.html", icon: "🖥️", description: "시스코 기업용 솔루션" },
  ];

  async function copyEmail() {
    if (!userProfile?.email) return;
    await navigator.clipboard.writeText(userProfile.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendEmailToAdmin() {
    const subject = encodeURIComponent("[경남지산학연] 문의사항");
    const body = encodeURIComponent(`안녕하세요,\n\n${userProfile?.name || ""}입니다.\n\n문의 내용:\n`);
    window.open(`mailto:admin@gyeongnam-network.kr?subject=${subject}&body=${body}`, "_blank");
  }

  return (
    <div className="p-4 space-y-6 animate-fadeIn">
      <h2 className="font-bold text-slate-800 dark:text-slate-100">문자/이메일 & 화상회의</h2>

      {/* 이메일 섹션 */}
      <section className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">이메일</h3>
        </div>

        {/* 내 이메일 표시 */}
        {userProfile?.email && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{userProfile.email}</span>
            <button onClick={copyEmail} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        )}

        {/* 관리자에게 문의 */}
        <button onClick={sendEmailToAdmin}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Mail size={15} />
          관리자에게 이메일 문의
        </button>

        {/* 기본 이메일 클라이언트 열기 */}
        <button onClick={() => window.open("mailto:", "_blank")}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
          <ExternalLink size={15} />
          이메일 앱 열기
        </button>
      </section>

      {/* 화상회의 섹션 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Video size={18} className="text-violet-600 dark:text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">화상회의 바로가기</h3>
        </div>

        <div className="space-y-2">
          {videoMeetingLinks.map((link) => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
              className="card flex items-center gap-3 p-3 hover:shadow-md transition-shadow cursor-pointer block">
              <span className="text-2xl">{link.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{link.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{link.description}</p>
              </div>
              <ExternalLink size={14} className="text-slate-400 flex-shrink-0" />
            </a>
          ))}
        </div>
      </section>

      {/* 1:1 채팅 안내 */}
      <section className="card p-4 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
        <div className="flex items-center gap-2 mb-2">
          <Phone size={16} className="text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-semibold text-teal-800 dark:text-teal-300">플랫폼 내 1:1 채팅</h3>
        </div>
        <p className="text-xs text-teal-700 dark:text-teal-400">
          하단 탭바의 [홈] → [1:1 채팅] 메뉴를 통해 플랫폼 내 사용자와 직접 비밀 메시지를 주고받을 수 있습니다.
        </p>
      </section>
    </div>
  );
}
