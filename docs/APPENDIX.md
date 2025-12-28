# 부록 (Appendix)

> 본 문서는 "네거티브 프롬프트와 바이브 코딩을 활용한 AI 한국사 교육 고증 검증 체계 연구" 논문의 부록입니다.

---

## 부록 A: 소스 코드 및 명세서 저장소

본 연구에서 개발된 모든 산출물은 다음 GitHub 저장소에서 공개적으로 접근할 수 있습니다:

**저장소 URL**: https://github.com/moonkyungfill-source/korean-history-edu-app

### 저장소 구성

| 디렉토리/파일 | 내용 | 비고 |
|--------------|------|------|
| `/docs/SRS.md` | ISO 29148:2018 기반 전체 요구명세서 | 약 50페이지, 한국어 |
| `/docs/ARCHITECTURE.md` | 시스템 아키텍처 상세 | AI 에이전트 재현용 |
| `/docs/QUICK-START.md` | 환경 설정 가이드 | Firebase, Node.js |
| `/docs/DATA-SCHEMA.md` | Firestore 데이터베이스 스키마 | TypeScript 타입 정의 |
| `/docs/NEGATIVE-PROMPTS.md` | 시대별 네거티브 프롬프트 목록 | 고증 오류 방지 키워드 |
| `/src/` | Next.js 웹 애플리케이션 소스 코드 | TypeScript, Tailwind CSS |
| `/firestore.rules` | Firestore 보안 규칙 | 역할 기반 접근 제어 |

**라이선스**: MIT License (교육 목적 자유 사용 가능)

### AI 에이전트로 앱 재현하기

본 저장소는 Claude Code, GPT-4 등의 코딩 AI 에이전트가 읽고 동일한 애플리케이션을 재현할 수 있도록 설계되었습니다. 교사는 다음 단계를 따라 자신만의 맞춤형 앱을 개발할 수 있습니다:

1. `/docs/SRS.md` 파일을 AI 에이전트에게 제공
2. 자신의 수업 맥락에 맞게 요구사항 수정 요청
3. AI가 생성한 코드를 Firebase에 배포
4. 학생들과 함께 수업에서 활용

---

## 부록 B: 테스트 계정 정보

애플리케이션 검증을 위한 테스트 계정:

| 역할 | 이메일 | 비밀번호 | 접근 권한 |
|------|--------|----------|----------|
| 교사(관리자) | teacher@example.com | teacher123456 | 관리자 대시보드, 학생 작품 검토, 통계 |
| 학생 | student@example.com | student123456 | 이미지 생성, 갤러리, 피드백 조회 |

> **주의**: 테스트 계정은 연구 검증 목적으로만 사용하며, 실제 교육 현장 적용 시에는 별도의 계정 체계를 구축해야 합니다.

---

## 부록 C: 주요 네거티브 프롬프트 예시

본 연구에서 사용된 시대별 네거티브 프롬프트의 핵심 키워드 예시입니다.

### 전역 금지 키워드 (모든 시대 공통)

**문화적 혼동 방지**:
- `japanese style`, `chinese style`, `kimono`, `hanfu`, `samurai`
- `anime style`, `manga style`

**현대적 요소 방지**:
- `modern clothing`, `smartphone`, `electricity`, `cars`
- `contemporary`, `21st century`

**품질 관련**:
- `low quality`, `blurry`, `deformed`, `unrealistic`
- `distorted`, `poorly drawn`

### 고려시대 (918-1392)

**시대 혼동 방지**:
- `joseon style` (조선 양식)
- `confucian ceremony` (유교 의식 - 고려는 불교 중심)

**추가 금지**:
- `Ming dynasty`, `Tang dynasty` (중국 양식)
- `samurai armor` (일본 갑옷)

### 조선 전기 (1392-1592)

**시대 혼동 방지**:
- `goryeo celadon` (고려청자)
- `late joseon style` (조선 후기 양식)

**추가 금지**:
- `elaborate gold decorations` (화려한 금장식 - 후기 특징)
- `western influence` (서양 영향)

### 조선 후기 (1592-1897)

**시대 혼동 방지**:
- `early joseon simplicity` (조선 초기 소박함)
- `goryeo buddhist elements` (고려 불교 요소)

**추가 금지**:
- `japanese occupation` (일제강점기 요소)

### 일제강점기 (1910-1945)

**시대 혼동 방지**:
- `joseon king`, `royal court` (조선 왕실)
- `traditional korea only` (전통 한국만)

**추가 금지**:
- `glorifying occupation` (일제 미화)
- `imperial japanese flag` (욱일기)

> 전체 네거티브 프롬프트 목록은 `/docs/NEGATIVE-PROMPTS.md` 파일에서 확인할 수 있습니다.

---

## 부록 D: 환경 설정 가이드

### 사전 요구사항

| 도구 | 버전 | 확인 명령 |
|------|------|----------|
| Node.js | 18.0 이상 | `node --version` |
| npm | 9.0 이상 | `npm --version` |
| Git | 최신 | `git --version` |

### Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `korean-history-edu-app`)
4. Google Analytics 설정 (선택)
5. 프로젝트 생성 완료

### Firebase 서비스 활성화

#### Authentication 설정
1. Firebase Console > Build > Authentication
2. "시작하기" 클릭
3. Sign-in method 탭 > "이메일/비밀번호" 활성화

#### Firestore Database 설정
1. Firebase Console > Build > Firestore Database
2. "데이터베이스 만들기" 클릭
3. 위치 선택: `asia-northeast3` (서울)

#### Storage 설정
1. Firebase Console > Build > Storage
2. "시작하기" 클릭
3. 위치: `asia-northeast3`

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

### 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

자세한 설정은 `/docs/QUICK-START.md`를 참조하세요.

---

## 부록 E: 시스템 아키텍처 요약

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Next.js 16)                      │
├─────────────────────────────────────────────────────────────┤
│  학생 인터페이스          │        교사 인터페이스           │
│  - 시대 선택              │        - 대시보드                │
│  - 프롬프트 입력          │        - 작품 검토               │
│  - 이미지 생성            │        - 피드백 제공             │
│  - 문화유산 검색          │        - 통계 분석               │
└──────────────┬────────────┴────────────┬────────────────────┘
               │                          │
               ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Backend                          │
├─────────────────────────────────────────────────────────────┤
│  Authentication │ Firestore  │ Storage  │ AI Logic (Gemini) │
│  - 이메일/PW    │ - 사용자   │ - 이미지 │ - 이미지 생성     │
│  - 역할 관리    │ - 작품     │ - 파일   │ - 네거티브 프롬프트│
└─────────────────────────────────────────────────────────────┘
```

### 3중 안전장치 흐름

```
1차 방어 (네거티브 프롬프트)
    │
    ▼
[이미지 생성] ──→ 고증 오류 요소 사전 차단
    │
    ▼
2차 방어 (학생 자기 검증)
    │
    ▼
[문화유산 검색] ──→ Google Search API로 실제 자료와 비교
    │
    ▼
3차 방어 (교사 피드백)
    │
    ▼
[교사 검토] ──→ 승인/수정요청/거부 + 피드백 제공
    │
    ▼
[최종 승인된 이미지] ──→ 갤러리에 게시
```

자세한 아키텍처는 `/docs/ARCHITECTURE.md`를 참조하세요.
