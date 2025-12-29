/**
 * Gemini API Configuration
 *
 * This module provides configuration settings for the Google Gemini API,
 * including API key management, model definitions, and generation parameters.
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Retrieves the Gemini API key from environment variables.
 * @returns The API key string
 * @throws Error if the API key is not configured
 */
export function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. ' +
      'Please set the GEMINI_API_KEY environment variable in your .env file.'
    );
  }

  return apiKey;
}

/**
 * Available Gemini model identifiers
 */
export const GEMINI_MODELS = {
  /** Fast model optimized for quick responses */
  flash: 'gemini-2.0-flash',

  /** Pro model for high-quality outputs */
  pro: 'gemini-1.5-pro',

  /** Deep research model for comprehensive analysis */
  deepResearch: 'deep-research-pro-preview-12-2025',
} as const;

/** Type for available model keys */
export type GeminiModelKey = keyof typeof GEMINI_MODELS;

/** Type for available model values */
export type GeminiModelValue = typeof GEMINI_MODELS[GeminiModelKey];

/**
 * API connection and request configuration
 */
export const API_CONFIG = {
  /** Base URL for Gemini API */
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',

  /** Request timeout settings (in milliseconds) */
  timeout: {
    /** Default timeout for standard requests */
    default: 30000,

    /** Extended timeout for long-running operations */
    extended: 120000,

    /** Timeout for deep research operations */
    deepResearch: 300000,
  },

  /** Retry configuration for failed requests */
  retry: {
    /** Maximum number of retry attempts */
    maxRetries: 3,

    /** Initial delay between retries (in milliseconds) */
    initialDelayMs: 1000,

    /** Maximum delay between retries (in milliseconds) */
    maxDelayMs: 10000,

    /** Multiplier for exponential backoff */
    backoffMultiplier: 2,

    /** HTTP status codes that should trigger a retry */
    retryableStatusCodes: [429, 500, 502, 503, 504],
  },
} as const;

/**
 * Generation configuration for model outputs
 */
export const GENERATION_CONFIG = {
  /**
   * Controls randomness in output generation.
   * Lower values (0.0-0.3): More focused and deterministic
   * Higher values (0.7-1.0): More creative and diverse
   */
  temperature: 0.7,

  /**
   * Nucleus sampling parameter.
   * The model considers tokens with top_p cumulative probability.
   */
  topP: 0.95,

  /**
   * Top-k sampling parameter.
   * The model considers only the top k most probable tokens.
   */
  topK: 40,

  /**
   * Maximum number of tokens to generate in the response.
   */
  maxOutputTokens: 8192,
} as const;

/**
 * Preset configurations for different use cases
 */
export const GENERATION_PRESETS = {
  /** Creative writing and brainstorming */
  creative: {
    temperature: 0.9,
    topP: 0.98,
    topK: 50,
    maxOutputTokens: 8192,
  },

  /** Factual and educational content */
  educational: {
    temperature: 0.5,
    topP: 0.9,
    topK: 30,
    maxOutputTokens: 8192,
  },

  /** Precise and deterministic outputs */
  precise: {
    temperature: 0.2,
    topP: 0.8,
    topK: 20,
    maxOutputTokens: 4096,
  },
} as const;

export type GenerationPresetKey = keyof typeof GENERATION_PRESETS;
