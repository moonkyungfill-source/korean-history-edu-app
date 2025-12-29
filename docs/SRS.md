# Software Requirements Specification (SRS)
# AI Korean Cultural Heritage Image Generator
## AI 문화유산 이미지 생성기

**ISO/IEC/IEEE 29148:2018 Compliant**

---

**Document Information**

| Item | Description |
|------|-------------|
| Project Name | AI Korean Cultural Heritage Image Generator |
| Version | 1.0.0 |
| Date | 2025-12-28 |
| Status | Released |
| Author | Claude Code (Vibe Coding Implementation) |
| Standard | ISO/IEC/IEEE 29148:2018 |

---

## Table of Contents

1. [Purpose](#1-purpose-목적)
2. [Scope](#2-scope-범위)
3. [Definitions](#3-definitions-용어-정의)
4. [Product Perspective](#4-product-perspective-제품-관점)
5. [Product Functions](#5-product-functions-제품-기능)
6. [User Characteristics](#6-user-characteristics-사용자-특성)
7. [Limitations](#7-limitations-제약조건)
8. [Assumptions and Dependencies](#8-assumptions-and-dependencies-가정-및-의존성)
9. [Specified Requirements](#9-specified-requirements-상세-요구사항)
10. [Verification](#10-verification-검증)

---

## 1. Purpose (목적)

### 1.1 Document Purpose

This Software Requirements Specification (SRS) document provides a complete and unambiguous description of the AI Korean Cultural Heritage Image Generator application. This document is designed to enable coding agents to fully reproduce the application by reading this specification alone.

이 소프트웨어 요구사항 명세서(SRS)는 AI 문화유산 이미지 생성기 애플리케이션의 완전하고 명확한 설명을 제공합니다. 이 문서는 코딩 에이전트가 이 명세서만 읽고 애플리케이션을 완전히 재현할 수 있도록 설계되었습니다.

### 1.2 Product Purpose

The AI Korean Cultural Heritage Image Generator is a web application designed for Korean history education in middle schools. It enables students to generate historically accurate images of Korean cultural heritage using AI, with built-in safeguards to prevent cultural confusion errors (e.g., confusing Korean hanbok with Japanese kimono or Chinese hanfu).

AI 문화유산 이미지 생성기는 중학교 한국사 교육을 위해 설계된 웹 애플리케이션입니다. 학생들이 AI를 사용하여 역사적으로 정확한 한국 문화유산 이미지를 생성할 수 있으며, 문화적 혼동 오류(예: 한복을 기모노나 한푸로 혼동)를 방지하는 안전장치가 내장되어 있습니다.

### 1.3 Intended Audience

| Audience | Use of This Document |
|----------|---------------------|
| Coding Agents (AI) | Primary audience - complete implementation reference |
| Korean History Teachers | Understanding available features and educational workflows |
| Software Developers | Technical implementation reference |
| QA Engineers | Verification criteria and test cases |

### 1.4 Educational Objectives

1. **Historical Accuracy**: Provide historically accurate visual representations of Korean cultural heritage
2. **Critical Thinking**: Enable students to verify AI-generated content against real historical artifacts
3. **Cultural Authenticity**: Prevent Western-centric AI bias through negative prompt mechanisms
4. **Teacher Empowerment**: Allow teachers to customize and manage educational content without programming knowledge

---

## 2. Scope (범위)

### 2.1 Product Name

**AI Korean Cultural Heritage Image Generator** (AI 문화유산 이미지 생성기)

### 2.2 Product Overview

A serverless web application that:
- Generates AI images of Korean historical scenes based on text prompts
- Automatically applies negative prompts to prevent cultural anachronisms
- Provides teacher oversight through review and feedback mechanisms
- Supports student self-verification through Google Search integration

### 2.3 Supported Historical Eras

| Era ID | Korean Name | English Name | Period | Description |
|--------|------------|--------------|--------|-------------|
| `goryeo` | 고려시대 | Goryeo Dynasty | 918-1392 | Buddhist culture, celadon pottery |
| `joseon-early` | 조선 초기 | Early Joseon | 1392-1494 | Confucian foundations, Hangeul creation |
| `joseon-mid` | 조선 중기 | Middle Joseon | 1494-1724 | Sarim politics, Imjin War |
| `joseon-late` | 조선 후기 | Late Joseon | 1724-1897 | Silhak, folk culture flourishing |
| `japanese-occupation` | 일제강점기 | Japanese Occupation | 1910-1945 | Independence movement |

### 2.4 User Interfaces

The application consists of two main interfaces:

1. **Student Interface** (`/student/*`)
   - Image generation
   - Personal gallery
   - Heritage verification
   - Feedback viewing

2. **Teacher (Admin) Interface** (`/admin/*`)
   - Negative prompt management
   - Student work review
   - Statistics dashboard
   - User management

### 2.5 Out of Scope

The following are explicitly NOT included in this version:

- Integration with external LMS (e.g., Google Classroom, e-hakseuteo)
- Real-time collaborative editing
- Video generation
- Voice narration
- Multi-language support beyond Korean and English
- Offline mode (requires internet connection)

---

## 3. Definitions (용어 정의)

### 3.1 Technical Terms

| Term | Definition |
|------|------------|
| **Negative Prompt** | Keywords automatically injected into AI image generation to exclude unwanted elements (e.g., "kimono", "hanfu"). Based on Ban et al. (2024) deceleration and neutralization mechanism. |
| **Era** | One of five supported historical periods in Korean history |
| **Generation** | A single AI-generated image with associated metadata |
| **Feedback** | Teacher comments and annotations on student work |
| **Error Report** | Student-reported historical inaccuracies in generated images |
| **Historical Authenticity (고증)** | Accuracy of historical representation in generated content |

### 3.2 User Roles

| Role | ID | Description | Access Level |
|------|----|-----------|--------------|
| **Student** | `student` | Middle school student (grades 1-3, ages 13-15) | Student interface only |
| **Teacher/Admin** | `admin` | Korean history teacher | Both interfaces with full access |

### 3.3 Document Status Values

| Entity | Status Values | Description |
|--------|---------------|-------------|
| **Generation** | `pending`, `approved`, `rejected`, `revision-requested` | Review workflow states |
| **Error Report** | `pending`, `reviewed`, `resolved` | Teacher processing states |
| **Feedback** | `isRead: boolean` | Read status tracking |

### 3.4 Acronyms

| Acronym | Full Form |
|---------|-----------|
| SRS | Software Requirements Specification |
| API | Application Programming Interface |
| LLM | Large Language Model |
| UI | User Interface |
| RBAC | Role-Based Access Control |

---

## 4. Product Perspective (제품 관점)

### 4.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS                                          │
│                    ┌──────────────┐  ┌──────────────┐                       │
│                    │   Students   │  │   Teachers   │                       │
│                    │ (Web Browser)│  │ (Web Browser)│                       │
│                    └──────┬───────┘  └──────┬───────┘                       │
└────────────────────────────┼────────────────┼───────────────────────────────┘
                             │                │
                             ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                                  │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                    Next.js 16 Application                          │     │
│  │  ┌─────────────────────────────┐ ┌─────────────────────────────┐  │     │
│  │  │     Student Interface       │ │     Admin Interface         │  │     │
│  │  │  /student/dashboard         │ │  /admin/dashboard           │  │     │
│  │  │  /student/generate          │ │  /admin/prompts             │  │     │
│  │  │  /student/gallery           │ │  /admin/review              │  │     │
│  │  │  /student/search            │ │  /admin/users               │  │     │
│  │  │  /student/feedback          │ │  /admin/stats               │  │     │
│  │  │  /student/profile           │ │  /admin/reports             │  │     │
│  │  └─────────────────────────────┘ └─────────────────────────────┘  │     │
│  │                                                                    │     │
│  │  ┌──────────────────────────────────────────────────────────────┐ │     │
│  │  │                    Shared Components                          │ │     │
│  │  │  Header | ThemeProvider | AuthProvider | QueryProvider        │ │     │
│  │  └──────────────────────────────────────────────────────────────┘ │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                   │                                          │
│                    React 19 + Tailwind CSS + Radix UI                       │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BUSINESS LOGIC LAYER                               │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                       Client-Side Libraries                         │     │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────┐  │     │
│  │  │  lib/firebase  │ │  lib/gemini    │ │     lib/search         │  │     │
│  │  │  ├─ auth.ts    │ │  ├─ client.ts  │ │  └─ client.ts          │  │     │
│  │  │  ├─ config.ts  │ │  └─ image-     │ │                        │  │     │
│  │  │  ├─ firestore  │ │     analysis.ts│ │                        │  │     │
│  │  │  └─ storage.ts │ └────────────────┘ └────────────────────────┘  │     │
│  │  └────────────────┘                                                │     │
│  │                                                                    │     │
│  │  ┌────────────────────────────────────────────────────────────┐   │     │
│  │  │                    Constants & Types                        │   │     │
│  │  │  constants/eras.ts | constants/negativePrompts.ts           │   │     │
│  │  │  types/index.ts                                             │   │     │
│  │  └────────────────────────────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND SERVICES                                 │
│                          (Firebase Platform)                                │
│                                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │    Firebase     │ │    Cloud        │ │    Firebase     │               │
│  │ Authentication  │ │   Firestore     │ │    Storage      │               │
│  │                 │ │                 │ │                 │               │
│  │  • Google OAuth │ │  • users        │ │  • student-works│               │
│  │  • Email/Pass   │ │  • generations  │ │  • profiles     │               │
│  │                 │ │  • feedback     │ │                 │               │
│  │                 │ │  • error-reports│ │                 │               │
│  │                 │ │  • negative-    │ │                 │               │
│  │                 │ │    prompts      │ │                 │               │
│  │                 │ │  • search-      │ │                 │               │
│  │                 │ │    history      │ │                 │               │
│  │                 │ │  • settings     │ │                 │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Firebase Hosting                               │   │
│  │                    korean-history-edu-app.web.app                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL AI SERVICES                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Firebase AI Logic (Vertex AI)                     │   │
│  │                                                                       │   │
│  │   ┌─────────────────────────────────────────────────────────────┐   │   │
│  │   │            Gemini 3 Pro Image Preview                        │   │   │
│  │   │            (gemini-3-pro-image-preview)                      │   │   │
│  │   │                                                               │   │   │
│  │   │   • Image Generation from Text                               │   │   │
│  │   │   • Image Analysis (Vision)                                  │   │   │
│  │   │   • Google Search Grounding                                  │   │   │
│  │   └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                       │   │
│  │   Access: firebase/ai SDK (No API key required on client)            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Google Custom Search API                          │   │
│  │                    (Heritage Verification)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend Framework** | Next.js | 16.1.1 | React-based SSR/SSG framework |
| **UI Library** | React | 19.2.3 | Component-based UI |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Component Library** | Radix UI | Latest | Accessible primitives |
| **State Management** | Zustand | 5.0.9 | Lightweight state management |
| **Data Fetching** | TanStack Query | 5.90.12 | Server state management |
| **Form Handling** | React Hook Form | 7.69.0 | Form state management |
| **Validation** | Zod | 4.2.1 | Schema validation |
| **Authentication** | Firebase Auth | 12.7.0 | Google OAuth + Email/Password |
| **Database** | Cloud Firestore | 12.7.0 | NoSQL document database |
| **File Storage** | Firebase Storage | 12.7.0 | Image file storage |
| **AI/ML** | Firebase AI Logic | 12.7.0 | Gemini integration |
| **Hosting** | Firebase Hosting | - | Static hosting + CDN |

### 4.3 Three-Layer Safety Mechanism

Based on theoretical framework from Ban et al. (2024) and the Fail-Safe Design principle:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      THREE-LAYER SAFETY MECHANISM                       │
│                       (3중 안전장치 시스템)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 1: GENERATION PHASE PREVENTION (생성 단계 차단)           │   │
│  │                                                                   │   │
│  │  [Student Input] ──► [Era Selection] ──► [Negative Prompt]       │   │
│  │                                              │                    │   │
│  │  "조선시대 한복"    "joseon-mid"     ┌───────┴───────┐            │   │
│  │                                      │ BLOCKED:      │            │   │
│  │                                      │ • kimono      │            │   │
│  │                                      │ • hanfu       │            │   │
│  │                                      │ • samurai     │            │   │
│  │                                      │ • modern items│            │   │
│  │                                      └───────────────┘            │   │
│  │  Mechanism: Deceleration & Neutralization (Ban et al., 2024)     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 2: STUDENT SELF-VERIFICATION (학생 주도 검증)              │   │
│  │                                                                   │   │
│  │  [Generated Image] ──► [Verify Button] ──► [Google Search API]   │   │
│  │                                                │                  │   │
│  │                                     ┌──────────┴──────────┐       │   │
│  │                                     │ Real Museum Photos  │       │   │
│  │                                     │ • 국립중앙박물관     │       │   │
│  │                                     │ • 국립고궁박물관     │       │   │
│  │                                     │ Historical Records  │       │   │
│  │                                     └─────────────────────┘       │   │
│  │  Benefit: Critical Historical Literacy Development               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 3: TEACHER REVIEW & FEEDBACK (교사 검토 및 피드백)         │   │
│  │                                                                   │   │
│  │  [All Student Works] ──► [Admin Dashboard] ──► [Final Review]    │   │
│  │                                                       │           │   │
│  │                          ┌────────────────────────────┴────┐      │   │
│  │                          │ Actions:                        │      │   │
│  │                          │ • Approve ✓                     │      │   │
│  │                          │ • Reject ✗                      │      │   │
│  │                          │ • Request Revision ↺            │      │   │
│  │                          │ • Add Annotations ✎             │      │   │
│  │                          │ • Attach Reference Links 🔗     │      │   │
│  │                          └─────────────────────────────────┘      │   │
│  │  Purpose: Professional Oversight & Quality Assurance              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  TRUST CYCLE: Prevention → Verification → Review → Improved Content   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4 System Interfaces

#### 4.4.1 Firebase AI Logic Interface

```typescript
// Client-side AI access (no API key required)
import { getAI, getGenerativeModel, GoogleAIBackend, ResponseModality } from 'firebase/ai';

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, {
  model: 'gemini-3-pro-image-preview',
  generationConfig: {
    responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
  },
});
```

#### 4.4.2 Firebase Authentication Interface

- **Google OAuth 2.0**: Primary authentication for teachers
- **Email/Password**: Student accounts (created by teachers)
- **Session Management**: Firebase Auth tokens with automatic refresh

#### 4.4.3 Cloud Firestore Interface

- **Real-time Updates**: Subscriptions for feedback notifications
- **Offline Support**: Basic read caching
- **Security Rules**: RBAC-based access control

---

## 5. Product Functions (제품 기능)

### 5.1 Student Functions (학생 기능) - 9 Features

#### SF-01: Era Selection (시대 선택)

| ID | SF-01 |
|----|-------|
| Name | Era Selection |
| Description | Student selects historical era for image generation |
| Priority | High |
| Input | User click/tap on era option |
| Output | Era context set for generation |
| UI | Dropdown menu or button group with 5 era options |

**Acceptance Criteria (Gherkin Format):**
```gherkin
Feature: Era Selection
  Scenario: Student selects Joseon Middle Period
    Given the student is on the image generation page
    When the student clicks on "조선 중기" option
    Then the era "joseon-mid" is set for the current generation
    And the corresponding negative prompts are loaded
    And the era badge displays "조선 중기 (1494-1724)"
```

#### SF-02: Scene Description Input (장면 설명 입력)

| ID | SF-02 |
|----|-------|
| Name | Scene Description Input |
| Description | Student enters text description of desired historical scene |
| Priority | High |
| Input | Text input (Korean or English) |
| Output | Validated prompt string |
| Validation | Minimum 5 characters, maximum 500 characters |

**Implementation:**
```typescript
interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  minLength: 5;
  maxLength: 500;
  placeholder: "예: 세종대왕이 한글을 창제하는 모습";
}
```

#### SF-03: Prompt Writing Tips (프롬프트 작성 도움말)

| ID | SF-03 |
|----|-------|
| Name | Prompt Writing Tips |
| Description | Interactive guide for writing effective historical prompts |
| Priority | Medium |
| Trigger | Click "팁 보기" button |
| Content | Subject + Context + Style framework |

**Tip Content Structure:**
1. **Specific Description**: "양반" → "파란색 도포를 입은 양반 남성"
2. **Time and Setting**: Include era and location
3. **Adjective Usage**: Emotional/atmospheric words
4. **Avoid Negatives**: Describe what you want, not what you don't
5. **Era-specific Examples**: 5 sample prompts per era

#### SF-04: Image Generation (이미지 생성)

| ID | SF-04 |
|----|-------|
| Name | Image Generation |
| Description | Generate AI image based on prompt and era |
| Priority | Critical |
| Timeout | 15 seconds maximum |
| Model | gemini-3-pro-image-preview |

**Process Flow:**
```
1. Student clicks "이미지 생성" button
2. System validates prompt length and content
3. Era-specific negative prompts are appended
4. Firebase AI Logic calls Gemini model
5. Generated image is converted to Base64
6. Image is uploaded to Firebase Storage
7. Generation record is created in Firestore
8. Image displayed to student
```

**Negative Prompt Construction:**
```typescript
function buildFullPrompt(userPrompt: string, era: Era, eraPrefix: string) {
  const prompt = `${eraPrefix}, ${userPrompt}, historically accurate Korean cultural heritage, detailed traditional Korean art style, museum quality`;
  const negativePrompt = buildNegativePrompt(era); // Combines global + era-specific
  return { prompt, negativePrompt };
}
```

#### SF-05: Personal Gallery (개인 갤러리)

| ID | SF-05 |
|----|-------|
| Name | Personal Gallery |
| Description | View all generated images with metadata |
| Priority | High |
| Default Sort | Newest first (createdAt DESC) |
| Pagination | Infinite scroll or load more |

**Display Information per Image:**
- Thumbnail image
- Era badge
- Original prompt
- Creation date/time
- Status badge (pending/approved/rejected/revision-requested)
- Feedback indicator (unread count)

#### SF-06: Heritage Verification (문화유산 검증)

| ID | SF-06 |
|----|-------|
| Name | Heritage Verification |
| Description | Compare generated image with real museum artifacts |
| Priority | High |
| API | Google Custom Search API |

**Verification Process:**
```
1. Student clicks "고증 검증하기" button
2. System extracts keywords from generation prompt
3. Google Search API queries trusted sources:
   - 국립중앙박물관 (museum.go.kr)
   - 국립고궁박물관 (gogung.go.kr)
   - 한국민족문화대백과사전
4. Search results displayed with:
   - Title and snippet
   - Thumbnail image
   - Source link
5. Student compares AI image with real artifacts
```

#### SF-07: Error Reporting (오류 신고)

| ID | SF-07 |
|----|-------|
| Name | Error Reporting |
| Description | Report historical inaccuracies in generated images |
| Priority | Medium |

**Error Types:**
| Type ID | Korean Name | English Name |
|---------|-------------|--------------|
| `costume` | 복식 오류 | Costume Error |
| `architecture` | 건축물 오류 | Architecture Error |
| `artifact` | 도구/물건 오류 | Artifact Error |
| `anachronism` | 시대착오 | Anachronism |
| `other` | 기타 | Other |

#### SF-08: Feedback Viewing (피드백 확인)

| ID | SF-08 |
|----|-------|
| Name | Feedback Viewing |
| Description | View teacher comments and annotations |
| Priority | High |
| Notification | Unread feedback indicator |

**Feedback Content:**
- Text feedback
- Image annotations (circles, arrows, text, rectangles)
- Reference URLs (museum links)
- Read status tracking

#### SF-09: Student Registration (학생 회원가입)

| ID | SF-09 |
|----|-------|
| Name | Student Registration |
| Description | Self-registration for students with pending approval workflow |
| Priority | High |
| Access | Public (unauthenticated users) |

**Registration Process:**
```
1. Student navigates to /register page
2. Student fills registration form:
   - Email address (required, validated)
   - Password (required, min 8 characters)
   - Display name (required)
   - School name (required)
   - Grade (required, 1-3)
   - Class (required)
3. System validates input and checks for duplicate email
4. Firebase Auth creates account (disabled by default)
5. User document created in Firestore with status: 'pending'
6. Success message: "가입 신청이 완료되었습니다. 선생님의 승인을 기다려 주세요."
```

**Registration Form Fields:**

| Field | Type | Validation | Korean Label |
|-------|------|------------|--------------|
| `email` | string | Email format, unique | 이메일 |
| `password` | string | Min 8 chars, 1 uppercase, 1 number | 비밀번호 |
| `passwordConfirm` | string | Must match password | 비밀번호 확인 |
| `displayName` | string | 2-20 chars, Korean/English | 이름 |
| `school` | string | 2-50 chars | 학교 |
| `grade` | number | 1, 2, or 3 | 학년 |
| `class` | string | e.g., "1반" | 학급 |

**Acceptance Criteria (Gherkin Format):**
```gherkin
Feature: Student Registration
  Scenario: Successful registration with pending approval
    Given the student is on the registration page
    When the student fills in valid registration information
    And clicks the "가입 신청" button
    Then a new user account is created with status "pending"
    And the student sees "가입 신청이 완료되었습니다. 선생님의 승인을 기다려 주세요."
    And the student cannot login until approved

  Scenario: Attempt login before approval
    Given a student has registered but not yet approved
    When the student attempts to login
    Then the login fails with message "승인 대기 중입니다. 선생님의 승인을 기다려 주세요."
```

---

### 5.2 Teacher Functions (선생님 기능) - 8 Features

#### TF-01: Negative Prompt Management (금지 키워드 관리)

| ID | TF-01 |
|----|-------|
| Name | Negative Prompt Management |
| Description | Manage era-specific and global blocked keywords |
| Priority | Critical |
| Access | Admin only |

**Default Negative Prompts Structure:**

**Global (All Eras):**
```typescript
const GLOBAL_NEGATIVE_PROMPTS = [
  // Cultural confusion prevention
  'chinese style', 'japanese style', 'kimono', 'hanfu', 'qipao',
  'samurai', 'ninja', 'geisha', 'chinese dragon', 'japanese castle',

  // Unrealistic representation prevention
  'anime', 'cartoon', 'manga style', 'fantasy', 'sci-fi',

  // Modern element prevention
  'modern clothing', 'jeans', 'smartphone', 'electric lights', 'cars',

  // Quality control
  'low quality', 'blurry', 'distorted', 'deformed'
];
```

**Era-Specific Examples:**

| Era | Blocked Keywords |
|-----|-----------------|
| Goryeo | joseon style, confucian hat, gat hat, hangul text |
| Joseon Early | goryeo celadon, mongol influence, western influence |
| Joseon Mid | western architecture, catholic church, photography |
| Joseon Late | japanese occupation, automobiles, electricity |
| Japanese Occupation | joseon king, royal court, korean war, post-1945 |

#### TF-02: Error Report Review (오류 신고 확인)

| ID | TF-02 |
|----|-------|
| Name | Error Report Review |
| Description | View and process student error reports |
| Priority | Medium |

**Workflow:**
```
1. View pending reports list
2. Click report to see details:
   - Generated image
   - Error type
   - Student description
   - Reporter name
3. Update status: pending → reviewed → resolved
4. Optional: Add negative keyword based on report
```

#### TF-03: Student Work Review (학생 작품 검수)

| ID | TF-03 |
|----|-------|
| Name | Student Work Review |
| Description | Approve, reject, or request revision for student generations |
| Priority | Critical |

**Review Actions:**
| Action | Status | Effect |
|--------|--------|--------|
| Approve | `approved` | Work visible in approved gallery |
| Reject | `rejected` | Work marked as rejected with reason |
| Request Revision | `revision-requested` | Student notified to revise |

#### TF-04: Activity Statistics (활동 통계)

| ID | TF-04 |
|----|-------|
| Name | Activity Statistics |
| Description | View generation statistics by student, era, and time |
| Priority | Medium |

**Statistics Dashboard:**
- Total generations count
- Generations by era (bar chart)
- Generations by status (pie chart)
- Daily/weekly/monthly trends
- Student activity ranking

#### TF-05: Feedback Writing (피드백 작성)

| ID | TF-05 |
|----|-------|
| Name | Feedback Writing |
| Description | Write text feedback and annotate images |
| Priority | High |

**Annotation Types:**
```typescript
type AnnotationType = 'circle' | 'arrow' | 'text' | 'rectangle';

interface Annotation {
  id: string;
  type: AnnotationType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;  // For arrows
  endY?: number;
  text?: string;
  color: string;
}
```

#### TF-06: Data Export (데이터 내보내기)

| ID | TF-06 |
|----|-------|
| Name | Data Export |
| Description | Export student activity data |
| Priority | Low |
| Formats | CSV, JSON |

**Export Options:**
- By student
- By era
- By date range
- All data

#### TF-07: User Management (사용자 관리)

| ID | TF-07 |
|----|-------|
| Name | User Management |
| Description | Create, manage, and control student accounts |
| Priority | High |

**Capabilities:**
- Create student accounts (email/password)
- Activate/deactivate accounts
- View student profiles
- Change user roles (student ↔ admin)
- Screen switching: Teacher can view student interface

**Screen Switch UI:**
```
Header: [Logo] [Title] [Theme] [👨‍🎓 Student | 👩‍🏫 Admin] [Profile]
```

#### TF-08: Registration Approval (가입 승인 관리)

| ID | TF-08 |
|----|-------|
| Name | Registration Approval |
| Description | Review and approve/reject student registration requests with email notification |
| Priority | High |
| Access | Admin only |

**Approval Dashboard UI:**
```
/admin/registrations
┌─────────────────────────────────────────────────────────────┐
│ 가입 승인 관리                                    [새로고침] │
├─────────────────────────────────────────────────────────────┤
│ ⏳ 대기 중: 5명  ✅ 승인됨: 42명  ❌ 거절됨: 3명             │
├─────────────────────────────────────────────────────────────┤
│ 📋 가입 대기 목록                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 홍길동 | student@school.edu | 서울중학교 2학년 3반     │ │
│ │ 가입 신청: 2025-01-15 09:30                             │ │
│ │ [✅ 승인] [❌ 거절]                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 김철수 | student2@school.edu | 서울중학교 1학년 2반    │ │
│ │ 가입 신청: 2025-01-15 10:15                             │ │
│ │ [✅ 승인] [❌ 거절]                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Approval Workflow:**
```
1. Teacher navigates to /admin/registrations
2. System displays list of pending registrations
3. For each registration, teacher can:
   a. View student details (name, email, school, grade, class)
   b. Click "승인" to approve
   c. Click "거절" to reject (with optional reason)
4. On Approval:
   - User document status updated: 'pending' → 'approved'
   - isActive set to true
   - Approval email sent to student
5. On Rejection:
   - User document status updated: 'pending' → 'rejected'
   - Rejection email sent to student with reason
   - Account remains disabled
```

**Email Notification System:**

| Event | Recipient | Subject | Content |
|-------|-----------|---------|---------|
| Approval | Student | [AI 문화유산] 가입이 승인되었습니다 | 가입 승인 안내, 로그인 링크 |
| Rejection | Student | [AI 문화유산] 가입 신청 결과 안내 | 거절 사유, 재신청 안내 |

**Email Service Integration:**
```typescript
// Firebase Cloud Functions + Nodemailer or SendGrid
interface ApprovalEmailData {
  to: string;           // Student email
  studentName: string;  // Display name
  approvedBy: string;   // Teacher name
  loginUrl: string;     // Application login URL
}

// Triggered when user status changes to 'approved'
exports.sendApprovalEmail = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.registrationStatus === 'pending' &&
        after.registrationStatus === 'approved') {
      await sendApprovalEmail(after.email, after.displayName);
    }
  });
```

**Acceptance Criteria (Gherkin Format):**
```gherkin
Feature: Registration Approval
  Scenario: Teacher approves student registration
    Given a student has submitted a registration request
    And the teacher is on the registration approval page
    When the teacher clicks "승인" for the student
    Then the student's status is updated to "approved"
    And the student's isActive is set to true
    And an approval email is sent to the student
    And the student can now login to the application

  Scenario: Student receives approval email
    Given a teacher has approved a student's registration
    Then the student receives an email with subject "[AI 문화유산] 가입이 승인되었습니다"
    And the email contains a link to login
    And the email includes the teacher's name who approved

  Scenario: Teacher rejects student registration
    Given a student has submitted a registration request
    And the teacher is on the registration approval page
    When the teacher clicks "거절" and enters reason "학교 확인 불가"
    Then the student's status is updated to "rejected"
    And a rejection email is sent to the student with the reason
    And the student cannot login to the application
```

---

## 6. User Characteristics (사용자 특성)

### 6.1 Student Users

| Attribute | Description |
|-----------|-------------|
| **Age Range** | 13-15 years (Middle School Grades 1-3) |
| **Technical Skills** | Basic smartphone/computer operation; no programming knowledge required |
| **Domain Knowledge** | Currently studying or have studied Korean history (Goryeo through Japanese Occupation) |
| **Usage Frequency** | 1-2 times per week during class or homework |
| **Primary Device** | Smartphone (mobile-first design required) |
| **Accessibility Needs** | Font size adjustment, high contrast mode for visual impairments |

### 6.2 Teacher Users

| Attribute | Description |
|-----------|-------------|
| **Role** | Middle school Korean history teacher |
| **Technical Skills** | Basic computer operation, web browsing; no programming knowledge required |
| **Responsibilities** | Account management, content review, feedback provision, keyword management |
| **Usage Frequency** | 2-3 times per week for lesson preparation and student activity review |
| **Primary Device** | Desktop computer or laptop |
| **Access Scope** | Full access to both student and admin interfaces |

### 6.3 Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Font Size Adjustment | User-controlled text scaling |
| High Contrast Mode | Dark/light theme with sufficient contrast ratios |
| Touch Target Size | Minimum 44x44px for interactive elements |
| Keyboard Navigation | Full keyboard accessibility for all functions |
| Screen Reader Support | Semantic HTML and ARIA labels |

---

## 7. Limitations (제약조건)

### 7.1 Network Requirements

| Constraint | Description |
|------------|-------------|
| **Internet Dependency** | Application requires active internet connection for all features |
| **Offline Mode** | Not supported in current version |
| **Minimum Bandwidth** | Recommended 1 Mbps for image generation |

### 7.2 Rate Limits

| Resource | Limit | Period |
|----------|-------|--------|
| Image Generation | 60 requests | Per minute |
| Daily Image Generation | 1,500 requests | Per day |
| File Upload Size | 5 MB | Per file |

### 7.3 Storage Limits

| Resource | Free Tier Limit |
|----------|-----------------|
| Firebase Storage | 5 GB (approximately 1,000 images) |
| Firestore Documents | 20,000 writes/day |
| Firestore Reads | 50,000 reads/day |

### 7.4 Concurrent Users

| Scenario | Limit |
|----------|-------|
| Designed Capacity | 30 concurrent users (1 classroom) |
| Performance Degradation | May occur with multiple classes simultaneously |

### 7.5 Browser Support

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome | 90+ | Supported |
| Edge | 90+ | Supported |
| Safari | 14+ | Supported |
| Firefox | 88+ | Supported |
| Internet Explorer | Any | NOT Supported |

### 7.6 AI Accuracy Limitations

| Limitation | Description |
|------------|-------------|
| **Historical Accuracy** | AI-generated images may contain errors despite negative prompts |
| **Cultural Bias** | Western-centric training data may cause subtle inaccuracies |
| **Mitigation** | Three-layer safety mechanism; teacher review required |

### 7.7 Language Support

| Language | Status |
|----------|--------|
| Korean | Primary (UI, prompts, content) |
| English | Secondary (prompts, technical terms) |
| Other languages | Not supported |

---

## 8. Assumptions and Dependencies (가정 및 의존성)

### 8.1 User Assumptions

| ID | Assumption |
|----|------------|
| A-01 | All students have access to a Google account or school-provided email |
| A-02 | Students can perform basic operations: text input, button clicks, image upload |
| A-03 | Teachers can navigate web applications and manage student accounts |
| A-04 | Internet connectivity is available at school and home |

### 8.2 Technical Dependencies

| Dependency | Provider | Purpose | Risk Mitigation |
|------------|----------|---------|-----------------|
| Firebase Authentication | Google | User authentication | N/A (core dependency) |
| Cloud Firestore | Google | Data storage | Offline caching |
| Firebase Storage | Google | Image storage | Compression, cleanup policies |
| Firebase AI Logic | Google | AI model access | Error handling, retry logic |
| Gemini API | Google | Image generation | Model version pinning |
| Google Custom Search API | Google | Heritage verification | Fallback to Gemini grounding |

### 8.3 Service Availability

| Service | Expected Availability | Impact if Unavailable |
|---------|----------------------|----------------------|
| Firebase Authentication | 99.95% | Login impossible |
| Cloud Firestore | 99.95% | Data read/write fails |
| Firebase Storage | 99.95% | Image upload/view fails |
| Gemini API | 99.9% | Image generation fails |
| Google Search API | 99.9% | Verification fails |

### 8.4 Regulatory Assumptions

| Assumption | Details |
|------------|---------|
| GDPR/Privacy Compliance | Application handles student data; school-level consent assumed |
| Content Moderation | Generated content reviewed by teachers before public use |
| Historical Accuracy | Educational use case; accuracy is important but not guaranteed |

---

## 9. Specified Requirements (상세 요구사항)

### 9.1 External Interface Requirements

#### 9.1.1 Firebase Authentication API

**Purpose:** User authentication and session management

**Supported Methods:**
```typescript
// Google OAuth
signInWithPopup(auth, googleProvider);
signInWithRedirect(auth, googleProvider);

// Email/Password
createUserWithEmailAndPassword(auth, email, password);
signInWithEmailAndPassword(auth, email, password);

// Session
onAuthStateChanged(auth, callback);
signOut(auth);
```

**User Session Data:**
```typescript
interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}
```

#### 9.1.2 Gemini API (via Firebase AI Logic)

**Purpose:** AI image generation and analysis

**Model Configuration:**
```typescript
const model = getGenerativeModel(ai, {
  model: 'gemini-3-pro-image-preview',
  generationConfig: {
    responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
  },
});
```

**Image Generation Prompt Template:**
```
Generate a historically accurate image of Korean cultural heritage.

Era: {eraName}
Scene: {userPrompt}

Style requirements:
- {eraPrefix}
- Traditional Korean art style with museum-quality details
- Historically accurate clothing, architecture, and artifacts
- Authentic Korean aesthetic, avoiding any Chinese or Japanese elements

IMPORTANT - DO NOT include any of these elements:
{negativePrompt}

Create a detailed, photorealistic or traditional painting style image that accurately represents Korean historical culture.
```

**Response Handling:**
```typescript
const result = await chat.sendMessage(imagePrompt);
const inlineDataParts = result.response.inlineDataParts?.();
const imageBase64 = inlineDataParts[0]?.inlineData.data;
```

#### 9.1.3 Google Custom Search API

**Purpose:** Heritage verification with museum sources

**Configuration:**
```typescript
interface SearchConfig {
  apiKey: string;
  searchEngineId: string;
  restrictedSites: [
    'museum.go.kr',
    'gogung.go.kr',
    'heritage.go.kr'
  ];
}
```

**Search Result Interface:**
```typescript
interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  thumbnailUrl?: string;
  source: string;
}
```

### 9.2 Performance Requirements

| Metric | Requirement | Measurement |
|--------|-------------|-------------|
| **Image Generation Time** | ≤ 15 seconds | From button click to image display |
| **Page Load Time** | ≤ 3 seconds | Initial page render |
| **API Response Time** | ≤ 2 seconds | Firestore read/write operations |
| **Image Upload Time** | ≤ 5 seconds | For 5MB images |
| **Concurrent Users** | 30 users | Without performance degradation |
| **Availability** | 99% uptime | Monthly availability |

### 9.3 Database Schema (Firestore Collections)

#### 9.3.1 `users` Collection

```typescript
interface User {
  uid: string;              // Document ID (Firebase Auth UID)
  email: string;            // User email address
  displayName: string;      // Display name
  photoURL?: string;        // Profile photo URL
  role: 'student' | 'admin'; // User role
  createdAt: Timestamp;     // Account creation time
  lastLoginAt: Timestamp;   // Last login time
  isActive: boolean;        // Account active status
  school?: string;          // School name
  grade?: number;           // Grade (1-3)
  class?: string;           // Class name
}
```

**Indexes:**
- `role` (for filtering by role)
- `school, grade, class` (for class-based queries)

#### 9.3.2 `generations` Collection

```typescript
interface Generation {
  id: string;               // Document ID (auto-generated)
  userId: string;           // Creator's user ID
  userDisplayName?: string; // Creator's name (denormalized)
  era: Era;                 // Historical era
  prompt: string;           // User's original prompt
  negativePrompt: string;   // Applied negative prompts
  imageUrl: string;         // Firebase Storage URL
  thumbnailUrl?: string;    // Thumbnail URL
  status: GenerationStatus; // 'pending' | 'approved' | 'rejected' | 'revision-requested'
  createdAt: Timestamp;     // Creation time
  metadata: {
    generationTime: number; // Generation duration (ms)
    model: string;          // Model used
  };
}
```

**Indexes:**
- `userId, createdAt DESC` (user gallery)
- `status, createdAt DESC` (admin review queue)
- `era, createdAt DESC` (era-based filtering)

#### 9.3.3 `feedback` Collection

```typescript
interface Feedback {
  id: string;               // Document ID
  generationId: string;     // Related generation
  adminId: string;          // Teacher who wrote feedback
  adminDisplayName?: string;
  studentId: string;        // Target student
  textFeedback: string;     // Text content
  annotations: Annotation[]; // Image annotations
  referenceUrls: string[];  // Reference links
  createdAt: Timestamp;
  isRead: boolean;          // Read status
}
```

**Indexes:**
- `studentId, createdAt DESC` (student feedback list)
- `generationId` (feedback for specific generation)
- `studentId, isRead` (unread count)

#### 9.3.4 `error-reports` Collection

```typescript
interface ErrorReport {
  id: string;
  generationId: string;     // Related generation
  userId: string;           // Reporter
  userDisplayName?: string;
  errorType: ErrorType;     // 'costume' | 'architecture' | 'artifact' | 'anachronism' | 'other'
  description: string;      // Error description
  createdAt: Timestamp;
  status: ReportStatus;     // 'pending' | 'reviewed' | 'resolved'
  imageUrl?: string;        // Optional screenshot
}
```

**Indexes:**
- `status, createdAt DESC` (pending reports first)

#### 9.3.5 `negative-prompts` Collection

```typescript
interface NegativePrompt {
  id: string;               // Document ID
  era: Era | 'global';      // Era or global
  keywords: string[];       // Blocked keywords
  description: string;      // Description of this set
  updatedAt: Timestamp;
  updatedBy: string;        // Last editor
}
```

#### 9.3.6 `search-history` Collection

```typescript
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
```

**Indexes:**
- `userId, createdAt DESC` (user search history)

#### 9.3.7 `settings` Collection

```typescript
interface ApiKeyConfig {
  id: 'app-config';         // Single document
  geminiApiKey: string;     // Gemini API key (if needed)
  searchApiKey?: string;    // Google Search API key
  searchEngineId?: string;  // Custom Search Engine ID
  usageCount: number;       // Total API usage
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

### 9.4 Security Requirements

#### 9.4.1 Authentication

| Requirement | Implementation |
|-------------|----------------|
| **Google OAuth** | Firebase Authentication with Google provider |
| **Email/Password** | Firebase Authentication for student accounts |
| **Session Management** | Firebase Auth tokens with automatic refresh |
| **Role Assignment** | Default role: `student`; admin promotes to `admin` |

#### 9.4.2 Authorization (Firestore Security Rules)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        FIRESTORE SECURITY RULES MATRIX                         │
├────────────────┬──────────┬────────────┬──────────────┬────────────────────────┤
│ Collection     │ Read     │ Create     │ Update       │ Delete                 │
├────────────────┼──────────┼────────────┼──────────────┼────────────────────────┤
│ users          │ Auth     │ Owner only │ Owner/Admin  │ Owner/Admin            │
│ generations    │ Owner/   │ Active     │ Owner (lim)  │ Admin only             │
│                │ Admin    │ users      │ Admin (stat) │                        │
│ feedback       │ Student/ │ Admin only │ Student(read)│ Admin only             │
│                │ Admin    │            │ Admin (all)  │                        │
│ error-reports  │ Admin    │ Auth users │ Admin only   │ Admin only             │
│ negative-      │ Auth     │ Admin only │ Admin only   │ Admin only             │
│ prompts        │          │            │              │                        │
│ search-history │ Owner/   │ Owner only │ Owner only   │ Owner/Admin            │
│                │ Admin    │            │              │                        │
│ settings       │ DENY     │ Admin only │ Admin only   │ DENY                   │
└────────────────┴──────────┴────────────┴──────────────┴────────────────────────┘
```

#### 9.4.3 Data Protection

| Measure | Implementation |
|---------|----------------|
| **HTTPS Only** | Enforced by Firebase Hosting |
| **Data Encryption at Rest** | Firebase default encryption |
| **Personal Data Handling** | Minimal collection; no student PII in AI prompts |
| **API Key Protection** | Firebase AI Logic (no client-side API keys) |

### 9.5 Usability Requirements

| Requirement | Specification |
|-------------|---------------|
| **Responsive Design** | Mobile-first; supports 320px to 1920px width |
| **Touch Targets** | Minimum 44x44px |
| **Color Contrast** | WCAG 2.1 AA compliance |
| **Loading States** | Skeleton loaders for all async content |
| **Error Messages** | User-friendly Korean messages |
| **Dark Mode** | System preference detection + manual toggle |

### 9.6 Reliability Requirements

| Requirement | Target |
|-------------|--------|
| **Availability** | 99% monthly uptime |
| **Mean Time to Recovery** | < 1 hour for critical issues |
| **Data Backup** | Automatic Firebase backups |
| **Error Logging** | Console errors captured for debugging |

---

## 10. Verification (검증)

### 10.1 Student Feature Verification Checklist

| ID | Feature | Test Procedure | Expected Result |
|----|---------|----------------|-----------------|
| SF-01 | Era Selection | Click each era option | Era badge updates; negative prompts loaded |
| SF-02 | Scene Description | Input "조선시대 양반의 하루" | Text accepted; no validation error |
| SF-03 | Prompt Tips | Click "팁 보기" button | Modal with guidelines appears |
| SF-04 | Image Generation | Submit valid prompt | Image generated within 15 seconds |
| SF-05 | Gallery View | Navigate to gallery | All user generations displayed with metadata |
| SF-06 | Verification | Click "고증 검증하기" | Search results from museum sources appear |
| SF-07 | Error Report | Submit error report | Report saved; confirmation displayed |
| SF-08 | Feedback View | Open feedback tab | All feedback with annotations visible |

### 10.2 Teacher Feature Verification Checklist

| ID | Feature | Test Procedure | Expected Result |
|----|---------|----------------|-----------------|
| TF-01 | Keyword Management | Add/edit/delete keyword | Changes saved; reflected in generations |
| TF-02 | Error Reports | View pending reports | All reports listed with status filter |
| TF-03 | Work Review | Approve/reject generation | Status updated; student notified |
| TF-04 | Statistics | Open stats dashboard | Charts with accurate data displayed |
| TF-05 | Feedback Writing | Write feedback with annotation | Saved; visible to student |
| TF-06 | Data Export | Export CSV | File downloaded with correct data |
| TF-07 | User Management | Create/deactivate student | Account state changed correctly |

### 10.3 Quality Verification Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Generation Speed** | < 15 seconds | Timer from button click to display |
| **Availability** | > 99% monthly | Firebase monitoring |
| **Security** | No unauthorized access | Manual RBAC testing |
| **Responsiveness** | All devices | Browser testing (Chrome DevTools) |
| **Error Handling** | Friendly messages | Force error conditions |
| **Concurrent Users** | 30 without degradation | Load testing |

### 10.4 User Acceptance Testing

**Required Before Production:**

1. **Pilot Test Participants:**
   - 5 middle school students
   - 2 Korean history teachers

2. **Test Scenarios:**
   - Complete image generation workflow
   - Verification process
   - Feedback cycle
   - Admin management tasks

3. **Feedback Collection:**
   - Usability survey
   - Feature completeness check
   - Performance satisfaction

### 10.5 Test Accounts

**Pre-configured Test Accounts for Verification:**

| Account Type | Email | Password | Role | Notes |
|--------------|-------|----------|------|-------|
| Teacher | teacher@example.com | teacher123456 | admin | Full access |
| Student | student@example.com | student123456 | student | Limited access |

---

## Appendix A: File Structure

```
korean-history-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── prompts/page.tsx
│   │   │   ├── review/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── stats/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── student/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── generate/page.tsx
│   │   │   ├── gallery/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   ├── feedback/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── QueryProvider.tsx
│   │   │   └── ThemeProvider.tsx
│   │   ├── shared/
│   │   │   ├── Header.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── StudentSidebar.tsx
│   │   │   └── ProfileCompletionModal.tsx
│   │   └── ui/
│   │       └── [Radix UI components]
│   ├── constants/
│   │   ├── eras.ts
│   │   └── negativePrompts.ts
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   ├── firestore.ts
│   │   │   └── storage.ts
│   │   ├── gemini/
│   │   │   ├── client.ts
│   │   │   └── image-analysis.ts
│   │   ├── search/
│   │   │   └── client.ts
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── public/
├── scripts/
│   ├── create-test-accounts.js
│   ├── init-negative-prompts.ts
│   └── init-settings.ts
├── docs/
│   └── SRS.md (this file)
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts (or CSS)
└── .env.local (template)
```

---

## Appendix B: Environment Variables

```env
# Firebase Configuration (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: Google Search API (for heritage verification)
NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY=your_search_api_key
NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

---

## Appendix C: Deployment URL

**Production URL:** https://korean-history-edu-app.web.app

---

## Appendix D: References

1. ISO/IEC/IEEE 29148:2018 - Systems and software engineering - Life cycle processes - Requirements engineering
2. Karpathy, A. (2025). Vibe Coding. X Post.
3. Ban, Y. et al. (2024). Understanding the impact of negative prompts: When and how do they take effect? ECCV 2024.
4. Lee, H. et al. (2025). Lost in Translation: Cultural Bias in Vision-Language Models via Hanbok VQA. ICCVW 2025.
5. Wiegers, K. E., & Beatty, J. (2013). Software Requirements (3rd ed.). Microsoft Press.

---

**Document End**

*This SRS document is designed to be complete and self-contained. A coding agent should be able to fully implement the described application using only this specification.*
