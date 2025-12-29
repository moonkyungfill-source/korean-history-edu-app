/**
 * Simple Prompt Service
 *
 * 간단한 프롬프트 생성을 담당하는 서비스입니다.
 * 기본적인 시대 정보와 주제만을 포함한 프롬프트를 생성합니다.
 */

import { Era } from '../../types';
import { getEraInfo, getImagePromptPrefix } from '../../config/eras.config';

/**
 * 간단한 프롬프트 생성 결과
 */
export interface SimplePromptResult {
  /** 생성된 프롬프트 */
  prompt: string;
  /** 시대 정보 */
  era: Era;
  /** 주제 */
  topic: string;
  /** 프롬프트 길이 */
  promptLength: number;
}

/**
 * 간단한 프롬프트 생성 서비스
 *
 * 시대별 기본 정보와 주제를 조합하여 간단한 이미지 생성 프롬프트를 만듭니다.
 */
export class SimplePromptService {
  /**
   * 간단한 프롬프트 생성
   *
   * @param era - 역사 시대
   * @param topic - 주제 (예: 의복, 건축, 일상생활 등)
   * @returns 간단한 프롬프트 생성 결과
   */
  async generatePrompt(era: Era, topic: string): Promise<SimplePromptResult> {
    const eraInfo = getEraInfo(era);
    const imagePrefix = getImagePromptPrefix(era);

    // 기본 프롬프트 구조: 시대 정보 + 주제
    const prompt = this.buildSimplePrompt(imagePrefix, topic, eraInfo.name);

    return {
      prompt,
      era,
      topic,
      promptLength: prompt.length,
    };
  }

  /**
   * 간단한 프롬프트 문자열 생성
   *
   * @param imagePrefix - 시대별 이미지 프롬프트 프리픽스
   * @param topic - 주제
   * @param eraName - 시대 한글명
   * @returns 조합된 프롬프트 문자열
   */
  private buildSimplePrompt(
    imagePrefix: string,
    topic: string,
    eraName: string
  ): string {
    const components = [
      imagePrefix,
      `depicting ${topic}`,
      'historically accurate',
      'detailed illustration',
      'traditional Korean art style',
    ];

    return components.join(', ');
  }

  /**
   * 여러 주제에 대한 간단한 프롬프트 일괄 생성
   *
   * @param era - 역사 시대
   * @param topics - 주제 배열
   * @returns 간단한 프롬프트 결과 배열
   */
  async generateBatchPrompts(
    era: Era,
    topics: string[]
  ): Promise<SimplePromptResult[]> {
    const results: SimplePromptResult[] = [];

    for (const topic of topics) {
      const result = await this.generatePrompt(era, topic);
      results.push(result);
    }

    return results;
  }
}
