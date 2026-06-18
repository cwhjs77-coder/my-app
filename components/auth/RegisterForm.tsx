"use client";
// ============================================================
// 회원가입 폼 컴포넌트
// 역할(member/manager) 선택 + 관심분야 키워드 등록 포함
// manager 역할은 기관 1명 제한 검사 수행
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Check,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, INTEREST_KEYWORDS } from "@/types";
import { getManagerByOrganization } from "@/services/userService";

export default function RegisterForm() {
  const router = useRouter();
  const { registerWithEmail, loginWithGoogle, loading, error, clearError } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("member");
  const [organization, setOrganization] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // 1: 기본정보, 2: 관심분야

  // 관심분야 토글
  function toggleInterest(keyword: string) {
    setInterests((prev) =>
      prev.includes(keyword) ? prev.filter((k) => k !== keyword) : [...prev, keyword]
    );
  }

  // 직접 입력 키워드 추가
  function addCustomInterest() {
    const trimmed = customInterest.trim();
    if (!trimmed || interests.includes(trimmed)) return;
    setInterests((prev) => [...prev, trimmed]);
    setCustomInterest("");
  }

  // Step 1 유효성 검사
  async function handleStep1Next() {
    setLocalError(null);
    clearError();

    if (!name.trim()) { setLocalError("이름을 입력해주세요."); return; }
    if (!email.trim()) { setLocalError("이메일을 입력해주세요."); return; }
    if (password.length < 6) { setLocalError("비밀번호는 6자 이상이어야 합니다."); return; }
    if (password !== confirmPassword) { setLocalError("비밀번호가 일치하지 않습니다."); return; }
    if (role === "manager" && !organization.trim()) {
      setLocalError("담당자 역할은 기관/기업명을 입력해야 합니다."); return;
    }
    // manager 기관당 1명 제한 확인
    if (role === "manager" && organization.trim()) {
      const existing = await getManagerByOrganization(organization.trim());
      if (existing) {
        setLocalError(`'${organization.trim()}' 기관의 담당자가 이미 등록되어 있습니다. 기관당 1명의 담당자만 등록 가능합니다.`);
        return;
      }
    }

    setStep(2);
  }

  // 최종 제출
  async function handleSubmit() {
    setLocalError(null);
    clearError();
    if (interests.length === 0) {
      setLocalError("관심분야를 1개 이상 선택해주세요.");
      return;
    }

    await registerWithEmail({
      email,
      password,
      name,
      role,
      organization: role === "manager" ? organization : undefined,
      interests,
    });

    if (!error) {
      router.push("/dashboard");
    }
  }

  const combinedError = localError || error;

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* 타이틀 */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">
          회원가입
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          경남 지산학연 네트워크 플랫폼
        </p>
        {/* Step 인디케이터 */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${step >= 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>1</div>
          <div className={`w-12 h-0.5 ${step >= 2 ? "bg-blue-600" : "bg-slate-200"}`} />
          <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${step >= 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>2</div>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {step === 1 ? "기본 정보" : "관심분야 선택"}
        </p>
      </div>

      {/* 에러 */}
      {combinedError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {combinedError}
        </div>
      )}

      {/* ── STEP 1: 기본 정보 ── */}
      {step === 1 && (
        <div className="space-y-3">
          {/* 이름 */}
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="이름" required
              className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>

          {/* 이메일 */}
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일" required
              className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>

          {/* 비밀번호 */}
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (6자 이상)" required
              className="w-full h-11 pl-10 pr-10 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* 비밀번호 확인 */}
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 확인" required
              className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>

          {/* 역할 선택 */}
          <div className="grid grid-cols-2 gap-2">
            {(["member", "manager"] as UserRole[]).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className={`h-11 rounded-xl text-sm font-medium border transition-colors duration-150 ${role === r ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300"}`}>
                {r === "member" ? "일반 멤버" : "기관/기업 담당자"}
              </button>
            ))}
          </div>

          {/* 역할 설명 */}
          <div className="text-xs text-slate-500 dark:text-slate-400 px-1 flex items-start gap-1.5">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            {role === "member"
              ? "일반 멤버는 가입 즉시 활동 가능합니다. (대학생, 교수, 기업 직원 등)"
              : "기관/기업 담당자는 최고 관리자의 승인 후 활성화됩니다. (기관당 1명 제한)"}
          </div>

          {/* 기관명 (manager만) */}
          {role === "manager" && (
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)}
                placeholder="기관/기업명 (정확히 입력)" required
                className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
          )}

          <button onClick={handleStep1Next} disabled={loading}
            className="w-full h-12 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 disabled:opacity-60">
            다음 →
          </button>

          {/* Google 회원가입 */}
          <button type="button" onClick={loginWithGoogle} disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors duration-150">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 가입
          </button>
        </div>
      )}

      {/* ── STEP 2: 관심분야 ── */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            관심있는 분야를 선택하세요. 새 공고가 등록되면 맞춤 알림을 받을 수 있습니다.
          </p>

          {/* 사전 정의 키워드 */}
          <div className="flex flex-wrap gap-2">
            {INTEREST_KEYWORDS.map((kw) => (
              <button key={kw} type="button" onClick={() => toggleInterest(kw)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                  interests.includes(kw)
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-400"
                }`}>
                {interests.includes(kw) && <Check size={10} className="inline mr-1" />}
                {kw}
              </button>
            ))}
          </div>

          {/* 직접 입력 */}
          <div className="flex gap-2">
            <input type="text" value={customInterest} onChange={(e) => setCustomInterest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomInterest())}
              placeholder="직접 입력 후 Enter"
              className="flex-1 h-9 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            <button type="button" onClick={addCustomInterest}
              className="h-9 px-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              추가
            </button>
          </div>

          {/* 선택된 관심분야 */}
          {interests.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                선택된 관심분야 ({interests.length}개)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((kw) => (
                  <span key={kw} onClick={() => toggleInterest(kw)}
                    className="px-2 py-1 rounded-full text-xs bg-blue-600 text-white cursor-pointer flex items-center gap-1">
                    {kw}
                    <span className="text-blue-200">×</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 h-12 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
              ← 이전
            </button>
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="flex-[2] h-12 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors duration-200 disabled:opacity-60">
              {loading ? "가입 중..." : "회원가입 완료"}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
        이미 계정이 있으신가요?{" "}
        <a href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
          로그인
        </a>
      </p>
    </div>
  );
}
