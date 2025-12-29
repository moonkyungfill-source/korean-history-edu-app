/**
 * Korean History Prompt Generator - Test Case Generator
 *
 * Generates 4 types of test cases for prompt evaluation:
 * - Case 1: Simple prompt without negative prompt
 * - Case 2: Simple prompt with negative prompt
 * - Case 3: Enhanced prompt without negative prompt
 * - Case 4: Enhanced prompt with negative prompt
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Era,
  PromptComplexity,
  NegativePromptMode,
  TestCase,
} from '../types';
import { ERA_ORDER } from '../config/eras.config';
import { buildNegativePrompt } from '../constants/negativePrompts';
import { PromptCombinerService } from '../services/prompt/prompt-combiner.service';

/**
 * Result from prompt combination for a single case
 */
export interface CaseResult {
  prompt: string;
  negativePrompt?: string;
  historicalContext?: string;
  sources?: string[];
}

/**
 * Structure for a complete test case set
 */
export interface TestCaseSet {
  /** Unique identifier for the test case set */
  id: string;

  /** Historical era */
  era: Era;

  /** Topic for the test cases */
  topic: string;

  /** Creation timestamp */
  createdAt: Date;

  /** The four test cases */
  cases: {
    case1: TestCase; // Simple without negative
    case2: TestCase; // Simple with negative
    case3: TestCase; // Enhanced without negative
    case4: TestCase; // Enhanced with negative
  };
}

/**
 * Test Case Generator
 *
 * Generates structured test case sets for evaluating prompt effectiveness
 * across different complexity levels and negative prompt configurations.
 */
export class TestCaseGenerator {
  private promptCombiner: PromptCombinerService;

  /**
   * Create a new TestCaseGenerator
   *
   * @param apiKey - Gemini API key for prompt generation
   */
  constructor(apiKey: string) {
    this.promptCombiner = new PromptCombinerService(apiKey);
  }

  /**
   * Generate a complete test case set for a specific era and topic
   *
   * @param era - Historical era
   * @param topic - Topic for prompt generation (e.g., 'clothing', 'architecture')
   * @returns Complete test case set with 4 variations
   */
  async generateTestCaseSet(era: Era, topic: string): Promise<TestCaseSet> {
    const setId = this.generateId();
    const createdAt = new Date();

    // Generate all 4 case variations
    const [case1Result, case2Result, case3Result, case4Result] = await Promise.all([
      this.generateCaseResult(era, topic, 'simple', 'without-negative'),
      this.generateCaseResult(era, topic, 'simple', 'with-negative'),
      this.generateCaseResult(era, topic, 'enhanced', 'without-negative'),
      this.generateCaseResult(era, topic, 'enhanced', 'with-negative'),
    ]);

    return {
      id: setId,
      era,
      topic,
      createdAt,
      cases: {
        case1: this.createCase(1, 'simple', 'without-negative', era, topic, case1Result),
        case2: this.createCase(2, 'simple', 'with-negative', era, topic, case2Result),
        case3: this.createCase(3, 'enhanced', 'without-negative', era, topic, case3Result),
        case4: this.createCase(4, 'enhanced', 'with-negative', era, topic, case4Result),
      },
    };
  }

  /**
   * Generate test case sets for multiple topics within the same era
   *
   * @param era - Historical era
   * @param topics - Array of topics to generate test cases for
   * @returns Array of test case sets
   */
  async generateMultipleSets(era: Era, topics: string[]): Promise<TestCaseSet[]> {
    const results: TestCaseSet[] = [];

    for (const topic of topics) {
      const testCaseSet = await this.generateTestCaseSet(era, topic);
      results.push(testCaseSet);
    }

    return results;
  }

  /**
   * Generate test case sets for a topic across all historical eras
   *
   * @param topic - Topic for prompt generation
   * @returns Map of Era to TestCaseSet
   */
  async generateForAllEras(topic: string): Promise<Map<Era, TestCaseSet>> {
    const results = new Map<Era, TestCaseSet>();

    for (const era of ERA_ORDER) {
      const testCaseSet = await this.generateTestCaseSet(era, topic);
      results.set(era, testCaseSet);
    }

    return results;
  }

  /**
   * Generate the result data for a specific case configuration
   *
   * @param era - Historical era
   * @param topic - Topic for prompt generation
   * @param complexity - Prompt complexity level
   * @param negativeMode - Whether to include negative prompt
   * @returns Case result with prompt data
   */
  private async generateCaseResult(
    era: Era,
    topic: string,
    complexity: PromptComplexity,
    negativeMode: NegativePromptMode
  ): Promise<CaseResult> {
    // Generate the main prompt using the combiner service
    const promptResult = await this.promptCombiner.generatePrompt({
      era,
      topic,
      complexity,
    });

    const result: CaseResult = {
      prompt: promptResult.prompt,
      historicalContext: promptResult.historicalContext,
      sources: promptResult.sources,
    };

    // Add negative prompt if requested
    if (negativeMode === 'with-negative') {
      result.negativePrompt = buildNegativePrompt(era);
    }

    return result;
  }

  /**
   * Create a test case from the generated result
   *
   * @param caseNumber - Case number (1-4)
   * @param complexity - Prompt complexity level
   * @param negativeMode - Whether negative prompt is included
   * @param era - Historical era
   * @param topic - Topic for the test case
   * @param result - Generated case result
   * @returns Complete test case object
   */
  private createCase(
    caseNumber: 1 | 2 | 3 | 4,
    complexity: PromptComplexity,
    negativeMode: NegativePromptMode,
    era: Era,
    topic: string,
    result: CaseResult
  ): TestCase {
    const complexityLabel = complexity === 'simple' ? 'Simple' : 'Enhanced';
    const negativeLabel = negativeMode === 'with-negative' ? 'with Negative' : 'without Negative';

    return {
      id: this.generateId(),
      name: `Case ${caseNumber}: ${complexityLabel} ${negativeLabel}`,
      prompt: result.prompt,
      negativePrompt: result.negativePrompt,
      complexity,
      negativeMode,
      era,
      parameters: {
        width: 1024,
        height: 1024,
        steps: 30,
        guidanceScale: 7.5,
      },
      expectedCharacteristics: this.getExpectedCharacteristics(era, topic, complexity),
      createdAt: new Date(),
    };
  }

  /**
   * Generate a unique identifier
   *
   * @returns UUID string
   */
  private generateId(): string {
    return uuidv4();
  }

  /**
   * Get expected characteristics based on era, topic, and complexity
   *
   * @param era - Historical era
   * @param topic - Topic
   * @param complexity - Prompt complexity
   * @returns Array of expected characteristics
   */
  private getExpectedCharacteristics(
    era: Era,
    topic: string,
    complexity: PromptComplexity
  ): string[] {
    const baseCharacteristics = [
      `Accurate ${era} period representation`,
      `Authentic Korean historical style`,
      `Topic-relevant: ${topic}`,
    ];

    if (complexity === 'enhanced') {
      baseCharacteristics.push(
        'Detailed historical accuracy',
        'Rich cultural context',
        'Period-appropriate materials and textures',
        'Historically accurate color palette'
      );
    }

    return baseCharacteristics;
  }
}

/**
 * Factory function to create a TestCaseGenerator instance
 *
 * @param apiKey - Optional API key (uses environment variable if not provided)
 * @returns TestCaseGenerator instance
 */
export function createTestCaseGenerator(apiKey?: string): TestCaseGenerator {
  const key = apiKey ?? process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error('API key is required. Provide it as parameter or set GEMINI_API_KEY environment variable.');
  }

  return new TestCaseGenerator(key);
}
