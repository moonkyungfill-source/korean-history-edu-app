/**
 * Negative Prompt Builder Service
 *
 * Service for building and managing negative prompts for Korean historical image generation.
 * Combines global negative prompts with era-specific ones to prevent cultural confusion,
 * anachronistic elements, and quality issues.
 */

import {
  GLOBAL_NEGATIVE_PROMPTS,
  ERA_NEGATIVE_PROMPTS,
  buildNegativePrompt,
  getAllGlobalNegativePrompts,
  getEraNegativePrompts,
} from '../../constants/negativePrompts';
import { Era } from '../../types';

/**
 * Result of combining a base prompt with its negative prompt
 */
export interface CombinedPromptResult {
  /** The original base prompt with additional context */
  prompt: string;
  /** The generated negative prompt */
  negativePrompt: string;
}

/**
 * Service for building and managing negative prompts for Korean historical image generation.
 *
 * @example
 * ```typescript
 * const service = new NegativePromptService();
 *
 * // Build negative prompt for a specific era
 * const negativePrompt = service.buildForEra('joseon-early');
 *
 * // Combine with a base prompt
 * const result = service.combineWithNegative(
 *   'A nobleman wearing traditional hanbok in a royal palace courtyard',
 *   'joseon-early'
 * );
 * ```
 */
export class NegativePromptService {
  /**
   * Build a complete negative prompt for a specific historical era.
   * Combines global negative prompts with era-specific ones and any additional keywords.
   *
   * @param era - The historical era key
   * @param additionalKeywords - Optional array of additional negative keywords to include
   * @returns Formatted negative prompt string ready for use with image generation APIs
   *
   * @example
   * ```typescript
   * const service = new NegativePromptService();
   * const negativePrompt = service.buildForEra('goryeo', ['unwanted_element']);
   * ```
   */
  buildForEra(era: Era, additionalKeywords?: string[]): string {
    return buildNegativePrompt(era, additionalKeywords || []);
  }

  /**
   * Get all global negative prompts as a flattened array.
   * These are applied to all historical image generations regardless of era.
   *
   * @returns Array of global negative prompt keywords
   *
   * @example
   * ```typescript
   * const service = new NegativePromptService();
   * const globals = service.getGlobalNegatives();
   * // Returns: ['japanese style', 'kimono', 'samurai', ...]
   * ```
   */
  getGlobalNegatives(): string[] {
    return getAllGlobalNegativePrompts();
  }

  /**
   * Get era-specific negative prompts.
   * These prevent anachronisms and style mixing between different Korean historical periods.
   *
   * @param era - The historical era key
   * @returns Array of negative prompts specific to the era, or empty array if era not found
   *
   * @example
   * ```typescript
   * const service = new NegativePromptService();
   * const eraPrompts = service.getEraNegatives('joseon-early');
   * // Returns: ['western influence', 'late joseon style', ...]
   * ```
   */
  getEraNegatives(era: Era): string[] {
    return getEraNegativePrompts(era);
  }

  /**
   * Combine a base prompt with its negative prompt in a structured format.
   * The result includes critical avoidance requirements and era authenticity statement.
   *
   * @param basePrompt - The main image generation prompt
   * @param era - The historical era for context-appropriate negative prompts
   * @returns Object containing the enhanced prompt and negative prompt
   *
   * @example
   * ```typescript
   * const service = new NegativePromptService();
   * const result = service.combineWithNegative(
   *   'A scholar reading books in a traditional study room',
   *   'joseon-late'
   * );
   * console.log(result.prompt);
   * // Output:
   * // A scholar reading books in a traditional study room
   * //
   * // CRITICAL AVOIDANCE REQUIREMENTS:
   * // The following elements MUST NOT appear in the generated image:
   * // japanese style, kimono, samurai, ...
   * //
   * // This image depicts authentic Korean historical culture from the specified era.
   * ```
   */
  combineWithNegative(basePrompt: string, era: Era): CombinedPromptResult {
    const negativePrompt = this.buildForEra(era);

    const enhancedPrompt = `${basePrompt}

CRITICAL AVOIDANCE REQUIREMENTS:
The following elements MUST NOT appear in the generated image:
${negativePrompt}

This image depicts authentic Korean historical culture from the specified era.`;

    return {
      prompt: enhancedPrompt,
      negativePrompt,
    };
  }

  /**
   * Count the total number of negative keywords for a specific era.
   * Includes both global and era-specific keywords.
   *
   * @param era - The historical era key
   * @returns Total count of unique negative keywords
   *
   * @example
   * ```typescript
   * const service = new NegativePromptService();
   * const count = service.countKeywords('goryeo');
   * // Returns: 60 (example - actual count depends on prompts defined)
   * ```
   */
  countKeywords(era: Era): number {
    const globalPrompts = this.getGlobalNegatives();
    const eraPrompts = this.getEraNegatives(era);

    // Use Set to count unique keywords
    const uniqueKeywords = new Set([...globalPrompts, ...eraPrompts]);

    return uniqueKeywords.size;
  }

  /**
   * Get negative prompts by category from global prompts.
   *
   * @param category - The category of global negative prompts
   * @returns Array of negative prompts for the specified category
   */
  getGlobalByCategory(
    category: 'culturalJapanese' | 'culturalChinese' | 'modernElements' | 'qualityIssues'
  ): readonly string[] {
    return GLOBAL_NEGATIVE_PROMPTS[category];
  }

  /**
   * Check if an era has specific negative prompts defined.
   *
   * @param era - The historical era key to check
   * @returns True if the era has specific negative prompts defined
   */
  hasEraPrompts(era: Era): boolean {
    return era in ERA_NEGATIVE_PROMPTS && ERA_NEGATIVE_PROMPTS[era].length > 0;
  }

  /**
   * Get all available era keys that have negative prompts defined.
   *
   * @returns Array of era keys with defined negative prompts
   */
  getAvailableEras(): string[] {
    return Object.keys(ERA_NEGATIVE_PROMPTS);
  }
}
