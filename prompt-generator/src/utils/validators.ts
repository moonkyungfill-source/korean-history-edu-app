/**
 * Korean History Prompt Generator - Input Validators
 *
 * Utility functions for validating inputs across the prompt generator system
 */

import { Era, TestCaseSet, TestCase, PromptComplexity, NegativePromptMode } from '../types';

/**
 * Valid historical eras for Korean history prompt generation
 */
export const VALID_ERAS: Era[] = [
  'goryeo',
  'joseon-early',
  'joseon-mid',
  'joseon-late',
  'japanese-occupation',
];

/**
 * Minimum length for topic/subject text
 */
export const TOPIC_MIN_LENGTH = 2;

/**
 * Maximum length for topic/subject text
 */
export const TOPIC_MAX_LENGTH = 200;

/**
 * Minimum length for API key
 */
const API_KEY_MIN_LENGTH = 20;

/**
 * Valid complexity levels
 */
const VALID_COMPLEXITIES: PromptComplexity[] = ['simple', 'enhanced'];

/**
 * Valid negative prompt modes
 */
const VALID_NEGATIVE_MODES: NegativePromptMode[] = ['with-negative', 'without-negative'];

/**
 * Input validation utility class for the prompt generator
 */
export class Validators {
  /**
   * Validate if the given string is a valid historical era
   * @param era - The era string to validate
   * @returns Type guard indicating if the era is valid
   */
  static isValidEra(era: string): era is Era {
    return VALID_ERAS.includes(era as Era);
  }

  /**
   * Validate if the given topic/subject string meets requirements
   * @param topic - The topic string to validate
   * @returns True if the topic is valid
   */
  static isValidTopic(topic: string): boolean {
    if (typeof topic !== 'string') {
      return false;
    }

    const trimmedTopic = topic.trim();

    if (trimmedTopic.length < TOPIC_MIN_LENGTH) {
      return false;
    }

    if (trimmedTopic.length > TOPIC_MAX_LENGTH) {
      return false;
    }

    // Check for potentially harmful characters (basic XSS prevention)
    const dangerousPattern = /<script|javascript:|on\w+=/i;
    if (dangerousPattern.test(trimmedTopic)) {
      return false;
    }

    return true;
  }

  /**
   * Validate if the given API key has a valid format
   * @param apiKey - The API key string to validate
   * @returns True if the API key format is valid
   */
  static isValidApiKey(apiKey: string): boolean {
    if (typeof apiKey !== 'string') {
      return false;
    }

    const trimmedKey = apiKey.trim();

    // Check minimum length
    if (trimmedKey.length < API_KEY_MIN_LENGTH) {
      return false;
    }

    // Check for empty or whitespace-only
    if (!trimmedKey) {
      return false;
    }

    // Check for valid characters (alphanumeric, hyphens, underscores)
    const validKeyPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validKeyPattern.test(trimmedKey)) {
      return false;
    }

    return true;
  }

  /**
   * Validate if the given object is a valid TestCaseSet
   * @param set - The object to validate
   * @returns Type guard indicating if the object is a valid TestCaseSet
   */
  static isValidTestCaseSet(set: unknown): set is TestCaseSet {
    if (!set || typeof set !== 'object') {
      return false;
    }

    const testCaseSet = set as Record<string, unknown>;

    // Check required properties exist
    const requiredKeys = [
      'simpleWithoutNegative',
      'simpleWithNegative',
      'enhancedWithoutNegative',
      'enhancedWithNegative',
    ];

    for (const key of requiredKeys) {
      if (!(key in testCaseSet)) {
        return false;
      }
      if (!Validators.isValidTestCase(testCaseSet[key])) {
        return false;
      }
    }

    // Validate complexity and negative mode consistency
    const simpleWithoutNeg = testCaseSet.simpleWithoutNegative as TestCase;
    const simpleWithNeg = testCaseSet.simpleWithNegative as TestCase;
    const enhancedWithoutNeg = testCaseSet.enhancedWithoutNegative as TestCase;
    const enhancedWithNeg = testCaseSet.enhancedWithNegative as TestCase;

    // Check complexity levels match expectations
    if (simpleWithoutNeg.complexity !== 'simple' || simpleWithNeg.complexity !== 'simple') {
      return false;
    }
    if (enhancedWithoutNeg.complexity !== 'enhanced' || enhancedWithNeg.complexity !== 'enhanced') {
      return false;
    }

    // Check negative modes match expectations
    if (simpleWithoutNeg.negativeMode !== 'without-negative' || enhancedWithoutNeg.negativeMode !== 'without-negative') {
      return false;
    }
    if (simpleWithNeg.negativeMode !== 'with-negative' || enhancedWithNeg.negativeMode !== 'with-negative') {
      return false;
    }

    return true;
  }

  /**
   * Validate if the given object is a valid TestCase
   * @param testCase - The object to validate
   * @returns True if the object is a valid TestCase
   */
  static isValidTestCase(testCase: unknown): testCase is TestCase {
    if (!testCase || typeof testCase !== 'object') {
      return false;
    }

    const tc = testCase as Record<string, unknown>;

    // Check required string fields
    if (typeof tc.id !== 'string' || !tc.id.trim()) {
      return false;
    }
    if (typeof tc.name !== 'string' || !tc.name.trim()) {
      return false;
    }
    if (typeof tc.prompt !== 'string' || !tc.prompt.trim()) {
      return false;
    }

    // Check complexity
    if (typeof tc.complexity !== 'string' || !VALID_COMPLEXITIES.includes(tc.complexity as PromptComplexity)) {
      return false;
    }

    // Check negative mode
    if (typeof tc.negativeMode !== 'string' || !VALID_NEGATIVE_MODES.includes(tc.negativeMode as NegativePromptMode)) {
      return false;
    }

    // Check era
    if (typeof tc.era !== 'string' || !Validators.isValidEra(tc.era)) {
      return false;
    }

    // Check optional negativePrompt
    if (tc.negativePrompt !== undefined && typeof tc.negativePrompt !== 'string') {
      return false;
    }

    // If negative mode is 'with-negative', negativePrompt should be present
    if (tc.negativeMode === 'with-negative' && (!tc.negativePrompt || !(tc.negativePrompt as string).trim())) {
      return false;
    }

    return true;
  }

  /**
   * Validate prompt complexity value
   * @param complexity - The complexity value to validate
   * @returns True if the complexity is valid
   */
  static isValidComplexity(complexity: string): complexity is PromptComplexity {
    return VALID_COMPLEXITIES.includes(complexity as PromptComplexity);
  }

  /**
   * Validate negative prompt mode value
   * @param mode - The mode value to validate
   * @returns True if the mode is valid
   */
  static isValidNegativeMode(mode: string): mode is NegativePromptMode {
    return VALID_NEGATIVE_MODES.includes(mode as NegativePromptMode);
  }

  /**
   * Generate a formatted error message
   * @param field - The field name that failed validation
   * @param reason - The reason for the validation failure
   * @returns Formatted error message string
   */
  static getErrorMessage(field: string, reason: string): string {
    return `Validation error for '${field}': ${reason}`;
  }

  /**
   * Validate prompt text
   * @param prompt - The prompt text to validate
   * @returns True if the prompt is valid
   */
  static isValidPrompt(prompt: string): boolean {
    if (typeof prompt !== 'string') {
      return false;
    }

    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length === 0) {
      return false;
    }

    // Maximum prompt length (reasonable limit for image generation)
    const maxPromptLength = 2000;
    if (trimmedPrompt.length > maxPromptLength) {
      return false;
    }

    return true;
  }

  /**
   * Validate image generation parameters
   * @param params - The parameters object to validate
   * @returns True if the parameters are valid
   */
  static isValidParameters(params: unknown): boolean {
    if (params === undefined || params === null) {
      return true; // Optional field, null/undefined is valid
    }

    if (typeof params !== 'object') {
      return false;
    }

    const p = params as Record<string, unknown>;

    // Validate width if present
    if (p.width !== undefined) {
      if (typeof p.width !== 'number' || p.width < 256 || p.width > 2048) {
        return false;
      }
    }

    // Validate height if present
    if (p.height !== undefined) {
      if (typeof p.height !== 'number' || p.height < 256 || p.height > 2048) {
        return false;
      }
    }

    // Validate steps if present
    if (p.steps !== undefined) {
      if (typeof p.steps !== 'number' || p.steps < 1 || p.steps > 150) {
        return false;
      }
    }

    // Validate guidanceScale if present
    if (p.guidanceScale !== undefined) {
      if (typeof p.guidanceScale !== 'number' || p.guidanceScale < 1 || p.guidanceScale > 30) {
        return false;
      }
    }

    // Validate seed if present
    if (p.seed !== undefined) {
      if (typeof p.seed !== 'number' || p.seed < 0) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Collection of validation error messages
 */
export const ValidationErrors = {
  INVALID_ERA: 'Invalid era. Must be one of: goryeo, joseon-early, joseon-mid, joseon-late, japanese-occupation',
  TOPIC_TOO_SHORT: `Topic must be at least ${TOPIC_MIN_LENGTH} characters long`,
  TOPIC_TOO_LONG: `Topic must not exceed ${TOPIC_MAX_LENGTH} characters`,
  TOPIC_INVALID_CHARS: 'Topic contains invalid or potentially harmful characters',
  INVALID_API_KEY: 'Invalid API key format',
  INVALID_TEST_CASE_SET: 'Invalid test case set structure',
  INVALID_TEST_CASE: 'Invalid test case structure',
  INVALID_PROMPT: 'Invalid prompt text',
  INVALID_COMPLEXITY: 'Invalid complexity. Must be either "simple" or "enhanced"',
  INVALID_NEGATIVE_MODE: 'Invalid negative mode. Must be either "with-negative" or "without-negative"',
  MISSING_NEGATIVE_PROMPT: 'Negative prompt is required when mode is "with-negative"',
  INVALID_PARAMETERS: 'Invalid image generation parameters',
} as const;

export type ValidationErrorKey = keyof typeof ValidationErrors;
