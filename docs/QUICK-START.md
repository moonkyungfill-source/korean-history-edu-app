# Quick Start Guide

> 한국사 AI 문화유산 생성기 빠른 시작 가이드

이 문서는 프로젝트를 로컬 환경에서 실행하거나 새로 배포하는 방법을 안내합니다.

---

## 1. 사전 요구 사항

### 필수 설치

| 도구 | 버전 | 확인 명령 |
|------|------|----------|
| Node.js | 18.0 이상 | `node --version` |
| npm | 9.0 이상 | `npm --version` |
| Git | 최신 | `git --version` |

### 필요 계정

1. **Google 계정** - Firebase 및 Google Cloud 사용
2. **Firebase 프로젝트** - 인증, 데이터베이스, 스토리지
3. **Google AI Studio 계정** - Gemini API 키 발급

---

## 2. 프로젝트 클론 및 설치

```bash
# 1. 리포지토리 클론
git clone https://github.com/[username]/korean-history-app.git
cd korean-history-app

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행 (설정 전 테스트)
npm run dev
```

---

## 3. Firebase 프로젝트 설정

### 3.1 Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `korean-history-edu-app`)
4. Google Analytics 설정 (선택)
5. 프로젝트 생성 완료

### 3.2 Firebase 서비스 활성화

#### Authentication 설정

1. Firebase Console > Build > Authentication
2. "시작하기" 클릭
3. Sign-in method 탭 > "이메일/비밀번호" 활성화
4. (선택) Google 로그인 활성화

#### Firestore Database 설정

1. Firebase Console > Build > Firestore Database
2. "데이터베이스 만들기" 클릭
3. 위치 선택: `asia-northeast3` (서울)
4. 보안 규칙: "테스트 모드에서 시작" (나중에 규칙 배포)

#### Storage 설정

1. Firebase Console > Build > Storage
2. "시작하기" 클릭
3. 보안 규칙: "테스트 모드에서 시작"
4. 위치: `asia-northeast3`

### 3.3 웹 앱 등록

1. Firebase Console > 프로젝트 설정 (톱니바퀴)
2. "앱 추가" > 웹 아이콘 `</>` 클릭
3. 앱 닉네임 입력 (예: `korean-history-web`)
4. Firebase Hosting 체크 (선택)
5. "앱 등록" 클릭
6. **Firebase 구성 정보 복사** (다음 단계에서 사용)

```javascript
// 이 정보를 복사하세요
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 4. 환경 변수 설정

### 4.1 .env.local 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성합니다:

```bash
# 파일 생성
touch .env.local
```

### 4.2 환경 변수 입력

```env
# Firebase 설정 (3.3에서 복사한 값 사용)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Gemini API (선택 - 관리자 설정에서도 입력 가능)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

---

## 5. Gemini API 키 발급

### 5.1 Google AI Studio에서 API 키 발급

1. [Google AI Studio](https://aistudio.google.com/) 접속
2. 왼쪽 메뉴 > "Get API Key" 클릭
3. "Create API Key" 버튼 클릭
4. 프로젝트 선택 (Firebase 프로젝트 권장)
5. **API 키 복사**

### 5.2 API 키 설정 방법 (2가지)

#### 방법 1: 환경 변수 (.env.local)

```env
NEXT_PUBLIC_GEMINI_API_KEY=your-api-key-here
```

#### 방법 2: 관리자 페이지에서 설정

1. 앱 실행 후 관리자 계정으로 로그인
2. 관리자 > 시스템 설정 페이지 이동
3. Gemini API 키 입력 및 저장
4. (이 방법은 Firestore에 암호화되어 저장됨)

---

## 6. 보안 규칙 배포

### 6.1 Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 6.2 Firebase 로그인 및 초기화

```bash
# Firebase 로그인
firebase login

# 프로젝트 연결
firebase use --add
# 프로젝트 ID 선택
```

### 6.3 보안 규칙 배포

```bash
# Firestore 규칙 배포
firebase deploy --only firestore:rules

# Storage 규칙 배포
firebase deploy --only storage:rules
```

---

## 7. 초기 데이터 설정

### 7.1 관리자 계정 생성

1. 앱 실행: `npm run dev`
2. 브라우저에서 `http://localhost:3000` 접속
3. 회원가입으로 첫 번째 계정 생성
4. Firebase Console > Firestore > users 컬렉션에서
   - 해당 사용자 문서의 `role` 필드를 `admin`으로 변경

```javascript
// Firestore에서 직접 수정
// users/{userId}
{
  "role": "admin",  // "student" → "admin"으로 변경
  ...
}
```

### 7.2 네거티브 프롬프트 초기화 (선택)

```bash
# 스크립트 실행
npm run init-data
```

또는 관리자 페이지에서 직접 추가:

1. 관리자 > 프롬프트 관리
2. 각 시대별 네거티브 프롬프트 입력
3. 저장

**권장 네거티브 프롬프트 예시:**

```
global (전역):
- Chinese style, Japanese style, anime, manga
- modern elements, contemporary, anachronistic
- fantasy, fictional, unrealistic

goryeo (고려시대):
- Joseon style, Ming dynasty, Tang dynasty

joseon-early (조선 초기):
- Japanese influence, Chinese Qing dynasty

japanese-occupation (일제강점기):
- Korean traditional only, pre-modern only
```

---

## 8. 개발 서버 실행

```bash
# 개발 모드 실행
npm run dev

# 브라우저에서 접속
# http://localhost:3000
```

### 기본 페이지 흐름

1. `/` - 로딩 후 역할별 리다이렉트
2. `/login` - 로그인/회원가입
3. `/student/dashboard` - 학생 대시보드
4. `/student/generate` - 이미지 생성 (핵심 기능)
5. `/admin/dashboard` - 관리자 대시보드

---

## 9. 프로덕션 빌드 및 배포

### 9.1 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 확인
ls -la out/
```

### 9.2 Firebase Hosting 배포

```bash
# Firebase Hosting 배포
firebase deploy --only hosting

# 배포된 URL 확인
# https://your-project-id.web.app
```

---

## 10. 문제 해결

### 자주 발생하는 오류

#### "Firebase app not initialized"

```
원인: 환경 변수가 올바르게 설정되지 않음
해결:
1. .env.local 파일 확인
2. 환경 변수 이름이 NEXT_PUBLIC_ 으로 시작하는지 확인
3. 개발 서버 재시작
```

#### "Permission denied" (Firestore)

```
원인: 보안 규칙이 배포되지 않았거나, 사용자 역할이 없음
해결:
1. firebase deploy --only firestore:rules 실행
2. users 컬렉션에 사용자 문서 존재 확인
3. role 필드가 'student' 또는 'admin'인지 확인
```

#### "Gemini API error"

```
원인: API 키가 유효하지 않거나 할당량 초과
해결:
1. Google AI Studio에서 API 키 상태 확인
2. 새 API 키 발급 후 재설정
3. 할당량 확인 (무료 티어 제한 있음)
```

#### "Image generation failed"

```
원인: Gemini 모델이 이미지 생성을 거부함
해결:
1. 프롬프트 내용 검토 (부적절한 내용 제거)
2. 네거티브 프롬프트 확인
3. 다른 표현으로 재시도
```

---

## 11. 개발 팁

### VS Code 권장 확장

- ESLint
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Firebase Explorer

### 유용한 npm 스크립트

```bash
# 개발 서버
npm run dev

# 린팅
npm run lint

# 타입 체크
npx tsc --noEmit

# 빌드
npm run build

# Firebase 배포
firebase deploy
```

### 디버깅

```javascript
// Firebase 연결 테스트
import { db } from '@/lib/firebase/config';
console.log('Firestore connected:', db);

// 사용자 상태 확인
import { useAuthContext } from '@/components/providers/AuthProvider';
const { user, isAdmin, isStudent } = useAuthContext();
console.log('Current user:', user, 'isAdmin:', isAdmin);
```

---

## 12. 다음 단계

설정이 완료되면 다음 작업을 진행할 수 있습니다:

1. **테스트 이미지 생성**: `/student/generate` 에서 시대 선택 후 이미지 생성
2. **문화유산 검색**: `/student/search` 에서 검색 기능 테스트
3. **관리자 기능**: `/admin/review` 에서 생성물 검토
4. **사용자 관리**: `/admin/users` 에서 사용자 역할 변경

---

질문이나 문제가 있으면 GitHub Issues를 통해 문의해 주세요.
