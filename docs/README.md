# Korean History AI Cultural Heritage Generator

> **AI 한국사 문화유산 생성기** - 바이브 코딩을 활용한 한국사 디지털 교육자료 개발 프로젝트

이 프로젝트는 학생들이 한국 역사 시대를 선택하고, 자연어로 역사적 장면을 묘사하면 AI가 이미지를 생성해주는 교육용 웹 애플리케이션입니다.

---

## 학술 논문 참조

이 프로젝트는 다음 학술 연구의 결과물입니다:

> **바이브 코딩을 활용한 한국사 디지털 교육자료 개발**
>
> *Development of Korean History Digital Educational Materials Using Vibe Coding*
>
> - 연구 분야: 에듀테크, AI 기반 교육, 디지털 교육자료 개발
> - 핵심 방법론: 바이브 코딩 (Vibe Coding) - AI 코딩 에이전트와의 협업 개발
> - 표준 준수: ISO/IEC/IEEE 29148:2018 (소프트웨어 요구사항 분석)

---

## 프로젝트 개요

### 목적
한국사 교육에서 학생들의 역사적 상상력을 시각화하고, AI 생성 이미지와 실제 문화유산을 비교하는 비판적 사고력을 기르는 교육 도구입니다.

### 주요 기능
1. **AI 이미지 생성**: Google Gemini 모델을 활용한 한국사 시대별 이미지 생성
2. **문화유산 검색**: Google Search Grounding을 통한 신뢰할 수 있는 문화유산 정보 검색
3. **역사적 고증 검증**: AI 생성물과 실제 문화유산 비교를 통한 비판적 사고 학습
4. **관리자 피드백 시스템**: 교사/관리자가 학생 생성물에 피드백 제공

### 지원 시대
- 고려시대 (918년 - 1392년)
- 조선 초기 (1392년 - 1494년)
- 조선 중기 (1494년 - 1724년)
- 조선 후기 (1724년 - 1897년)
- 일제강점기 (1910년 - 1945년)

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **프론트엔드** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **UI 컴포넌트** | Radix UI, Lucide React, shadcn/ui |
| **백엔드/인프라** | Firebase (Auth, Firestore, Storage, Hosting) |
| **AI 서비스** | Google Gemini (Firebase AI Logic), Google Search Grounding |
| **상태 관리** | Zustand, React Query (TanStack Query) |
| **폼 관리** | React Hook Form, Zod |

---

## AI 에이전트로 이 앱 재현하기

이 섹션은 코딩 에이전트(Claude, GPT 등)와 함께 작업하는 선생님들을 위한 안내입니다.

### 전제 조건
1. Node.js 18+ 설치
2. Firebase 프로젝트 생성 및 설정
3. Google AI Studio에서 Gemini API 키 발급

### 재현 단계

#### 1단계: 프로젝트 구조 분석
```
코딩 에이전트에게 다음을 요청하세요:
"이 리포지토리의 docs/ARCHITECTURE.md를 읽고 시스템 구조를 파악해주세요."
```

#### 2단계: 환경 설정
```
"docs/QUICK-START.md를 참고하여 Firebase 프로젝트를 설정하고
.env.local 파일을 생성해주세요."
```

#### 3단계: 핵심 기능 구현 순서
```
다음 순서로 구현을 요청하세요:
1. Firebase 인증 설정 (src/lib/firebase/)
2. Firestore 데이터 모델 (src/types/index.ts)
3. 시대별 정보 상수 (src/constants/eras.ts)
4. Gemini 이미지 생성 (src/lib/gemini/client.ts)
5. 학생용 페이지 (src/app/student/)
6. 관리자용 페이지 (src/app/admin/)
```

#### 4단계: 핵심 프롬프트 예시
```
에이전트에게 제공할 프롬프트:

"한국사 시대(고려, 조선 초기/중기/후기, 일제강점기)를 선택하고,
사용자가 입력한 장면 설명을 기반으로 역사적으로 정확한 이미지를
생성하는 기능을 구현해주세요.

네거티브 프롬프트로 중국/일본 스타일 요소를 제외하고,
각 시대의 고유한 건축, 의복, 유물 스타일을 반영해야 합니다."
```

### 주요 소스 파일 안내

| 파일 경로 | 설명 |
|-----------|------|
| `src/types/index.ts` | 모든 TypeScript 타입 정의 |
| `src/constants/eras.ts` | 시대별 정보 및 이미지 프롬프트 프리픽스 |
| `src/lib/gemini/client.ts` | Gemini AI 이미지 생성 클라이언트 |
| `src/lib/firebase/firestore.ts` | Firestore CRUD 함수들 |
| `src/lib/search/client.ts` | 문화유산 검색 (Google Search Grounding) |
| `firestore.rules` | Firestore 보안 규칙 |
| `storage.rules` | Storage 보안 규칙 |

---

## docs/ 폴더 구조

```
docs/
├── README.md          # 이 파일 - 리포지토리 전체 가이드
├── ARCHITECTURE.md    # 시스템 아키텍처 상세 설명
└── QUICK-START.md     # 빠른 시작 가이드 (환경 설정)
```

---

## 프로젝트 구조

```
korean-history-app/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── (auth)/             # 인증 관련 페이지 (로그인)
│   │   ├── admin/              # 관리자 페이지
│   │   │   ├── dashboard/      # 관리자 대시보드
│   │   │   ├── review/         # 생성물 검토
│   │   │   ├── prompts/        # 네거티브 프롬프트 관리
│   │   │   ├── users/          # 사용자 관리
│   │   │   ├── reports/        # 오류 보고 관리
│   │   │   ├── stats/          # 통계
│   │   │   └── settings/       # 시스템 설정
│   │   ├── student/            # 학생 페이지
│   │   │   ├── dashboard/      # 학생 대시보드
│   │   │   ├── generate/       # 이미지 생성
│   │   │   ├── gallery/        # 내 갤러리
│   │   │   ├── search/         # 문화유산 검색
│   │   │   ├── feedback/       # 피드백 확인
│   │   │   └── profile/        # 프로필 관리
│   │   └── api/                # API 라우트
│   ├── components/
│   │   ├── providers/          # Context Provider들
│   │   ├── shared/             # 공통 컴포넌트
│   │   └── ui/                 # UI 컴포넌트 (shadcn/ui)
│   ├── constants/              # 상수 정의
│   ├── lib/
│   │   ├── firebase/           # Firebase 설정 및 유틸리티
│   │   ├── gemini/             # Gemini AI 클라이언트
│   │   ├── search/             # 검색 클라이언트
│   │   └── hooks/              # 커스텀 훅
│   └── types/                  # TypeScript 타입 정의
├── public/                     # 정적 파일
├── docs/                       # 문서
├── firestore.rules             # Firestore 보안 규칙
├── storage.rules               # Storage 보안 규칙
└── firebase.json               # Firebase 설정
```

---

## 빠른 시작

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env.local 파일 생성)
cp .env.example .env.local
# Firebase 및 API 키 설정

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 확인
open http://localhost:3000
```

자세한 설정 방법은 [docs/QUICK-START.md](./docs/QUICK-START.md)를 참조하세요.

---

## 라이선스

이 프로젝트는 교육 및 연구 목적으로 개발되었습니다.

- **소스 코드**: MIT License
- **학술 연구**: 논문 인용 시 적절한 출처 표기 필요

```
@article{korean-history-ai-generator,
  title={바이브 코딩을 활용한 한국사 디지털 교육자료 개발},
  author={[저자명]},
  journal={[학술지명]},
  year={2024}
}
```

---

## 기여

이 프로젝트는 오픈소스입니다. 기여를 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 문의

프로젝트 관련 문의사항은 Issue를 통해 등록해 주세요.
