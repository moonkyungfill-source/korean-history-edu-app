/**
 * Deep Research Service
 *
 * Gemini Deep Research API를 활용한 역사적 사실 조사 서비스
 * @see https://ai.google.dev/gemini-api/docs/interactions?hl=ko
 */

import { GoogleGenAI } from '@google/genai';
import { Era } from '../../types';
import { ERA_INFO } from '../../config/eras.config';
import {
  HistoricalContext,
  ClothingDetails,
  ArchitectureDetails,
  DailyLifeDetails,
  ResearchSource,
} from '../../types/research.types';

/**
 * 연구 상태 타입
 */
export type ResearchStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * 연구 폴링 결과
 */
export interface ResearchPollResult {
  status: ResearchStatus;
  progress?: number;
  result?: HistoricalContext;
  error?: string;
}

/**
 * Deep Research Service
 *
 * Gemini Deep Research API를 사용하여 역사적 사실을 조사하고
 * 시대적 고증에 필요한 상세 정보를 수집합니다.
 */
export class DeepResearchService {
  private client: GoogleGenAI;
  private agent = 'gemini-2.0-flash-deep-research-001';

  /**
   * DeepResearchService 생성자
   * @param apiKey Google AI API 키
   */
  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * 역사적 사실 조사 시작 (비동기)
   *
   * Deep Research API를 통해 특정 시대와 주제에 대한
   * 심층 조사를 시작합니다.
   *
   * @param era 조사할 시대
   * @param topic 조사할 주제
   * @returns 조사 상호작용 ID (폴링에 사용)
   */
  async startResearch(era: Era, topic: string): Promise<string> {
    const prompt = this.buildResearchPrompt(era, topic);

    const response = await this.client.aio.chats.create({
      model: this.agent,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // 연구 시작을 위한 메시지 전송
    const chat = this.client.chats.create({
      model: this.agent,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const result = await chat.sendMessage({ message: prompt });

    // 상호작용 ID 반환 (실제 API에서는 response에서 추출)
    // Deep Research API는 비동기 작업이므로 상호작용 ID를 통해 결과를 폴링
    const interactionId = this.generateInteractionId(era, topic);

    // 내부 상태 저장 (실제 구현에서는 외부 저장소 사용 권장)
    this.storeResearchState(interactionId, {
      era,
      topic,
      prompt,
      startedAt: new Date(),
      status: 'in_progress',
      rawResponse: result,
    });

    return interactionId;
  }

  /**
   * 연구 결과 폴링
   *
   * 주어진 상호작용 ID에 대한 연구 결과를 주기적으로 확인합니다.
   * 기본 10초 간격으로 폴링하며, 최대 대기 시간까지 반복합니다.
   *
   * @param interactionId 연구 상호작용 ID
   * @param maxWaitTime 최대 대기 시간 (밀리초, 기본: 5분)
   * @returns 역사적 컨텍스트 결과
   */
  async pollResults(
    interactionId: string,
    maxWaitTime: number = 300000
  ): Promise<HistoricalContext> {
    const pollInterval = 10000; // 10초
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const state = this.getResearchState(interactionId);

      if (!state) {
        throw new Error(`연구 상태를 찾을 수 없습니다: ${interactionId}`);
      }

      if (state.status === 'completed' && state.result) {
        return state.result;
      }

      if (state.status === 'failed') {
        throw new Error(`연구 실패: ${state.error || '알 수 없는 오류'}`);
      }

      // 실제 API 응답 확인
      try {
        const pollResult = await this.checkResearchProgress(interactionId);

        if (pollResult.status === 'completed' && pollResult.result) {
          this.updateResearchState(interactionId, {
            status: 'completed',
            result: pollResult.result,
            completedAt: new Date(),
          });
          return pollResult.result;
        }

        if (pollResult.status === 'failed') {
          this.updateResearchState(interactionId, {
            status: 'failed',
            error: pollResult.error,
          });
          throw new Error(`연구 실패: ${pollResult.error}`);
        }
      } catch (error) {
        // 폴링 중 오류는 무시하고 계속 시도
        console.warn(`폴링 중 오류 (재시도 예정): ${error}`);
      }

      // 대기
      await this.sleep(pollInterval);
    }

    throw new Error(`연구 시간 초과: ${maxWaitTime}ms 내에 완료되지 않음`);
  }

  /**
   * 조사 프롬프트 빌드
   *
   * 시대와 주제에 맞는 상세한 연구 프롬프트를 생성합니다.
   *
   * @param era 조사할 시대
   * @param topic 조사할 주제
   * @returns 연구용 프롬프트 문자열
   */
  private buildResearchPrompt(era: Era, topic: string): string {
    const eraInfo = ERA_INFO[era];

    return `당신은 한국사 전문 연구원입니다. ${eraInfo.name} (${eraInfo.period})의 "${topic}"에 대해 심층 조사를 수행해 주세요.

다음 항목들에 대해 상세하고 정확한 정보를 수집해 주세요:

## 1. 해당 시대의 정확한 복식 특징
- 신분별 의복의 종류와 명칭 (왕족, 양반, 중인, 상민, 천민)
- 사용된 직물과 염료의 종류
- 색상의 의미와 사용 규제 (오방색, 금색 등)
- 계절별 의복 변화
- 장신구와 모자류 (갓, 족두리, 비녀 등)
- 남녀 복식의 차이점

## 2. 건축 양식과 주거 환경
- 대표적인 건축물 유형 (궁궐, 사찰, 관아, 민가)
- 지붕 양식 (기와, 초가, 너와 등)
- 건축 재료 (목재, 석재, 흙, 기와)
- 담장과 대문의 특징
- 온돌과 마루 구조
- 정원과 조경 요소
- 신분별 주거 규모 제한

## 3. 일상 생활 문화와 풍속
- 식생활 (주식, 반찬, 식기류)
- 세시풍속과 명절 행사
- 통과의례 (관례, 혼례, 상례, 제례)
- 여가활동과 놀이문화
- 시장과 상업 활동
- 교통수단 (가마, 말, 수레)
- 교육과 학문 활동

## 4. 신분별 차이점
- 각 신분의 사회적 역할과 권리
- 복식, 주거, 생활양식의 신분별 차등
- 신분 간 이동 가능성과 제한
- 직업과 경제활동의 신분별 특성

## 5. 시대착오적 요소 (반드시 피해야 할 것들)
- 해당 시대에 존재하지 않았던 물건들
- 잘못 사용되는 용어나 개념
- 다른 시대나 다른 나라의 요소들
- 현대적 감각이 투영된 오류들
- 영화나 드라마에서 자주 보이는 고증 오류

## 조사 결과 형식
결과는 다음 JSON 형식으로 정리해 주세요:

\`\`\`json
{
  "period": "${era}",
  "periodName": "${eraInfo.name}",
  "dateRange": "${eraInfo.period}",
  "clothingDetails": {
    "commonItems": ["항목들"],
    "materials": ["직물/재료들"],
    "colors": [{"name": "색상명", "significance": "의미", "usedBy": ["사용계층"]}],
    "socialClassDistinctions": {
      "nobility": ["양반/귀족 복식"],
      "commoners": ["평민 복식"],
      "officials": ["관리 복식"]
    },
    "genderDistinctions": {
      "male": ["남성 복식"],
      "female": ["여성 복식"]
    },
    "accessories": ["장신구들"],
    "seasonalVariations": ["계절별 특징"]
  },
  "architectureDetails": {
    "buildingTypes": ["건축물 유형"],
    "roofStyles": ["지붕 양식"],
    "materials": ["건축 재료"],
    "decorativeElements": ["장식 요소"],
    "structuralFeatures": ["구조적 특징"],
    "landscapeElements": ["조경 요소"],
    "socialClassDistinctions": {
      "palaces": ["궁궐 특징"],
      "noblesHouses": ["양반가 특징"],
      "commonersHouses": ["서민가 특징"]
    }
  },
  "dailyLifeDetails": {
    "activities": ["일상 활동"],
    "cuisine": ["음식문화"],
    "festivals": ["축제/명절"],
    "customs": ["풍속"],
    "occupations": ["직업/생업"]
  },
  "anachronisticElements": [
    "시대착오적 요소 1",
    "시대착오적 요소 2"
  ],
  "keyEvents": ["주요 역사적 사건"],
  "notableFigures": ["주요 인물"],
  "sources": [
    {"title": "자료명", "type": "academic", "url": "출처URL"}
  ]
}
\`\`\`

정확한 역사적 고증을 위해 신뢰할 수 있는 학술 자료와 박물관 자료를 우선적으로 참조해 주세요.`;
  }

  /**
   * 연구 결과 파싱
   *
   * API 응답 텍스트를 HistoricalContext 객체로 변환합니다.
   *
   * @param text API 응답 텍스트
   * @returns 파싱된 HistoricalContext 객체
   */
  private parseResearchResult(text: string): HistoricalContext {
    try {
      // JSON 블록 추출
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('JSON 형식의 결과를 찾을 수 없습니다');
      }

      const jsonStr = jsonMatch[1];
      const parsed = JSON.parse(jsonStr);

      // 필수 필드 검증 및 기본값 설정
      const result: HistoricalContext = {
        period: parsed.period,
        periodName: parsed.periodName,
        dateRange: parsed.dateRange,
        clothingDetails: this.parseClothingDetails(parsed.clothingDetails),
        architectureDetails: this.parseArchitectureDetails(parsed.architectureDetails),
        dailyLifeDetails: this.parseDailyLifeDetails(parsed.dailyLifeDetails),
        keyEvents: parsed.keyEvents || [],
        notableFigures: parsed.notableFigures || [],
        sources: this.parseSources(parsed.sources),
      };

      // 시대착오적 요소를 별도로 저장 (확장 필드로)
      if (parsed.anachronisticElements) {
        (result as any).anachronisticElements = parsed.anachronisticElements;
      }

      return result;
    } catch (error) {
      throw new Error(`연구 결과 파싱 실패: ${error}`);
    }
  }

  /**
   * 복식 정보 파싱
   */
  private parseClothingDetails(data: any): ClothingDetails {
    if (!data) {
      return {
        commonItems: [],
        materials: [],
        colors: [],
        socialClassDistinctions: {
          nobility: [],
          commoners: [],
        },
      };
    }

    return {
      commonItems: data.commonItems || [],
      materials: data.materials || [],
      colors: (data.colors || []).map((c: any) => ({
        name: c.name || '',
        significance: c.significance,
        usedBy: c.usedBy || [],
        hexCode: c.hexCode,
      })),
      socialClassDistinctions: {
        nobility: data.socialClassDistinctions?.nobility || [],
        commoners: data.socialClassDistinctions?.commoners || [],
        officials: data.socialClassDistinctions?.officials,
      },
      genderDistinctions: data.genderDistinctions
        ? {
            male: data.genderDistinctions.male || [],
            female: data.genderDistinctions.female || [],
          }
        : undefined,
      accessories: data.accessories,
      seasonalVariations: data.seasonalVariations,
    };
  }

  /**
   * 건축 정보 파싱
   */
  private parseArchitectureDetails(data: any): ArchitectureDetails {
    if (!data) {
      return {
        buildingTypes: [],
        roofStyles: [],
        materials: [],
        decorativeElements: [],
      };
    }

    return {
      buildingTypes: data.buildingTypes || [],
      roofStyles: data.roofStyles || [],
      materials: data.materials || [],
      decorativeElements: data.decorativeElements || [],
      structuralFeatures: data.structuralFeatures,
      landscapeElements: data.landscapeElements,
      socialClassDistinctions: data.socialClassDistinctions
        ? {
            palaces: data.socialClassDistinctions.palaces || [],
            noblesHouses: data.socialClassDistinctions.noblesHouses || [],
            commonersHouses: data.socialClassDistinctions.commonersHouses || [],
          }
        : undefined,
    };
  }

  /**
   * 일상생활 정보 파싱
   */
  private parseDailyLifeDetails(data: any): DailyLifeDetails | undefined {
    if (!data) {
      return undefined;
    }

    return {
      activities: data.activities || [],
      cuisine: data.cuisine,
      festivals: data.festivals,
      customs: data.customs,
      occupations: data.occupations,
    };
  }

  /**
   * 출처 정보 파싱
   */
  private parseSources(data: any[]): ResearchSource[] {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((s) => ({
      title: s.title || '제목 없음',
      author: s.author,
      year: s.year,
      url: s.url,
      type: this.normalizeSourceType(s.type),
      credibilityScore: s.credibilityScore,
    }));
  }

  /**
   * 출처 유형 정규화
   */
  private normalizeSourceType(
    type: string
  ): 'academic' | 'museum' | 'archive' | 'book' | 'article' | 'web' {
    const typeMap: Record<string, ResearchSource['type']> = {
      academic: 'academic',
      museum: 'museum',
      archive: 'archive',
      book: 'book',
      article: 'article',
      web: 'web',
      논문: 'academic',
      박물관: 'museum',
      기록관: 'archive',
      도서: 'book',
      기사: 'article',
      웹사이트: 'web',
    };

    return typeMap[type?.toLowerCase()] || 'web';
  }

  // ========================================
  // 내부 상태 관리 (실제 구현에서는 외부 저장소 사용 권장)
  // ========================================

  private researchStates: Map<
    string,
    {
      era: Era;
      topic: string;
      prompt: string;
      startedAt: Date;
      completedAt?: Date;
      status: ResearchStatus;
      rawResponse?: any;
      result?: HistoricalContext;
      error?: string;
    }
  > = new Map();

  /**
   * 상호작용 ID 생성
   */
  private generateInteractionId(era: Era, topic: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `research_${era}_${timestamp}_${random}`;
  }

  /**
   * 연구 상태 저장
   */
  private storeResearchState(interactionId: string, state: any): void {
    this.researchStates.set(interactionId, state);
  }

  /**
   * 연구 상태 조회
   */
  private getResearchState(interactionId: string): any {
    return this.researchStates.get(interactionId);
  }

  /**
   * 연구 상태 업데이트
   */
  private updateResearchState(interactionId: string, updates: any): void {
    const current = this.researchStates.get(interactionId);
    if (current) {
      this.researchStates.set(interactionId, { ...current, ...updates });
    }
  }

  /**
   * 연구 진행 상황 확인
   */
  private async checkResearchProgress(
    interactionId: string
  ): Promise<ResearchPollResult> {
    const state = this.getResearchState(interactionId);

    if (!state) {
      return { status: 'failed', error: '연구 상태를 찾을 수 없습니다' };
    }

    // rawResponse가 있는 경우 결과 파싱 시도
    if (state.rawResponse) {
      try {
        // Gemini API 응답에서 텍스트 추출
        const responseText = this.extractTextFromResponse(state.rawResponse);

        if (responseText && responseText.includes('```json')) {
          const result = this.parseResearchResult(responseText);
          return { status: 'completed', result };
        }
      } catch (error) {
        console.warn(`결과 파싱 시도 중 오류: ${error}`);
      }
    }

    // 아직 진행 중
    return { status: 'in_progress', progress: 50 };
  }

  /**
   * API 응답에서 텍스트 추출
   */
  private extractTextFromResponse(response: any): string {
    // Gemini API 응답 구조에 따라 텍스트 추출
    if (typeof response === 'string') {
      return response;
    }

    if (response?.text) {
      return response.text;
    }

    if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text;
    }

    if (response?.response?.text) {
      return response.response.text();
    }

    return '';
  }

  /**
   * 비동기 대기
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 동기식 연구 수행 (편의 메서드)
   *
   * startResearch와 pollResults를 결합하여 결과를 직접 반환합니다.
   *
   * @param era 조사할 시대
   * @param topic 조사할 주제
   * @param maxWaitTime 최대 대기 시간 (밀리초)
   * @returns 역사적 컨텍스트 결과
   */
  async research(
    era: Era,
    topic: string,
    maxWaitTime?: number
  ): Promise<HistoricalContext> {
    const interactionId = await this.startResearch(era, topic);
    return this.pollResults(interactionId, maxWaitTime);
  }
}

export default DeepResearchService;
