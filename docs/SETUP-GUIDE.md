# 한국사 디지털 교육자료 앱 - 설정 가이드

이 문서는 한국사 디지털 교육자료 생성 앱의 개발 환경 설정 및 초기화 과정을 안내합니다.

## 목차

1. [필수 도구](#1-필수-도구)
2. [Firebase 프로젝트 설정](#2-firebase-프로젝트-설정)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [프로젝트 설치](#4-프로젝트-설치)
5. [초기화 스크립트 실행](#5-초기화-스크립트-실행)
6. [개발 서버 실행](#6-개발-서버-실행)
7. [문제 해결](#7-문제-해결)

---

## 1. 필수 도구

### Node.js

- **버전**: 18.x 이상 (LTS 권장)
- **다운로드**: [https://nodejs.org/](https://nodejs.org/)

설치 확인:
```bash
node --version
# v18.x.x 이상이어야 합니다

npm --version
# 9.x.x 이상이어야 합니다
```

### Git

- **버전**: 2.x 이상
- **다운로드**: [https://git-scm.com/](https://git-scm.com/)

### 권장 IDE

- Visual Studio Code
- 권장 확장 프로그램:
  - ESLint
  - Prettier
  - TypeScript Importer
  - Tailwind CSS IntelliSense

---

## 2. Firebase 프로젝트 설정

### 2.1 Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속합니다.
2. "프로젝트 추가" 버튼을 클릭합니다.
3. 프로젝트 이름을 입력합니다 (예: `korean-history-edu-app`).
4. Google Analytics 설정 (선택사항)을 완료합니다.
5. 프로젝트 생성을 완료합니다.

### 2.2 Firebase 서비스 활성화

#### Authentication 설정

1. Firebase Console에서 "Authentication" 메뉴로 이동합니다.
2. "Sign-in method" 탭에서 다음 로그인 방법을 활성화합니다:
   - **이메일/비밀번호**: 학생 및 교사 계정용
   - **Google**: 간편 로그인용

#### Firestore Database 설정

1. "Firestore Database" 메뉴로 이동합니다.
2. "데이터베이스 만들기"를 클릭합니다.
3. 보안 규칙:
   - 개발 중: "테스트 모드에서 시작" 선택
   - 프로덕션: 아래의 보안 규칙 적용

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 컬렉션
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // 생성물 컬렉션
    match /generations/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        (resource.data.userId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // 피드백 컬렉션
    match /feedback/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update: if request.auth != null;
    }

    // 오류 보고 컬렉션
    match /error-reports/{docId} {
      allow read, write: if request.auth != null;
    }

    // 검색 기록 컬렉션
    match /search-history/{docId} {
      allow read, write: if request.auth != null;
    }

    // 네거티브 프롬프트 컬렉션
    match /negative-prompts/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 설정 컬렉션
    match /settings/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

4. 위치 선택: `asia-northeast3` (서울) 권장

#### Storage 설정

1. "Storage" 메뉴로 이동합니다.
2. "시작하기"를 클릭합니다.
3. 보안 규칙 설정 후 버킷을 생성합니다.

### 2.3 웹 앱 등록

1. 프로젝트 설정 (톱니바퀴 아이콘) > "일반" 탭으로 이동합니다.
2. "내 앱" 섹션에서 웹 아이콘 (`</>`)을 클릭합니다.
3. 앱 닉네임을 입력합니다 (예: `korean-history-web`).
4. "Firebase SDK 추가"에서 표시되는 설정값을 복사합니다.

### 2.4 서비스 계정 키 생성 (초기화 스크립트용)

1. 프로젝트 설정 > "서비스 계정" 탭으로 이동합니다.
2. "새 비공개 키 생성" 버튼을 클릭합니다.
3. 다운로드된 JSON 파일을 `firebase-service-account.json`으로 이름을 변경합니다.
4. 프로젝트 루트 디렉토리에 저장합니다.

> **주의**: 서비스 계정 키는 절대 Git에 커밋하지 마세요!

---

## 3. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 입력합니다:

### .env.local 템플릿

```bash
# ===================================
# Firebase 설정
# ===================================
# Firebase Console > 프로젝트 설정 > 일반 > 웹 앱에서 확인

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ===================================
# Gemini API 설정
# ===================================
# Google AI Studio에서 API 키 발급: https://aistudio.google.com/apikey

NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# ===================================
# Google Custom Search API 설정 (선택사항)
# ===================================
# Google Cloud Console에서 Custom Search API 활성화 후 발급

NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY=your_search_api_key_here
NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### 환경 변수 설명

| 변수명 | 설명 | 필수 여부 |
|--------|------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase 웹 API 키 | 필수 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase 인증 도메인 | 필수 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID | 필수 |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage 버킷 | 필수 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase 메시징 발신자 ID | 필수 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase 앱 ID | 필수 |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API 키 (이미지 생성) | 필수 |
| `NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY` | Google Custom Search API 키 | 선택 |
| `NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID` | Google 검색 엔진 ID | 선택 |

---

## 4. 프로젝트 설치

### 4.1 저장소 클론

```bash
git clone <repository-url>
cd korean-history-app
```

### 4.2 의존성 설치

```bash
npm install
```

### 4.3 설치되는 주요 패키지

| 패키지 | 용도 |
|--------|------|
| `next` | React 프레임워크 |
| `firebase` | Firebase 클라이언트 SDK |
| `@google/generative-ai` | Gemini AI API |
| `@tanstack/react-query` | 서버 상태 관리 |
| `zustand` | 클라이언트 상태 관리 |
| `tailwindcss` | CSS 프레임워크 |
| `@radix-ui/*` | UI 컴포넌트 |
| `zod` | 스키마 검증 |
| `react-hook-form` | 폼 관리 |

---

## 5. 초기화 스크립트 실행

### 5.1 네거티브 프롬프트 초기화

Firestore에 시대별 네거티브 프롬프트 데이터를 초기화합니다:

```bash
npm run init-data
```

이 스크립트는 다음 작업을 수행합니다:
- `negative-prompts` 컬렉션에 전역 네거티브 프롬프트 생성
- 각 시대별 (고려, 조선 초기/중기/후기, 일제강점기) 네거티브 프롬프트 생성

### 5.2 앱 설정 초기화

API 키 및 앱 설정을 Firestore에 저장합니다:

```bash
npm run init-settings
```

> **사전 요구사항**: `firebase-service-account.json` 파일이 프로젝트 루트에 있어야 합니다.

이 스크립트는 다음 작업을 수행합니다:
- `settings/app-config` 문서 생성/업데이트
- Gemini API 키 저장
- Google Search API 키 저장 (설정된 경우)

---

## 6. 개발 서버 실행

### 6.1 개발 모드 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

### 6.2 프로덕션 빌드

```bash
npm run build
npm run start
```

### 6.3 코드 린팅

```bash
npm run lint
```

---

## 7. 문제 해결

### Firebase 연결 오류

**증상**: "Firebase: Error (auth/configuration-not-found)"

**해결**:
1. `.env.local` 파일의 Firebase 설정값이 올바른지 확인합니다.
2. Firebase Console에서 웹 앱이 등록되어 있는지 확인합니다.
3. 개발 서버를 재시작합니다.

### Gemini API 오류

**증상**: "API key not valid" 오류

**해결**:
1. [Google AI Studio](https://aistudio.google.com/apikey)에서 API 키 상태를 확인합니다.
2. API 키가 활성화되어 있는지 확인합니다.
3. 관리자 페이지에서 API 키를 재설정합니다.

### 초기화 스크립트 실패

**증상**: "firebase-service-account.json을 찾을 수 없습니다"

**해결**:
1. Firebase Console > 프로젝트 설정 > 서비스 계정에서 새 키를 생성합니다.
2. 다운로드한 파일을 `firebase-service-account.json`으로 이름을 변경합니다.
3. 프로젝트 루트 디렉토리에 저장합니다.

### TypeScript 오류

**증상**: 타입 관련 컴파일 오류

**해결**:
```bash
# 타입 체크
npx tsc --noEmit

# node_modules 재설치
rm -rf node_modules
npm install
```

---

## 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Firebase 문서](https://firebase.google.com/docs)
- [Gemini API 문서](https://ai.google.dev/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
