import { Timestamp } from 'firebase/firestore';

// 시대 타입
export type Era = 'goryeo' | 'joseon-early' | 'joseon-mid' | 'joseon-late' | 'japanese-occupation';

// 사용자 역할
export type UserRole = 'student' | 'admin';

// 사용자 인터페이스
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  isActive: boolean;
  school?: string;        // 소속 학교
  grade?: number;         // 학년 (1-3)
  class?: string;         // 학급 (예: "1반", "2반")
}

// 생성물 상태
export type GenerationStatus = 'pending' | 'approved' | 'rejected' | 'revision-requested';

// 생성물 인터페이스
export interface Generation {
  id: string;
  userId: string;
  userDisplayName?: string;
  era: Era;
  prompt: string;
  negativePrompt: string;
  imageUrl: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  status: GenerationStatus;
  createdAt: Timestamp;
  metadata: {
    generationTime: number;
    model: string;
  };
}

// 주석 타입
export type AnnotationType = 'circle' | 'arrow' | 'text' | 'rectangle';

// 주석 인터페이스
export interface Annotation {
  id: string;
  type: AnnotationType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  text?: string;
  color: string;
}

// 피드백 인터페이스
export interface Feedback {
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

// 오류 보고 타입
export type ErrorType = 'costume' | 'architecture' | 'artifact' | 'anachronism' | 'other';

// 오류 보고 상태
export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

// 오류 보고 인터페이스
export interface ErrorReport {
  id: string;
  generationId: string;
  userId: string;
  userDisplayName?: string;
  errorType: ErrorType;
  description: string;
  createdAt: Timestamp;
  status: ReportStatus;
  imageUrl?: string;
}

// 네거티브 프롬프트 인터페이스
export interface NegativePrompt {
  id: string;
  era: Era | 'global';
  keywords: string[];
  description: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// API 키 설정 인터페이스
export interface ApiKeyConfig {
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

// 시대 정보 인터페이스
export interface EraInfo {
  id: Era;
  name: string;
  nameEn: string;
  period: string;
  description: string;
  keywords: string[];
  imagePromptPrefix: string;
}

// 이미지 생성 요청
export interface GenerateImageRequest {
  prompt: string;
  era: Era;
}

// 이미지 생성 응답
export interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// 이미지 생성 결과 (클라이언트 함수 반환)
export interface GenerateImageResult {
  success: boolean;
  imageBase64?: string;
  negativePrompt?: string;
  generationTime?: number;
  model?: string;
  era?: string;
  error?: string;
}

// 검색 결과
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  thumbnailUrl?: string;
  source: string;
}

// 검색 이력
export interface SearchHistory {
  id: string;
  userId: string;                    // 검색한 학생
  userDisplayName?: string;          // 학생 이름 (비정규화)
  uploadedImageUrl?: string;         // 업로드한 이미지 (선택)
  searchQuery: string;               // 검색어
  searchResults: SearchResult[];     // 검색 결과 (기존 타입 재사용)
  createdAt: Timestamp;              // 검색 날짜
  usedForGeneration?: boolean;       // 생성에 사용 여부
  generationId?: string;             // 연결된 생성물 ID
}
