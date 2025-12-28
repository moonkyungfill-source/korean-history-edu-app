'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { SearchResult } from '@/types';
import { getSettings, incrementApiUsage } from '@/lib/firebase/firestore';

interface SearchResponse {
  success: boolean;
  results?: SearchResult[];
  answer?: string;
  error?: string;
}

/**
 * Gemini API 키 동적으로 가져오기 (Firestore 우선, 환경변수 폴백)
 */
async function getApiKey(): Promise<string> {
  try {
    // Firestore에서 설정 조회
    const settings = await getSettings();
    if (settings?.geminiApiKey) {
      return settings.geminiApiKey;
    }
  } catch (error) {
    console.warn('Firestore 설정 조회 실패, 환경변수로 폴백:', error);
  }

  // 환경변수로 폴백
  const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  if (envKey) {
    return envKey;
  }

  throw new Error('Gemini API 키를 찾을 수 없습니다.');
}

export async function searchHeritage(query: string, userId?: string): Promise<SearchResponse> {
  if (!query) {
    return {
      success: false,
      error: '검색어를 입력해주세요.',
    };
  }

  let GEMINI_API_KEY: string;
  try {
    GEMINI_API_KEY = await getApiKey();
  } catch (error) {
    console.log('Gemini API key not configured, returning mock data');
    const mockResults: SearchResult[] = [
      {
        title: `${query} - 국립중앙박물관`,
        link: 'https://www.museum.go.kr',
        snippet: `${query}에 대한 국립중앙박물관 소장품 정보입니다. 한국의 역사와 문화를 대표하는 유물들을 만나보세요.`,
        thumbnailUrl: 'https://via.placeholder.com/300x200?text=Museum',
        source: '국립중앙박물관',
      },
      {
        title: `${query} 문화유산 - 문화재청`,
        link: 'https://www.cha.go.kr',
        snippet: `대한민국 문화재청에서 제공하는 ${query} 관련 문화유산 정보입니다.`,
        thumbnailUrl: 'https://via.placeholder.com/300x200?text=Heritage',
        source: '문화재청',
      },
      {
        title: `${query} - 한국민족문화대백과사전`,
        link: 'https://encykorea.aks.ac.kr',
        snippet: `${query}에 대한 학술적 정보와 역사적 배경을 한국민족문화대백과사전에서 확인하세요.`,
        thumbnailUrl: 'https://via.placeholder.com/300x200?text=Encyclopedia',
        source: '한국학중앙연구원',
      },
    ];

    return { success: true, results: mockResults };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Google Search grounding을 사용하는 모델 설정
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      tools: [
        {
          googleSearch: {},
        } as unknown as { googleSearch: Record<string, never> },
      ],
    } as Parameters<typeof genAI.getGenerativeModel>[0]);

    // 한국 문화유산 검색 프롬프트
    const searchPrompt = `
한국 문화유산에 대해 검색해주세요: "${query}"

다음 정보를 포함해서 답변해주세요:
1. 해당 문화유산의 역사적 배경
2. 주요 특징과 문화적 가치
3. 현재 소장 위치 또는 관련 박물관/기관
4. 관련된 시대 정보

신뢰할 수 있는 출처(국립중앙박물관, 문화재청, 한국학중앙연구원 등)의 정보를 우선적으로 참고해주세요.
`;

    const result = await model.generateContent(searchPrompt);
    const response = result.response;
    const text = response.text();

    // grounding metadata에서 검색 결과 추출
    const groundingMetadata = (response.candidates?.[0] as {
      groundingMetadata?: {
        groundingChunks?: Array<{
          web?: {
            uri?: string;
            title?: string;
          };
        }>;
        webSearchQueries?: string[];
      };
    })?.groundingMetadata;

    const results: SearchResult[] = [];

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web) {
          const uri = chunk.web.uri || '';
          const title = chunk.web.title || '';

          // 중복 제거
          if (!results.some(r => r.link === uri)) {
            let source = 'Unknown';
            try {
              source = new URL(uri).hostname.replace('www.', '');
            } catch {
              // URL 파싱 실패 시 기본값 사용
            }

            results.push({
              title: title || query,
              link: uri,
              snippet: `${query}에 대한 정보입니다.`,
              source,
            });
          }
        }
      }
    }

    // 검색 결과가 없으면 텍스트 응답에서 정보 추출
    if (results.length === 0) {
      results.push({
        title: `${query} - AI 검색 결과`,
        link: '#',
        snippet: text.substring(0, 200) + '...',
        source: 'Gemini AI',
      });
    }

    // 사용량 추적 (비동기 - 실패해도 무시)
    if (userId) {
      incrementApiUsage(userId, 'searchQueries').catch((error) => {
        console.warn('사용량 추적 실패:', error);
      });
    }

    return {
      success: true,
      results,
      answer: text,
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '검색에 실패했습니다.',
    };
  }
}
