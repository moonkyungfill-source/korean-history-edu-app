# System Architecture

> 한국사 AI 문화유산 생성기 시스템 아키텍처 문서

이 문서는 AI 코딩 에이전트가 시스템을 이해하고 재현할 수 있도록 설계되었습니다.

---

## 1. 시스템 개요

### 1.1 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                        클라이언트 (브라우저)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   학생 UI   │  │  관리자 UI  │  │   공통 컴포넌트          │  │
│  │  (student/) │  │  (admin/)   │  │ (providers, shared, ui) │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Firebase     │  │  Firebase     │  │  Firebase     │
│  Auth         │  │  Firestore    │  │  Storage      │
│  (인증)       │  │  (데이터)     │  │  (이미지)     │
└───────────────┘  └───────────────┘  └───────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Firebase AI Logic      │
              │  (Gemini 모델)          │
              │  - 이미지 생성          │
              │  - 이미지 분석          │
              │  - 문화유산 검색        │
              └─────────────────────────┘
```

### 1.2 기술 스택 상세

```yaml
Frontend:
  Framework: Next.js 16.1.1 (App Router)
  Language: TypeScript 5
  React: 19.2.3
  Styling: Tailwind CSS 4

UI Components:
  Base: Radix UI (Dialog, Select, Tabs, etc.)
  Icons: Lucide React
  Theming: next-themes
  Notifications: Sonner (Toast)

State Management:
  Global: Zustand 5
  Server State: TanStack React Query 5
  Forms: React Hook Form 7 + Zod 4

Backend Services:
  Auth: Firebase Authentication
  Database: Cloud Firestore
  Storage: Firebase Storage
  Hosting: Firebase Hosting
  AI: Firebase AI Logic (Gemini)
```

---

## 2. 데이터 모델

### 2.1 Firestore 컬렉션 구조

```typescript
// 컬렉션: users
interface User {
  uid: string;           // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'admin';
  school?: string;       // 소속 학교
  grade?: number;        // 학년 (1-3)
  class?: string;        // 학급
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  isActive: boolean;
}

// 컬렉션: generations
interface Generation {
  id: string;
  userId: string;
  userDisplayName?: string;
  era: Era;              // 시대 코드
  prompt: string;        // 사용자 입력 프롬프트
  negativePrompt: string; // 제외할 요소
  imageUrl: string;      // Storage URL
  thumbnailUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision-requested';
  createdAt: Timestamp;
  metadata: {
    generationTime: number;
    model: string;
  };
}

// 컬렉션: feedback
interface Feedback {
  id: string;
  generationId: string;
  adminId: string;
  adminDisplayName?: string;
  studentId: string;
  textFeedback: string;
  annotations: Annotation[];
  referenceUrls: string[];
  createdAt: Timestamp;
  isRead: boolean;
}

// 컬렉션: error-reports
interface ErrorReport {
  id: string;
  generationId: string;
  userId: string;
  userDisplayName?: string;
  errorType: 'costume' | 'architecture' | 'artifact' | 'anachronism' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Timestamp;
}

// 컬렉션: negative-prompts
interface NegativePrompt {
  id: string;
  era: Era | 'global';
  keywords: string[];
  description: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// 컬렉션: search-history
interface SearchHistory {
  id: string;
  userId: string;
  userDisplayName?: string;
  uploadedImageUrl?: string;
  searchQuery: string;
  searchResults: SearchResult[];
  createdAt: Timestamp;
  usedForGeneration?: boolean;
  generationId?: string;
}

// 컬렉션: settings (문서: app-config)
interface ApiKeyConfig {
  id: string;
  geminiApiKey: string;
  searchApiKey?: string;
  searchEngineId?: string;
  usageCount: number;
  lastUsedAt: Timestamp;
  monthlyUsage?: {
    [yearMonth: string]: {
      imageGeneration: number;
      textGeneration: number;
      searchQueries: number;
      totalCost: number;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}
```

### 2.2 시대(Era) 타입

```typescript
type Era =
  | 'goryeo'           // 고려시대
  | 'joseon-early'     // 조선 초기
  | 'joseon-mid'       // 조선 중기
  | 'joseon-late'      // 조선 후기
  | 'japanese-occupation'; // 일제강점기

// 각 시대별 정보
interface EraInfo {
  id: Era;
  name: string;        // 한국어 이름
  nameEn: string;      // 영어 이름
  period: string;      // 시대 기간
  description: string; // 시대 설명
  keywords: string[];  // 관련 키워드
  imagePromptPrefix: string; // AI 이미지 생성 프롬프트 프리픽스
}
```

---

## 3. 핵심 기능 구현

### 3.1 AI 이미지 생성 흐름

```
사용자 입력 → 시대 정보 조회 → 프롬프트 구성 → Gemini API 호출 → 이미지 추출 → Storage 업로드 → Firestore 저장
```

#### 핵심 코드 (src/lib/gemini/client.ts)

```typescript
// Firebase AI Logic을 사용한 이미지 생성
export async function generateImage(
  prompt: string,
  era: Era,
  userId?: string
): Promise<GenerateImageResult> {
  // 1. 시대 정보 조회
  const eraInfo = ERAS[era];

  // 2. 네거티브 프롬프트 구성
  const { negativePrompt } = buildFullPrompt(prompt, era, eraInfo.imagePromptPrefix);

  // 3. Firebase AI 초기화
  const ai = getAI(app, { backend: new GoogleAIBackend() });

  // 4. 모델 생성 (이미지 출력 활성화)
  const model = getGenerativeModel(ai, {
    model: 'gemini-3-pro-image-preview',
    generationConfig: {
      responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
    },
  });

  // 5. 이미지 생성 프롬프트
  const imagePrompt = `
    Generate a historically accurate image of Korean cultural heritage.
    Era: ${eraInfo.name}
    Scene: ${prompt}
    Style: ${eraInfo.imagePromptPrefix}
    DO NOT include: ${negativePrompt}
  `;

  // 6. 생성 및 이미지 추출
  const result = await chat.sendMessage(imagePrompt);
  const inlineDataParts = result.response.inlineDataParts?.();
  const imageBase64 = inlineDataParts?.[0]?.inlineData?.data;

  return { success: true, imageBase64, ... };
}
```

### 3.2 문화유산 검색 (Google Search Grounding)

```typescript
// src/lib/search/client.ts
export async function searchHeritage(query: string, userId?: string): Promise<SearchResponse> {
  const genAI = new GoogleGenerativeAI(API_KEY);

  // Google Search Grounding 도구 활성화
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: [{ googleSearch: {} }],
  });

  const searchPrompt = `
    한국 문화유산에 대해 검색해주세요: "${query}"
    신뢰할 수 있는 출처(국립중앙박물관, 문화재청, 한국학중앙연구원 등)의 정보를 우선적으로 참고해주세요.
  `;

  const result = await model.generateContent(searchPrompt);

  // grounding metadata에서 검색 결과 추출
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const results = groundingMetadata?.groundingChunks?.map(chunk => ({
    title: chunk.web?.title,
    link: chunk.web?.uri,
    ...
  }));

  return { success: true, results, answer: response.text() };
}
```

### 3.3 인증 및 권한 관리

```typescript
// src/components/providers/AuthProvider.tsx
// Firebase Auth와 Firestore 사용자 문서 동기화

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firestore에서 사용자 문서 조회/생성
        const userDoc = await getOrCreateUserDocument(firebaseUser);
        setUser(userDoc);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // isAdmin, isStudent 등 헬퍼 속성 제공
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isStudent, ... }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 4. 보안 규칙

### 4.1 Firestore 보안 규칙 개요

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 헬퍼 함수
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return request.auth.uid == userId; }
    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // users: 본인 또는 관리자만 접근
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
    }

    // generations: 본인 생성, 관리자 검토
    match /generations/{generationId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.userId) || isAdmin();
    }

    // settings: 관리자만 쓰기, 읽기는 제한 (API 키 보호)
    match /settings/{settingId} {
      allow read: if false; // 클라이언트 직접 읽기 금지
      allow write: if isAdmin();
    }
  }
}
```

### 4.2 Storage 보안 규칙

```javascript
// storage.rules
service firebase.storage {
  match /b/{bucket}/o {
    // generations/{userId}/{imageId}
    match /generations/{userId}/{imageId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth.uid == userId
        && request.resource.contentType.matches('image/.*')
        && request.resource.size <= 10 * 1024 * 1024;
    }
  }
}
```

---

## 5. 페이지 라우팅 구조

### 5.1 App Router 구조

```
src/app/
├── page.tsx                  # 루트 (역할별 리다이렉트)
├── layout.tsx                # 루트 레이아웃 (Providers)
│
├── (auth)/                   # 인증 그룹
│   ├── layout.tsx
│   └── login/page.tsx        # 로그인 페이지
│
├── admin/                    # 관리자 영역
│   ├── layout.tsx            # 관리자 레이아웃 (사이드바)
│   ├── dashboard/page.tsx    # 대시보드
│   ├── review/page.tsx       # 생성물 검토
│   ├── prompts/page.tsx      # 네거티브 프롬프트 관리
│   ├── users/page.tsx        # 사용자 관리
│   ├── reports/page.tsx      # 오류 보고 관리
│   ├── stats/page.tsx        # 통계
│   └── settings/page.tsx     # 시스템 설정 (API 키)
│
├── student/                  # 학생 영역
│   ├── layout.tsx            # 학생 레이아웃 (사이드바)
│   ├── dashboard/page.tsx    # 대시보드
│   ├── generate/page.tsx     # 이미지 생성 ★ 핵심 기능
│   ├── gallery/page.tsx      # 내 갤러리
│   ├── search/page.tsx       # 문화유산 검색
│   ├── feedback/page.tsx     # 피드백 확인
│   └── profile/page.tsx      # 프로필 관리
│
└── api/                      # API 라우트
    ├── generate-image/       # 이미지 생성 API
    └── analyze-image/        # 이미지 분석 API
```

---

## 6. 컴포넌트 구조

### 6.1 Provider 계층

```tsx
// src/app/layout.tsx
<html>
  <body>
    <ThemeProvider>           {/* 다크/라이트 테마 */}
      <QueryProvider>         {/* React Query */}
        <AuthProvider>        {/* Firebase Auth */}
          {children}
          <Toaster />         {/* Toast 알림 */}
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  </body>
</html>
```

### 6.2 UI 컴포넌트 (shadcn/ui 기반)

```
src/components/ui/
├── button.tsx      # 버튼
├── card.tsx        # 카드
├── dialog.tsx      # 모달/다이얼로그
├── input.tsx       # 입력 필드
├── label.tsx       # 레이블
├── select.tsx      # 선택 드롭다운
├── tabs.tsx        # 탭
├── table.tsx       # 테이블
├── textarea.tsx    # 텍스트 영역
├── badge.tsx       # 뱃지
├── skeleton.tsx    # 로딩 스켈레톤
├── switch.tsx      # 토글 스위치
├── separator.tsx   # 구분선
├── scroll-area.tsx # 스크롤 영역
├── avatar.tsx      # 아바타
├── dropdown-menu.tsx # 드롭다운 메뉴
├── sheet.tsx       # 시트 (모바일 사이드바)
└── sonner.tsx      # 토스트 알림
```

---

## 7. 환경 변수

```env
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Gemini API (선택 - Firestore settings에서 관리 가능)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

---

## 8. 배포

### Firebase Hosting 배포

```bash
# 빌드
npm run build

# Firebase 배포
firebase deploy --only hosting
```

### 빌드 설정 (next.config.ts)

```typescript
const nextConfig = {
  output: 'export',  // 정적 내보내기
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};
```

---

## 9. AI 에이전트를 위한 핵심 파일 요약

| 우선순위 | 파일 경로 | 목적 |
|---------|----------|------|
| 1 | `src/types/index.ts` | 전체 타입 정의 이해 |
| 2 | `src/constants/eras.ts` | 시대별 정보 및 프롬프트 |
| 3 | `src/lib/gemini/client.ts` | AI 이미지 생성 로직 |
| 4 | `src/lib/firebase/firestore.ts` | 데이터 CRUD 함수 |
| 5 | `src/lib/firebase/config.ts` | Firebase 초기화 |
| 6 | `src/components/providers/AuthProvider.tsx` | 인증 상태 관리 |
| 7 | `src/app/student/generate/page.tsx` | 핵심 UI 페이지 |
| 8 | `firestore.rules` | 보안 규칙 |
| 9 | `package.json` | 의존성 목록 |

---

이 문서를 기반으로 AI 코딩 에이전트가 시스템을 이해하고 유사한 애플리케이션을 개발할 수 있습니다.
