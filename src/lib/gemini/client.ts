'use client';

import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend, ResponseModality } from 'firebase/ai';
import { ERAS } from '@/constants/eras';
import { buildFullPrompt } from '@/constants/negativePrompts';
import { Era, GenerateImageResult } from '@/types';

/**
 * Firebase AI Logic을 사용하여 역사적 장면을 이미지로 생성합니다.
 * Gemini 모델을 사용하며, API 키는 필요 없습니다.
 *
 * @param prompt 사용자가 입력한 프롬프트
 * @param era 역사 시대
 * @param userId 사용자 ID (선택사항, 로깅용)
 */
export async function generateImage(
  prompt: string,
  era: Era,
  userId?: string
): Promise<GenerateImageResult> {
  if (!prompt || !era) {
    return {
      success: false,
      error: '프롬프트와 시대를 모두 입력해주세요.',
    };
  }

  if (!Object.keys(ERAS).includes(era)) {
    return {
      success: false,
      error: '유효하지 않은 시대입니다.',
    };
  }

  try {
    const eraInfo = ERAS[era];
    const startTime = Date.now();

    // 프롬프트 구성 (네거티브 프롬프트 포함)
    const { negativePrompt } = buildFullPrompt(
      prompt,
      era,
      eraInfo.imagePromptPrefix
    );

    // Firebase App 초기화 (전역에서 이미 초기화되었을 수 있음)
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
      generationConfig: {
        responseModalities: [ResponseModality.TEXT, ResponseModality.IMAGE],
      },
    });

    const imagePrompt = `
Generate a historically accurate image of Korean cultural heritage.

Era: ${eraInfo.name}
Scene: ${prompt}

Style requirements:
- ${eraInfo.imagePromptPrefix}
- Traditional Korean art style with museum-quality details
- Historically accurate clothing, architecture, and artifacts
- Authentic Korean aesthetic, avoiding any Chinese or Japanese elements

IMPORTANT - DO NOT include any of these elements:
${negativePrompt}

Create a detailed, photorealistic or traditional painting style image that accurately represents Korean historical culture.
`;

    const chat = model.startChat();
    const result = await chat.sendMessage(imagePrompt);

    const generationTime = Date.now() - startTime;

    // 이미지 추출
    let imageBase64: string | null = null;
    try {
      const inlineDataParts = result.response.inlineDataParts?.();
      if (inlineDataParts?.[0]) {
        const imageData = inlineDataParts[0].inlineData;
        imageBase64 = imageData.data;
      }
    } catch (err) {
      console.error('Failed to extract image:', err);
    }

    if (!imageBase64) {
      return {
        success: false,
        error: '이미지 생성에 실패했습니다. 다른 설명으로 다시 시도해주세요.',
      };
    }

    return {
      success: true,
      imageBase64,
      negativePrompt,
      generationTime,
      model: 'gemini-3-pro-image-preview',
      era: eraInfo.name,
    };
  } catch (error) {
    console.error('Image generation error:', error);
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

    return {
      success: false,
      error: errorMessage,
    };
  }
}
