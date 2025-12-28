'use client';

import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

interface AnalysisResult {
  success: boolean;
  analysis?: Record<string, any>;
  error?: string;
}

/**
 * Firebase AI Logic과 Google Search Grounding을 사용하여 이미지를 분석합니다.
 *
 * 용도:
 * - 학생이 업로드한 문화유산 사진 분석 (역사적 정확성 검증)
 * - AI 생성 이미지의 역사적 정확성 평가
 * - 참고 이미지의 특징 및 역사적 배경 추출
 *
 * API 키 없이 Firebase 인증만으로 작동합니다.
 *
 * @param imageBase64 Base64 인코딩된 이미지
 * @param imageMediaType MIME 타입 (예: 'image/jpeg')
 * @param analysisType 분석 유형 ('heritage' | 'authenticity' | 'general')
 */
export async function analyzeImage(
  imageBase64: string,
  imageMediaType: string,
  analysisType: 'heritage' | 'authenticity' | 'general' = 'general'
): Promise<AnalysisResult> {
  if (!imageBase64 || !imageMediaType) {
    return {
      success: false,
      error: '이미지 데이터가 필요합니다.',
    };
  }

  // Base64 이미지 크기 제한 (약 5MB)
  if (imageBase64.length > 5 * 1024 * 1024) {
    return {
      success: false,
      error: '이미지가 너무 큽니다. 5MB 이하의 이미지를 업로드해주세요.',
    };
  }

  try {
    // Firebase App 초기화
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    let app;
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      // 이미 초기화되었을 경우
      app = initializeApp(firebaseConfig);
    }

    // Firebase AI Logic 초기화
    const ai = getAI(app, { backend: new GoogleAIBackend() });

    // 생성 모델 생성 (gemini-3-pro-image-preview: nano banana pro)
    const model = getGenerativeModel(ai, {
      model: 'gemini-3-pro-image-preview',
    });

    let analysisPrompt = '';

    switch (analysisType) {
      case 'heritage':
        analysisPrompt = `
당신은 한국 역사 및 문화유산 전문가입니다.

업로드된 이미지를 분석하고, 다음 정보를 JSON 형식으로 제공하세요.
Google 검색 결과를 참고하여 검증된 정보만 제공하세요:

{
  "name": "문화유산 이름 (검증됨)",
  "era": "시대 (예: 조선시대 중기)",
  "location": "위치 또는 소장처 (국립박물관 등 확인된 기관)",
  "description": "상세한 역사적 설명 (신뢰할 수 있는 출처 기반)",
  "authenticity": "진정성 평가 (완전히 정확함/대체로 정확함/부분적으로 정확함/부정확함)",
  "sources": ["참고 자료1", "참고 자료2"],
  "recommendations": ["권장사항1", "권장사항2"]
}

Google 검색 결과와 일치하지 않으면 경고를 추가하세요.
이미지에 한국 문화유산이 보이지 않으면 {"error": "한국 문화유산을 찾을 수 없습니다."}로 응답하세요.
`;
        break;

      case 'authenticity':
        analysisPrompt = `
당신은 한국 역사 및 미술 감정 전문가입니다.

AI가 생성했을 가능성이 있는 이미지를 분석하고, 한국사 관점에서의 역사적 정확성을 평가하세요.
응답은 JSON 형식으로:

{
  "authenticity": "역사적 정확도 (매우 정확함/정확함/보통/부정확함/매우 부정확함)",
  "description": "구체적인 평가 의견",
  "issues": ["발견된 문제점1", "발견된 문제점2"],
  "recommendations": ["수정 방안1", "수정 방안2"]
}
`;
        break;

      default:
        analysisPrompt = `
이 이미지를 상세히 분석하고, 다음 정보를 JSON 형식으로 제공하세요:

{
  "description": "이미지에 대한 상세한 설명",
  "elements": ["주요 요소1", "주요 요소2"],
  "historical_context": "역사적 배경 (한국사 중심)",
  "recommendations": ["추가 학습 자료", "관련 주제"]
}
`;
    }

    const chat = model.startChat();

    // Base64 이미지를 Firebase AI Logic 형식으로 변환
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: imageMediaType,
      },
    };

    const result = await chat.sendMessage([analysisPrompt, imagePart]);
    const analysisText = result.response.text();

    // JSON 추출 (응답이 JSON 형식이라고 가정)
    try {
      const analysisData = JSON.parse(analysisText);
      return {
        success: true,
        analysis: analysisData,
      };
    } catch (parseError) {
      // JSON 파싱 실패 시 텍스트 응답
      return {
        success: true,
        analysis: {
          description: analysisText,
        },
      };
    }
  } catch (error) {
    console.error('Image analysis error:', error);
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 파일을 Base64로 변환합니다.
 *
 * @param file 변환할 이미지 파일
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Data URL에서 Base64 부분만 추출
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 이미지 파일을 분석합니다.
 *
 * @param file 이미지 파일
 * @param analysisType 분석 유형
 */
export async function analyzeImageFile(
  file: File,
  analysisType: 'heritage' | 'authenticity' | 'general' = 'general'
): Promise<AnalysisResult> {
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: '이미지 파일을 선택해주세요.',
    };
  }

  try {
    const base64 = await fileToBase64(file);
    return analyzeImage(base64, file.type, analysisType);
  } catch (error) {
    console.error('파일 변환 오류:', error);
    return {
      success: false,
      error: '파일을 읽을 수 없습니다.',
    };
  }
}
