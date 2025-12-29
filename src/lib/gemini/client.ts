'use client';

import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel, GoogleAIBackend, ResponseModality } from 'firebase/ai';
import { ERAS } from '@/constants/eras';
import { buildFullPrompt, GLOBAL_NEGATIVE_PROMPTS, ERA_NEGATIVE_PROMPTS } from '@/constants/negativePrompts';
import { Era, GenerateImageResult } from '@/types';

// 네거티브 프롬프트 제안 결과
export interface NegativePromptSuggestion {
  suggested: string[];           // Gemini가 추천하는 네거티브 프롬프트
  reason: string;                // 추천 이유 설명
  defaultPrompts: string[];      // 기본 적용되는 시스템 네거티브 프롬프트
}

/**
 * Gemini를 사용하여 시대와 프롬프트에 맞는 네거티브 프롬프트를 제안합니다.
 * 학생이 직접 고증 오류 방지 키워드를 설계할 수 있도록 도와줍니다.
 *
 * @param prompt 사용자가 입력한 프롬프트
 * @param era 역사 시대
 */
export async function suggestNegativePrompts(
  prompt: string,
  era: Era
): Promise<{ success: boolean; data?: NegativePromptSuggestion; error?: string }> {
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

    // 기본 네거티브 프롬프트
    const defaultPrompts = [
      ...GLOBAL_NEGATIVE_PROMPTS.slice(0, 10),  // 전역 프롬프트 상위 10개
      ...ERA_NEGATIVE_PROMPTS[era].slice(0, 5), // 시대별 프롬프트 상위 5개
    ];

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
      app = initializeApp(firebaseConfig, 'suggest-prompts');
    } catch {
      app = initializeApp(firebaseConfig, 'suggest-prompts');
    }

    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, {
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseModalities: [ResponseModality.TEXT],
      },
    });

    const analysisPrompt = `당신은 한국사 전문가입니다. 학생이 AI로 역사 이미지를 생성하려고 합니다.
학생이 입력한 프롬프트와 선택한 시대를 분석하여, 역사적 고증 오류를 방지하기 위한 '네거티브 프롬프트'를 제안해주세요.

네거티브 프롬프트란: 이미지 생성 AI가 피해야 할 요소들의 목록입니다.
예를 들어, 조선시대 이미지에 "현대 건물", "청바지", "스마트폰" 등이 나오면 안 됩니다.

[학생 입력]
- 시대: ${eraInfo.name} (${eraInfo.period})
- 장면 설명: ${prompt}

[시대 특징]
${eraInfo.description}
주요 키워드: ${eraInfo.keywords.join(', ')}

[기존에 적용되는 기본 네거티브 프롬프트]
${defaultPrompts.join(', ')}

[요청]
위 장면을 생성할 때 추가로 피해야 할 요소들을 5-8개 제안해주세요.
학생이 이해하기 쉽게 한국어로 설명하고, 영어 키워드도 함께 제공해주세요.

응답 형식 (JSON):
{
  "suggested": ["english keyword 1", "english keyword 2", ...],
  "suggestedKorean": ["한국어 설명 1", "한국어 설명 2", ...],
  "reason": "이 키워드들을 제안한 이유를 학생이 이해하기 쉽게 설명"
}`;

    const chat = model.startChat();
    const result = await chat.sendMessage(analysisPrompt);
    const responseText = result.response.text();

    // JSON 파싱
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'AI 응답을 파싱할 수 없습니다.',
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: {
        suggested: parsed.suggested || [],
        reason: parsed.reason || '',
        defaultPrompts,
      },
    };
  } catch (error) {
    console.error('Negative prompt suggestion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '네거티브 프롬프트 제안에 실패했습니다.',
    };
  }
}

/**
 * Firebase AI Logic을 사용하여 역사적 장면을 이미지로 생성합니다.
 * Gemini 모델을 사용하며, API 키는 필요 없습니다.
 *
 * @param prompt 사용자가 입력한 프롬프트
 * @param era 역사 시대
 * @param userId 사용자 ID (선택사항, 로깅용)
 * @param customNegativePrompts 학생이 추가한 커스텀 네거티브 프롬프트
 */
export async function generateImage(
  prompt: string,
  era: Era,
  userId?: string,
  customNegativePrompts: string[] = []
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
    let { negativePrompt } = buildFullPrompt(
      prompt,
      era,
      eraInfo.imagePromptPrefix
    );

    // 학생이 추가한 커스텀 네거티브 프롬프트 추가
    if (customNegativePrompts.length > 0) {
      negativePrompt = `${negativePrompt}, ${customNegativePrompts.join(', ')}`;
    }

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

Era: ${eraInfo.name} (${eraInfo.period})
Scene: ${prompt}

Visual Style Requirements:
- ${eraInfo.imagePromptPrefix}
- Authentic Korean traditional art style with museum-quality details
- Historically accurate Korean clothing (hanbok with jeogori and chima), architecture (dancheong, giwa tiles), and artifacts
- Distinctly Korean aesthetic identity and cultural elements

Create a detailed, photorealistic or traditional Korean painting style image.
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
