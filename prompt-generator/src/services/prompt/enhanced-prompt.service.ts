/**
 * Enhanced Prompt Service
 *
 * 심화 프롬프트 생성을 담당하는 서비스입니다.
 * Gemini API의 Deep Research 기능을 활용하여 역사적 맥락을 포함한
 * 상세한 프롬프트를 생성합니다.
 */

import { Era, HistoricalContext } from '../../types';
import { getEraInfo, getImagePromptPrefix } from '../../config/eras.config';
import { GeminiClient, GeminiApiError } from '../gemini/client';

/**
 * 심화 프롬프트 생성 결과
 */
export interface EnhancedPromptResult {
  /** 생성된 프롬프트 */
  prompt: string;
  /** 시대 정보 */
  era: Era;
  /** 주제 */
  topic: string;
  /** 프롬프트 길이 */
  promptLength: number;
  /** 역사적 맥락 정보 */
  historicalContext: HistoricalContext;
  /** Deep Research 사용 여부 */
  deepResearchUsed: boolean;
  /** 참조 소스 */
  sources?: string[];
}

/**
 * 심화 프롬프트 생성 서비스
 *
 * Gemini API를 활용하여 역사적 정확성이 높은 상세 프롬프트를 생성합니다.
 * Google Search Grounding을 통해 최신 학술 정보를 반영합니다.
 */
export class EnhancedPromptService {
  private geminiClient: GeminiClient;

  /**
   * EnhancedPromptService 생성자
   *
   * @param apiKey - Gemini API 키
   */
  constructor(apiKey: string) {
    this.geminiClient = new GeminiClient(apiKey, 'gemini-2.0-flash');
  }

  /**
   * 심화 프롬프트 생성
   *
   * Deep Research를 활용하여 역사적 맥락이 풍부한 프롬프트를 생성합니다.
   *
   * @param era - 역사 시대
   * @param topic - 주제
   * @returns 심화 프롬프트 생성 결과
   */
  async generatePrompt(era: Era, topic: string): Promise<EnhancedPromptResult> {
    const eraInfo = getEraInfo(era);
    const imagePrefix = getImagePromptPrefix(era);

    // Deep Research를 통한 역사적 맥락 수집
    const historicalContext = await this.performDeepResearch(era, topic);

    // 심화 프롬프트 생성
    const prompt = this.buildEnhancedPrompt(
      imagePrefix,
      topic,
      eraInfo.name,
      historicalContext
    );

    return {
      prompt,
      era,
      topic,
      promptLength: prompt.length,
      historicalContext,
      deepResearchUsed: true,
      sources: historicalContext.sources?.map((s) => s.title),
    };
  }

  /**
   * Deep Research 수행
   *
   * Gemini API의 Google Search Grounding을 활용하여
   * 특정 시대와 주제에 대한 역사적 맥락을 수집합니다.
   *
   * @param era - 역사 시대
   * @param topic - 주제
   * @returns 역사적 맥락 정보
   */
  private async performDeepResearch(
    era: Era,
    topic: string
  ): Promise<HistoricalContext> {
    const eraInfo = getEraInfo(era);

    const researchPrompt = `
한국 역사 ${eraInfo.name} (${eraInfo.period})의 ${topic}에 대해 상세히 조사해주세요.

다음 정보를 포함해주세요:
1. 해당 시대의 복식 특징 (재료, 색상, 사회적 의미)
2. 건축 양식 (건물 유형, 지붕 형태, 장식 요소)
3. 일상생활 모습 (활동, 풍습, 문화)
4. 시대적 예술 특징 (미술 양식, 모티프)

학술적으로 정확한 정보를 제공하고, 가능하면 출처를 명시해주세요.
JSON 형식으로 응답해주세요.
`;

    try {
      const response = await this.geminiClient.generateWithSearchGrounding(
        researchPrompt
      );

      // 응답 파싱 및 HistoricalContext 구성
      return this.parseResearchResponse(response.text, era, eraInfo);
    } catch (error) {
      // API 실패 시 기본 컨텍스트 반환
      console.warn('Deep research failed, using default context:', error);
      return this.getDefaultHistoricalContext(era, eraInfo);
    }
  }

  /**
   * 연구 응답 파싱
   *
   * @param responseText - Gemini API 응답 텍스트
   * @param era - 역사 시대
   * @param eraInfo - 시대 정보
   * @returns 파싱된 역사적 맥락
   */
  private parseResearchResponse(
    responseText: string,
    era: Era,
    eraInfo: { name: string; period: string }
  ): HistoricalContext {
    try {
      // JSON 블록 추출 시도
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;

      const parsed = JSON.parse(jsonStr);

      return {
        period: era,
        periodName: eraInfo.name,
        dateRange: eraInfo.period,
        clothingDetails: parsed.clothingDetails || this.getDefaultClothingDetails(),
        architectureDetails: parsed.architectureDetails || this.getDefaultArchitectureDetails(),
        dailyLifeDetails: parsed.dailyLifeDetails,
        artDetails: parsed.artDetails,
        sources: parsed.sources || [],
      };
    } catch {
      // 파싱 실패 시 기본값 반환
      return this.getDefaultHistoricalContext(era, eraInfo);
    }
  }

  /**
   * 기본 역사적 맥락 생성
   */
  private getDefaultHistoricalContext(
    era: Era,
    eraInfo: { name: string; period: string }
  ): HistoricalContext {
    return {
      period: era,
      periodName: eraInfo.name,
      dateRange: eraInfo.period,
      clothingDetails: this.getDefaultClothingDetails(),
      architectureDetails: this.getDefaultArchitectureDetails(),
      sources: [],
    };
  }

  /**
   * 기본 복식 정보
   */
  private getDefaultClothingDetails() {
    return {
      commonItems: ['hanbok', 'jeogori', 'chima', 'baji'],
      materials: ['silk', 'ramie', 'cotton'],
      colors: [
        { name: 'white', significance: 'purity and simplicity' },
        { name: 'blue', significance: 'scholars and officials' },
      ],
      socialClassDistinctions: {
        nobility: ['silk hanbok', 'elaborate embroidery'],
        commoners: ['plain cotton hanbok', 'natural colors'],
      },
    };
  }

  /**
   * 기본 건축 정보
   */
  private getDefaultArchitectureDetails() {
    return {
      buildingTypes: ['hanok', 'palace', 'temple'],
      roofStyles: ['giwa roof', 'choga roof'],
      materials: ['wood', 'stone', 'clay tiles'],
      decorativeElements: ['dancheong', 'carved beams'],
    };
  }

  /**
   * 심화 프롬프트 문자열 생성
   *
   * @param imagePrefix - 시대별 이미지 프롬프트 프리픽스
   * @param topic - 주제
   * @param eraName - 시대 한글명
   * @param context - 역사적 맥락
   * @returns 조합된 심화 프롬프트 문자열
   */
  private buildEnhancedPrompt(
    imagePrefix: string,
    topic: string,
    eraName: string,
    context: HistoricalContext
  ): string {
    const clothingKeywords = context.clothingDetails.commonItems.slice(0, 3).join(', ');
    const architectureKeywords = context.architectureDetails.buildingTypes.slice(0, 2).join(', ');
    const materialKeywords = context.clothingDetails.materials.slice(0, 2).join(', ');

    const components = [
      imagePrefix,
      `detailed depiction of ${topic}`,
      `authentic ${eraName} period elements`,
      `traditional clothing: ${clothingKeywords}`,
      `architecture style: ${architectureKeywords}`,
      `materials: ${materialKeywords}`,
      'museum quality',
      'historically accurate',
      'scholarly reference illustration',
      'high detail',
      'professional historical illustration',
    ];

    return components.join(', ');
  }

  /**
   * 여러 주제에 대한 심화 프롬프트 일괄 생성
   *
   * @param era - 역사 시대
   * @param topics - 주제 배열
   * @returns 심화 프롬프트 결과 배열
   */
  async generateBatchPrompts(
    era: Era,
    topics: string[]
  ): Promise<EnhancedPromptResult[]> {
    const results: EnhancedPromptResult[] = [];

    for (const topic of topics) {
      const result = await this.generatePrompt(era, topic);
      results.push(result);
    }

    return results;
  }
}
