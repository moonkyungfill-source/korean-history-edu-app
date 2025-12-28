# Korean History AI Cultural Heritage Generator

<div align="center">

**AI 한국사 문화유산 생성기**

*바이브 코딩을 활용한 한국사 디지털 교육자료 개발*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12-orange?logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-purple?logo=google)](https://ai.google.dev/)

[문서 바로가기](./docs/README.md) | [빠른 시작](./docs/QUICK-START.md) | [아키텍처](./docs/ARCHITECTURE.md)

</div>

---

## 프로젝트 소개

학생들이 한국 역사 시대를 선택하고, 자연어로 역사적 장면을 묘사하면 **Google Gemini AI**가 이미지를 생성해주는 교육용 웹 애플리케이션입니다.

### 주요 기능

- **AI 이미지 생성** - 한국사 시대별 역사 장면을 AI로 시각화
- **문화유산 검색** - Google Search Grounding 기반 신뢰할 수 있는 자료 검색
- **역사적 고증 검증** - AI 생성물과 실제 문화유산 비교 학습
- **관리자 피드백** - 교사가 학생 생성물에 피드백 제공

### 지원 시대

| 시대 | 기간 |
|------|------|
| 고려시대 | 918년 - 1392년 |
| 조선 초기 | 1392년 - 1494년 |
| 조선 중기 | 1494년 - 1724년 |
| 조선 후기 | 1724년 - 1897년 |
| 일제강점기 | 1910년 - 1945년 |

---

## 학술 논문 참조

이 프로젝트는 다음 학술 연구의 결과물입니다:

> **바이브 코딩을 활용한 한국사 디지털 교육자료 개발**
>
> *Development of Korean History Digital Educational Materials Using Vibe Coding*
>
> - 연구 분야: 에듀테크, AI 기반 교육, 디지털 교육자료 개발
> - 핵심 방법론: 바이브 코딩 (Vibe Coding) - AI 코딩 에이전트와의 협업 개발
> - 표준 준수: ISO/IEC/IEEE 29148:2018

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **프론트엔드** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **UI 컴포넌트** | Radix UI, Lucide React, shadcn/ui |
| **백엔드/인프라** | Firebase (Auth, Firestore, Storage, Hosting) |
| **AI 서비스** | Google Gemini (Firebase AI Logic) |
| **상태 관리** | Zustand, React Query |

---

## 빠른 시작

```bash
# 1. 클론
git clone https://github.com/[username]/korean-history-app.git
cd korean-history-app

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 Firebase 설정 입력

# 4. 개발 서버 실행
npm run dev
```

자세한 설정은 [docs/QUICK-START.md](./docs/QUICK-START.md)를 참조하세요.

---

## AI 에이전트로 이 앱 재현하기

이 섹션은 **코딩 에이전트(Claude, GPT 등)**와 함께 작업하는 선생님들을 위한 안내입니다.

### 재현 단계

1. **아키텍처 분석**
   ```
   "docs/ARCHITECTURE.md를 읽고 시스템 구조를 파악해주세요."
   ```

2. **환경 설정**
   ```
   "docs/QUICK-START.md를 참고하여 Firebase 프로젝트를 설정해주세요."
   ```

3. **핵심 파일 분석 순서**
   - `src/types/index.ts` - 타입 정의
   - `src/constants/eras.ts` - 시대별 정보
   - `src/lib/gemini/client.ts` - AI 이미지 생성
   - `src/lib/firebase/firestore.ts` - 데이터 CRUD

4. **프롬프트 예시**
   ```
   "한국사 시대(고려, 조선 초기/중기/후기, 일제강점기)를 선택하고,
   사용자가 입력한 장면 설명을 기반으로 역사적으로 정확한 이미지를
   생성하는 기능을 구현해주세요. 네거티브 프롬프트로 중국/일본 스타일
   요소를 제외하고, 각 시대의 고유한 스타일을 반영해야 합니다."
   ```

---

## 문서 구조

```
docs/
├── README.md          # 리포지토리 전체 가이드
├── ARCHITECTURE.md    # 시스템 아키텍처 상세
└── QUICK-START.md     # 빠른 시작 가이드
```

---

## 프로젝트 구조

```
korean-history-app/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # 인증 페이지
│   │   ├── admin/        # 관리자 페이지
│   │   ├── student/      # 학생 페이지
│   │   └── api/          # API 라우트
│   ├── components/       # React 컴포넌트
│   ├── constants/        # 상수 정의
│   ├── lib/              # 유틸리티 및 API 클라이언트
│   └── types/            # TypeScript 타입
├── docs/                 # 문서
├── firestore.rules       # Firestore 보안 규칙
├── storage.rules         # Storage 보안 규칙
└── firebase.json         # Firebase 설정
```

---

## 라이선스

- **소스 코드**: MIT License
- **학술 연구**: 논문 인용 시 적절한 출처 표기 필요

```bibtex
@article{korean-history-ai-generator,
  title={바이브 코딩을 활용한 한국사 디지털 교육자료 개발},
  author={[저자명]},
  year={2024}
}
```

---

## 기여

기여를 환영합니다! [GitHub Issues](../../issues)를 통해 버그 리포트나 기능 제안을 해주세요.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
