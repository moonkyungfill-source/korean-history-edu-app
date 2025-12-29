/**
 * Search Grounding Service
 *
 * Google Search Grounding API를 활용한 역사 정보 검색 서비스입니다.
 * Gemini API의 Google Search 도구를 사용하여 역사적 사실을 검색하고 검증합니다.
 *
 * @see https://ai.google.dev/gemini-api/docs/google-search?hl=ko
 */

import { GeminiClient, GeminiApiError } from '../gemini/client';
import { Era } from '../../types/prompt.types';
import {
  HistoricalContext,
  SearchGroundingResult,
  SearchResult,
  ResearchSource,
} from '../../types/research.types';
import { ERA_INFO } from '../../config/eras.config';

/**
 * 검증 결과 인터페이스
 */
export interface VerificationResult {
  /** 검증 대상 사실 */
  fact: string;

  /** 검증 결과 */
  isVerified: boolean;

  /** 신뢰도 점수 (0-1) */
  confidence: number;

  /** 검증 상세 설명 */
  explanation: string;

  /** 수정이 필요한 경우 올바른 정보 */
  correctedInfo?: string;

  /** 관련 출처 */
  sources: ResearchSource[];

  /** 검증 시각 */
  verifiedAt: Date;
}

/**
 * Grounding 메타데이터 인터페이스 (Gemini API 응답용)
 */
interface GroundingMetadata {
  searchEntryPoint?: {
    renderedContent?: string;
  };
  groundingChunks?: Array<{
    web?: {
      uri?: string;
      title?: string;
    };
  }>;
  groundingSupports?: Array<{
    segment?: {
      startIndex?: number;
      endIndex?: number;
      text?: string;
    };
    groundingChunkIndices?: number[];
    confidenceScores?: number[];
  }>;
  webSearchQueries?: string[];
}

/**
 * SearchGroundingService
 *
 * Google Search Grounding을 활용하여 역사적 사실을 검색하고 검증하는 서비스입니다.
 */
export class SearchGroundingService {
  private geminiClient: GeminiClient;

  /**
   * SearchGroundingService 생성자
   *
   * @param apiKey - Gemini API 키
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new GeminiApiError('API key is required for SearchGroundingService');
    }

    // Search Grounding에 최적화된 모델 사용 (gemini-2.0-flash)
    this.geminiClient = new GeminiClient(apiKey, 'gemini-2.0-flash', {
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 60000, // 검색 시간을 고려하여 타임아웃 증가
    });
  }

  /**
   * 역사적 사실 검색 (Search Grounding 활용)
   *
   * 특정 시대와 주제에 대한 역사적 사실을 Google Search를 통해 검색합니다.
   *
   * @param era - 검색할 역사 시대
   * @param topic - 검색 주제
   * @returns SearchGroundingResult - 검색 결과와 메타데이터
   */
  async searchHistoricalFacts(era: Era, topic: string): Promise<SearchGroundingResult> {
    const eraInfo = ERA_INFO[era];

    // 검색에 최적화된 프롬프트 구성
    const prompt = this.buildSearchPrompt(eraInfo.name, eraInfo.period, topic);

    try {
      // Google Search Grounding을 활용한 생성
      const response = await this.geminiClient.generateWithSearchGrounding(prompt);

      // grounding 메타데이터에서 검색 결과 추출
      const searchResults = this.extractSearchResults(response.groundingMetadata);
      const confidence = this.calculateGroundingConfidence(response.groundingMetadata);
      const relatedQueries = response.groundingMetadata?.webSearchQueries ?? [];

      return {
        query: `${eraInfo.name} (${eraInfo.period}) - ${topic}`,
        results: searchResults,
        synthesizedAnswer: response.text,
        groundingConfidence: confidence,
        relatedQueries,
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof GeminiApiError) {
        throw error;
      }
      throw new GeminiApiError(
        `Failed to search historical facts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 역사적 사실 검증
   *
   * 주어진 역사적 컨텍스트를 Google Search를 통해 검증합니다.
   *
   * @param era - 역사 시대
   * @param topic - 검증할 주제
   * @param context - 검증할 역사적 컨텍스트
   * @returns VerificationResult - 검증 결과
   */
  async verifyHistoricalFacts(
    era: Era,
    topic: string,
    context: HistoricalContext
  ): Promise<VerificationResult> {
    const eraInfo = ERA_INFO[era];

    // 검증용 프롬프트 구성
    const prompt = this.buildVerificationPrompt(eraInfo, topic, context);

    try {
      const response = await this.geminiClient.generateWithSearchGrounding(prompt);

      // 검증 결과 파싱
      const verificationData = this.parseVerificationResponse(response.text);
      const sources = this.extractSourcesFromMetadata(response.groundingMetadata);
      const confidence = this.calculateGroundingConfidence(response.groundingMetadata);

      return {
        fact: topic,
        isVerified: verificationData.isVerified,
        confidence,
        explanation: verificationData.explanation,
        correctedInfo: verificationData.correctedInfo,
        sources,
        verifiedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof GeminiApiError) {
        throw error;
      }
      throw new GeminiApiError(
        `Failed to verify historical facts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 추가 디테일 검색
   *
   * 특정 시대에 대한 추가 세부 정보를 키워드 기반으로 검색합니다.
   *
   * @param era - 역사 시대
   * @param keywords - 검색 키워드 배열
   * @returns string - 검색된 추가 정보
   */
  async getAdditionalDetails(era: Era, keywords: string[]): Promise<string> {
    const eraInfo = ERA_INFO[era];

    // 키워드 기반 상세 검색 프롬프트
    const prompt = this.buildDetailSearchPrompt(eraInfo, keywords);

    try {
      const response = await this.geminiClient.generateWithSearchGrounding(prompt);
      return response.text;
    } catch (error) {
      if (error instanceof GeminiApiError) {
        throw error;
      }
      throw new GeminiApiError(
        `Failed to get additional details: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 역사적 사실 검색을 위한 프롬프트 구성
   */
  private buildSearchPrompt(eraName: string, period: string, topic: string): string {
    return `한국 역사 ${eraName} (${period}) 시대의 "${topic}"에 대해 검색하고 다음 정보를 제공해주세요:

1. 역사적 배경과 맥락
2. 주요 사실과 특징
3. 관련된 인물이나 사건
4. 당시의 사회적, 문화적 맥락
5. 현대에 알려진 연구 결과나 발견

응답은 한국어로 작성하고, 역사적으로 정확한 정보만 포함해주세요.
가능한 한 학술적인 출처나 신뢰할 수 있는 역사 자료를 기반으로 답변해주세요.`;
  }

  /**
   * 역사적 사실 검증을 위한 프롬프트 구성
   */
  private buildVerificationPrompt(
    eraInfo: { name: string; period: string; description: string },
    topic: string,
    context: HistoricalContext
  ): string {
    // 컨텍스트에서 주요 정보 추출
    const clothingInfo = context.clothingDetails?.commonItems?.join(', ') ?? '';
    const architectureInfo = context.architectureDetails?.buildingTypes?.join(', ') ?? '';

    return `다음 ${eraInfo.name} (${eraInfo.period}) 시대에 대한 역사적 정보를 검증해주세요:

주제: ${topic}

검증할 정보:
- 복식 관련: ${clothingInfo}
- 건축 관련: ${architectureInfo}
- 시대 설명: ${eraInfo.description}

다음 형식으로 검증 결과를 제공해주세요:

검증 결과: [정확함/부분적으로 정확함/수정 필요]
신뢰도: [높음/중간/낮음]
설명: [검증에 대한 상세 설명]
수정 사항: [필요한 경우 올바른 정보 제공]

역사적 사실에 기반하여 정확하게 검증해주세요.`;
  }

  /**
   * 추가 디테일 검색을 위한 프롬프트 구성
   */
  private buildDetailSearchPrompt(
    eraInfo: { name: string; period: string },
    keywords: string[]
  ): string {
    const keywordList = keywords.join(', ');

    return `한국 역사 ${eraInfo.name} (${eraInfo.period}) 시대와 관련된 다음 키워드에 대해 상세한 정보를 검색해주세요:

키워드: ${keywordList}

각 키워드에 대해 다음을 포함한 상세 정보를 제공해주세요:
1. 정의 및 설명
2. 역사적 맥락에서의 의미
3. 관련 사례나 예시
4. 특이사항이나 흥미로운 점

이미지 생성이나 교육 콘텐츠 제작에 활용할 수 있도록 시각적 특징도 상세히 설명해주세요.
응답은 한국어로 작성해주세요.`;
  }

  /**
   * grounding 메타데이터에서 검색 결과 추출
   */
  private extractSearchResults(metadata?: GroundingMetadata): SearchResult[] {
    if (!metadata?.groundingChunks) {
      return [];
    }

    const results: SearchResult[] = [];
    const chunks = metadata.groundingChunks;
    const supports = metadata.groundingSupports ?? [];

    chunks.forEach((chunk, index) => {
      if (chunk.web?.uri) {
        // 해당 청크에 대한 지원 정보 찾기
        const support = supports.find((s) =>
          s.groundingChunkIndices?.includes(index)
        );

        const confidenceScores = support?.confidenceScores ?? [];
        const avgConfidence =
          confidenceScores.length > 0
            ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
            : 0.5;

        // URL에서 도메인 추출
        const domain = this.extractDomain(chunk.web.uri);

        results.push({
          title: chunk.web.title ?? 'Unknown Title',
          url: chunk.web.uri,
          snippet: support?.segment?.text ?? '',
          relevanceScore: avgConfidence,
          domain,
        });
      }
    });

    // 관련성 점수로 정렬
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * URL에서 도메인 추출
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * grounding 신뢰도 계산
   */
  private calculateGroundingConfidence(metadata?: GroundingMetadata): number {
    if (!metadata?.groundingSupports || metadata.groundingSupports.length === 0) {
      return 0;
    }

    const allScores: number[] = [];

    metadata.groundingSupports.forEach((support) => {
      if (support.confidenceScores) {
        allScores.push(...support.confidenceScores);
      }
    });

    if (allScores.length === 0) {
      return 0;
    }

    // 평균 신뢰도 계산
    const avgConfidence = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  /**
   * 메타데이터에서 출처 정보 추출
   */
  private extractSourcesFromMetadata(metadata?: GroundingMetadata): ResearchSource[] {
    if (!metadata?.groundingChunks) {
      return [];
    }

    return metadata.groundingChunks
      .filter((chunk) => chunk.web?.uri)
      .map((chunk) => ({
        title: chunk.web?.title ?? 'Unknown Source',
        url: chunk.web?.uri,
        type: this.determineSourceType(chunk.web?.uri ?? ''),
        credibilityScore: this.estimateCredibility(chunk.web?.uri ?? ''),
      }));
  }

  /**
   * URL을 기반으로 출처 유형 결정
   */
  private determineSourceType(
    url: string
  ): 'academic' | 'museum' | 'archive' | 'book' | 'article' | 'web' {
    const urlLower = url.toLowerCase();

    // 학술 도메인 확인
    if (
      urlLower.includes('.edu') ||
      urlLower.includes('.ac.kr') ||
      urlLower.includes('scholar') ||
      urlLower.includes('academic')
    ) {
      return 'academic';
    }

    // 박물관 도메인 확인
    if (urlLower.includes('museum') || urlLower.includes('gallery')) {
      return 'museum';
    }

    // 아카이브 도메인 확인
    if (
      urlLower.includes('archive') ||
      urlLower.includes('library') ||
      urlLower.includes('.go.kr')
    ) {
      return 'archive';
    }

    // 뉴스/기사 도메인 확인
    if (
      urlLower.includes('news') ||
      urlLower.includes('article') ||
      urlLower.includes('press')
    ) {
      return 'article';
    }

    return 'web';
  }

  /**
   * URL을 기반으로 신뢰도 추정
   */
  private estimateCredibility(url: string): number {
    const urlLower = url.toLowerCase();

    // 높은 신뢰도 도메인
    if (
      urlLower.includes('.edu') ||
      urlLower.includes('.ac.kr') ||
      urlLower.includes('.go.kr') ||
      urlLower.includes('museum') ||
      urlLower.includes('national')
    ) {
      return 0.9;
    }

    // 중간 신뢰도 도메인
    if (
      urlLower.includes('wikipedia') ||
      urlLower.includes('encyclopedia') ||
      urlLower.includes('history')
    ) {
      return 0.7;
    }

    // 뉴스/미디어
    if (urlLower.includes('news') || urlLower.includes('press')) {
      return 0.6;
    }

    // 기본 신뢰도
    return 0.5;
  }

  /**
   * 검증 응답 파싱
   */
  private parseVerificationResponse(response: string): {
    isVerified: boolean;
    explanation: string;
    correctedInfo?: string;
  } {
    const responseLower = response.toLowerCase();

    // 검증 결과 판단
    let isVerified = true;
    if (
      responseLower.includes('수정 필요') ||
      responseLower.includes('부정확') ||
      responseLower.includes('incorrect') ||
      responseLower.includes('오류')
    ) {
      isVerified = false;
    } else if (responseLower.includes('부분적으로')) {
      isVerified = true; // 부분적으로 정확한 경우도 검증됨으로 처리
    }

    // 수정 사항 추출
    let correctedInfo: string | undefined;
    const correctionMatch = response.match(/수정 사항[:\s]*(.+?)(?:\n|$)/i);
    if (correctionMatch && correctionMatch[1].trim() !== '없음') {
      correctedInfo = correctionMatch[1].trim();
    }

    return {
      isVerified,
      explanation: response,
      correctedInfo,
    };
  }
}

/**
 * SearchGroundingService 인스턴스를 환경 변수에서 생성
 */
export function createSearchGroundingService(): SearchGroundingService {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiApiError(
      'GEMINI_API_KEY environment variable is not set'
    );
  }

  return new SearchGroundingService(apiKey);
}
