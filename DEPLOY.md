# 경남 지산학연 네트워크 플랫폼 — 배포 가이드

## 1단계: 로컬 개발 환경 설정

```bash
# 1. Next.js 앱 의존성 설치
cd my-app
npm install

# 2. 환경변수 설정
cp .env.local.example .env.local
# .env.local 열어서 Firebase 실제 값으로 교체
```

### Firebase Admin SDK 키 설정
1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭 → JSON 다운로드
3. JSON 파일에서 아래 값들을 `.env.local`에 입력:
   - `FIREBASE_ADMIN_PROJECT_ID` = `project_id`
   - `FIREBASE_ADMIN_CLIENT_EMAIL` = `client_email`
   - `FIREBASE_ADMIN_PRIVATE_KEY` = `private_key` (줄바꿈 포함 큰따옴표로 감싸기)

### VAPID 키 설정
1. Firebase Console → 프로젝트 설정 → 클라우드 메시징
2. 웹 Push 인증서 → "키 쌍 생성" → 공개 키 복사
3. `.env.local`의 `NEXT_PUBLIC_FIREBASE_VAPID_KEY`에 입력

```bash
# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000 접속
```

---

## 2단계: Firebase 설정

```bash
# Firebase CLI 설치 (글로벌)
npm install -g firebase-tools

# 로그인
firebase login

# Firestore 보안 규칙 배포
firebase deploy --only firestore:rules
```

### Firebase Auth 설정
1. Firebase Console → Authentication → 로그인 방법
2. 이메일/비밀번호 **사용 설정**
3. Google **사용 설정** → 지원 이메일 입력

### Firestore 인덱스 (복합 쿼리용)
Firebase Console → Firestore → 인덱스 탭에서 필요 시 자동 생성:
- `users`: `approved ASC, createdAt DESC`
- `notices`: `createdAt DESC`
- `notifications`: `userId ASC, createdAt DESC`

---

## 3단계: GitHub 푸시

```bash
# Git 저장소 초기화
git init
git add .
git commit -m "feat: 경남 지산학연 네트워크 플랫폼 초기 커밋"

# GitHub 새 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/gyeongnam-network.git
git branch -M main
git push -u origin main
```

> **⚠️ 주의:** `.gitignore`에 반드시 포함 확인:
> ```
> .env.local
> .env
> firebase-admin-key.json
> serviceAccount.json
> expo-app/.env
> ```

---

## 4단계: Vercel 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 배포
vercel

# 프로덕션 배포
vercel --prod
```

### Vercel 환경변수 설정
Vercel Dashboard → 프로젝트 → Settings → Environment Variables:

| 변수명 | 값 |
|--------|-----|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API 키 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | 프로젝트 ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `project.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | VAPID 공개 키 |
| `FIREBASE_ADMIN_PROJECT_ID` | 프로젝트 ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | 서비스 계정 이메일 |
| `FIREBASE_ADMIN_PRIVATE_KEY` | 서비스 계정 비공개 키 |
| `OPENAI_API_KEY` | OpenAI API 키 |
| `NEXT_PUBLIC_ADMIN_UID` | 관리자 Firebase UID |

### Firebase Authorized Domains 추가
Firebase Console → Authentication → 승인된 도메인 →
`your-project.vercel.app` 추가

---

## 5단계: Expo 모바일 앱 (QR 미러링)

```bash
# Expo 앱 디렉토리로 이동
cd expo-app

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 Firebase 값 입력

# Expo Go 앱으로 미러링 (개발)
npx expo start

# → QR 코드 스캔 (Expo Go 앱 설치 필요)
# iOS: App Store에서 "Expo Go" 설치
# Android: Play Store에서 "Expo Go" 설치
```

### EAS Build (실제 APK/IPA 생성)
```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인 및 프로젝트 설정
eas login
eas build:configure

# Android APK 빌드
eas build --platform android --profile preview

# iOS (Mac + Apple Developer 계정 필요)
eas build --platform ios --profile preview
```

---

## 6단계: 관리자 계정 설정

1. 웹 앱에서 회원가입 (role: member 또는 manager)
2. Firebase Console → Authentication → 가입된 계정의 UID 복사
3. Vercel 환경변수 `NEXT_PUBLIC_ADMIN_UID`에 해당 UID 설정
4. Firestore `users/{uid}` 문서에서 `role: "admin"`, `approved: true` 수동 설정

---

## 트러블슈팅

### firebase-admin 빌드 오류
`next.config.ts`의 webpack fallback이 설정되어 있는지 확인:
```ts
config.resolve.fallback = { fs: false, net: false, tls: false };
```

### Tailwind 다크모드 미적용
`globals.css` 첫 줄에 `@custom-variant dark` 선언 확인:
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

### FCM 토큰 등록 실패
- HTTPS 환경에서만 동작 (localhost 제외하고 실제 도메인 필요)
- VAPID 키 오타 확인
- 브라우저 알림 권한 허용 여부 확인
