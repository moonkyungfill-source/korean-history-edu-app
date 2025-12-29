/**
 * Korean History Prompt Generator - Prompt Types
 *
 * Type definitions for prompt generation system
 */

/**
 * Historical era types for Korean history
 */
export type Era =
  | 'goryeo'
  | 'joseon-early'
  | 'joseon-mid'
  | 'joseon-late'
  | 'japanese-occupation';

/**
 * Prompt complexity levels
 */
export type PromptComplexity = 'simple' | 'enhanced';

/**
 * Negative prompt inclusion mode
 */
export type NegativePromptMode = 'with-negative' | 'without-negative';

/**
 * Individual test case for prompt evaluation
 */
export interface TestCase {
  /** Unique identifier for the test case */
  id: string;

  /** Display name of the test case */
  name: string;

  /** The main prompt text */
  prompt: string;

  /** Optional negative prompt */
  negativePrompt?: string;

  /** Complexity level of the prompt */
  complexity: PromptComplexity;

  /** Whether negative prompt is included */
  negativeMode: NegativePromptMode;

  /** Historical era context */
  era: Era;

  /** Additional parameters for image generation */
  parameters?: {
    /** Image width */
    width?: number;
    /** Image height */
    height?: number;
    /** Number of inference steps */
    steps?: number;
    /** Guidance scale */
    guidanceScale?: number;
    /** Random seed for reproducibility */
    seed?: number;
  };

  /** Expected characteristics in generated image */
  expectedCharacteristics?: string[];

  /** Creation timestamp */
  createdAt?: Date;
}

/**
 * Set of 4 test cases covering all prompt variations
 * (simple/enhanced x with-negative/without-negative)
 */
export interface TestCaseSet {
  /** Simple prompt without negative prompt */
  simpleWithoutNegative: TestCase;

  /** Simple prompt with negative prompt */
  simpleWithNegative: TestCase;

  /** Enhanced prompt without negative prompt */
  enhancedWithoutNegative: TestCase;

  /** Enhanced prompt with negative prompt */
  enhancedWithNegative: TestCase;
}

/**
 * Metadata for test case sets
 */
export interface TestCaseMetadata {
  /** Unique identifier for the test set */
  id: string;

  /** Display title */
  title: string;

  /** Detailed description */
  description: string;

  /** Historical era */
  era: Era;

  /** Subject matter (e.g., 'clothing', 'architecture', 'daily-life') */
  subject: string;

  /** Tags for categorization */
  tags: string[];

  /** Version number */
  version: string;

  /** Author or creator */
  author?: string;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Research sources used */
  sources?: string[];

  /** The actual test cases */
  testCases: TestCaseSet;
}

/**
 * Prompt generation request
 */
export interface PromptGenerationRequest {
  /** Historical era */
  era: Era;

  /** Subject description */
  subject: string;

  /** Desired complexity */
  complexity: PromptComplexity;

  /** Whether to include negative prompt */
  includeNegative: boolean;

  /** Additional context or requirements */
  additionalContext?: string;
}

/**
 * Prompt generation response
 */
export interface PromptGenerationResponse {
  /** Generated main prompt */
  prompt: string;

  /** Generated negative prompt (if requested) */
  negativePrompt?: string;

  /** Historical context used */
  historicalContext: string;

  /** Sources referenced */
  sources?: string[];

  /** Generation timestamp */
  generatedAt: Date;
}
