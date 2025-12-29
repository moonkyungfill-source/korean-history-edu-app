/**
 * Korean History Prompt Generator - Prompt Combiner Service
 *
 * Combines research data and historical context to generate
 * prompts for image generation at different complexity levels.
 */

import { GeminiClient } from '../gemini/client';
import { Era, PromptComplexity } from '../../types';
import { getEraInfo, getImagePromptPrefix } from '../../config/eras.config';

/**
 * Request for prompt generation
 */
export interface PromptGenerationRequest {
  /** Historical era */
  era: Era;

  /** Topic for prompt generation */
  topic: string;

  /** Complexity level */
  complexity: PromptComplexity;

  /** Additional context */
  additionalContext?: string;
}

/**
 * Response from prompt generation
 */
export interface PromptGenerationResult {
  /** Generated prompt */
  prompt: string;

  /** Historical context used */
  historicalContext?: string;

  /** Sources referenced */
  sources?: string[];
}

/**
 * Prompt Combiner Service
 *
 * Generates prompts for Korean historical image generation
 * by combining era-specific context with topic information.
 */
export class PromptCombinerService {
  private geminiClient: GeminiClient;

  /**
   * Create a new PromptCombinerService
   *
   * @param apiKey - Gemini API key
   */
  constructor(apiKey: string) {
    this.geminiClient = new GeminiClient(apiKey);
  }

  /**
   * Generate a prompt based on the request parameters
   *
   * @param request - Prompt generation request
   * @returns Generated prompt result
   */
  async generatePrompt(request: PromptGenerationRequest): Promise<PromptGenerationResult> {
    const { era, topic, complexity, additionalContext } = request;
    const eraInfo = getEraInfo(era);
    const eraPrefix = getImagePromptPrefix(era);

    if (complexity === 'simple') {
      return this.generateSimplePrompt(era, topic, eraPrefix, eraInfo.name);
    } else {
      return this.generateEnhancedPrompt(era, topic, eraPrefix, eraInfo, additionalContext);
    }
  }

  /**
   * Generate a simple prompt without AI enhancement
   *
   * @param era - Historical era
   * @param topic - Topic
   * @param eraPrefix - Era-specific prefix
   * @param eraName - Era name in Korean
   * @returns Simple prompt result
   */
  private async generateSimplePrompt(
    era: Era,
    topic: string,
    eraPrefix: string,
    eraName: string
  ): Promise<PromptGenerationResult> {
    const prompt = `${eraPrefix}, ${topic}, traditional Korean historical style, detailed illustration, high quality, educational material`;

    return {
      prompt,
      historicalContext: `${eraName} period representation of ${topic}`,
    };
  }

  /**
   * Generate an enhanced prompt using AI research
   *
   * @param era - Historical era
   * @param topic - Topic
   * @param eraPrefix - Era-specific prefix
   * @param eraInfo - Full era information
   * @param additionalContext - Additional context
   * @returns Enhanced prompt result
   */
  private async generateEnhancedPrompt(
    era: Era,
    topic: string,
    eraPrefix: string,
    eraInfo: { name: string; nameEn: string; period: string; description: string },
    additionalContext?: string
  ): Promise<PromptGenerationResult> {
    const researchPrompt = this.buildResearchPrompt(eraInfo, topic, additionalContext);

    try {
      // Use Gemini to generate historically accurate details
      const researchResult = await this.geminiClient.generateWithSearchGrounding(researchPrompt);

      // Parse the research result and build enhanced prompt
      const enhancedDetails = this.parseResearchResult(researchResult.text);
      const sources = this.extractSources(researchResult);

      const prompt = this.buildEnhancedPrompt(eraPrefix, topic, enhancedDetails);

      return {
        prompt,
        historicalContext: researchResult.text,
        sources,
      };
    } catch (error) {
      // Fallback to a structured prompt without AI enhancement
      console.warn('Failed to generate enhanced prompt with AI, using fallback:', error);
      return this.generateFallbackEnhancedPrompt(era, topic, eraPrefix, eraInfo);
    }
  }

  /**
   * Build the research prompt for Gemini
   *
   * @param eraInfo - Era information
   * @param topic - Topic
   * @param additionalContext - Additional context
   * @returns Research prompt string
   */
  private buildResearchPrompt(
    eraInfo: { name: string; nameEn: string; period: string; description: string },
    topic: string,
    additionalContext?: string
  ): string {
    let prompt = `You are a Korean history expert. Provide detailed visual description for image generation.

Era: ${eraInfo.name} (${eraInfo.nameEn}, ${eraInfo.period})
Topic: ${topic}
Context: ${eraInfo.description}

Please provide specific details about:
1. Visual elements (colors, patterns, materials)
2. Authentic Korean historical elements specific to this era
3. Clothing, architecture, or objects typical of this period
4. Composition suggestions for educational illustration

Respond in English with comma-separated descriptive phrases suitable for image generation prompts.`;

    if (additionalContext) {
      prompt += `\n\nAdditional context: ${additionalContext}`;
    }

    return prompt;
  }

  /**
   * Parse research result into usable prompt elements
   *
   * @param text - Research result text
   * @returns Parsed details string
   */
  private parseResearchResult(text: string): string {
    // Clean up the text and extract key phrases
    const cleaned = text
      .replace(/\n+/g, ', ')
      .replace(/[•\-\d.]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit length for prompt
    const maxLength = 500;
    if (cleaned.length > maxLength) {
      return cleaned.substring(0, maxLength).replace(/,\s*$/, '');
    }

    return cleaned;
  }

  /**
   * Extract sources from grounded response
   *
   * @param response - Grounded response from Gemini
   * @returns Array of source URLs/titles
   */
  private extractSources(response: { groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } }): string[] {
    const sources: string[] = [];

    if (response.groundingMetadata?.groundingChunks) {
      for (const chunk of response.groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          sources.push(chunk.web.title || chunk.web.uri);
        }
      }
    }

    return sources;
  }

  /**
   * Build the final enhanced prompt
   *
   * @param eraPrefix - Era-specific prefix
   * @param topic - Topic
   * @param enhancedDetails - AI-generated details
   * @returns Final enhanced prompt
   */
  private buildEnhancedPrompt(
    eraPrefix: string,
    topic: string,
    enhancedDetails: string
  ): string {
    return `${eraPrefix}, ${topic}, ${enhancedDetails}, traditional Korean historical style, detailed illustration, high quality, educational material, museum quality, historically accurate`;
  }

  /**
   * Generate fallback enhanced prompt when AI fails
   *
   * @param era - Historical era
   * @param topic - Topic
   * @param eraPrefix - Era-specific prefix
   * @param eraInfo - Era information
   * @returns Fallback prompt result
   */
  private generateFallbackEnhancedPrompt(
    era: Era,
    topic: string,
    eraPrefix: string,
    eraInfo: { name: string; period: string; description: string }
  ): PromptGenerationResult {
    const prompt = `${eraPrefix}, ${topic}, ${eraInfo.description}, traditional Korean historical style, detailed illustration, high quality, educational material, museum quality, historically accurate, authentic Korean cultural elements, period-appropriate materials and textures`;

    return {
      prompt,
      historicalContext: `${eraInfo.name} (${eraInfo.period}): ${eraInfo.description}`,
    };
  }
}

/**
 * Factory function to create a PromptCombinerService instance
 *
 * @param apiKey - Optional API key (uses environment variable if not provided)
 * @returns PromptCombinerService instance
 */
export function createPromptCombinerService(apiKey?: string): PromptCombinerService {
  const key = apiKey ?? process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error('API key is required. Provide it as parameter or set GEMINI_API_KEY environment variable.');
  }

  return new PromptCombinerService(key);
}
