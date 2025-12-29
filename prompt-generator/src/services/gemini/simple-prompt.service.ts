/**
 * Simple Prompt Service for Middle School Level
 *
 * This service generates simple, easy-to-understand prompts for image generation
 * targeting middle school students learning Korean history.
 *
 * Key characteristics:
 * - Concise English sentences (under 50 words)
 * - Simple vocabulary suitable for middle school level
 * - Era name and basic scene description only
 * - No detailed historical authentication elements
 */

import { GoogleGenAI } from '@google/genai';
import { Era } from '../../types';
import { ERA_INFO } from '../../config/eras.config';
import { GEMINI_MODELS, GENERATION_PRESETS } from '../../config/api.config';

/**
 * GeminiClient - Wrapper for Google Gemini API
 */
export class GeminiClient {
  private client: GoogleGenAI;
  private modelId: string;

  /**
   * Creates a new GeminiClient instance
   * @param apiKey - Google Gemini API key
   * @param modelId - Model identifier (default: gemini-2.0-flash)
   */
  constructor(apiKey: string, modelId: string = GEMINI_MODELS.flash) {
    this.client = new GoogleGenAI({ apiKey });
    this.modelId = modelId;
  }

  /**
   * Generates content using the Gemini model
   * @param systemPrompt - System instruction for the model
   * @param userPrompt - User's input prompt
   * @returns Generated text content
   */
  async generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.modelId,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: GENERATION_PRESETS.educational.temperature,
        topP: GENERATION_PRESETS.educational.topP,
        topK: GENERATION_PRESETS.educational.topK,
        maxOutputTokens: 256,
      },
    });

    return response.text || '';
  }
}

/**
 * SimplePromptService - Generates middle school level prompts
 *
 * This service creates simple, concise prompts suitable for
 * middle school students studying Korean history.
 */
export class SimplePromptService {
  private geminiClient: GeminiClient;

  /**
   * Creates a new SimplePromptService instance
   * @param apiKey - Google Gemini API key
   */
  constructor(apiKey: string) {
    this.geminiClient = new GeminiClient(apiKey);
  }

  /**
   * Generates a simple prompt for the specified era and topic
   *
   * @param era - Historical era (e.g., 'joseon-late', 'goryeo')
   * @param topic - Topic or scene description in Korean
   * @returns Promise<string> - Simple English prompt under 50 words
   *
   * @example
   * const prompt = await service.generateSimplePrompt('joseon-late', '양반 여인의 봄나들이');
   * // Returns: "A noble woman from Late Joseon Dynasty enjoying a spring outing, traditional Korean setting"
   */
  async generateSimplePrompt(era: Era, topic: string): Promise<string> {
    const eraInfo = ERA_INFO[era];
    const systemPrompt = this.getSystemPrompt();

    const userPrompt = `
Era: ${eraInfo.nameEn} (${eraInfo.period})
Topic: ${topic}

Generate a simple image generation prompt.
`.trim();

    const response = await this.geminiClient.generateContent(systemPrompt, userPrompt);

    // Clean up the response - remove quotes and extra whitespace
    return this.cleanResponse(response);
  }

  /**
   * Returns the system prompt for middle school level prompt generation
   *
   * System prompt conditions:
   * - Concise English sentences under 50 words
   * - Simple vocabulary for middle school comprehension
   * - Era name and basic scene description only
   * - No detailed historical authentication elements
   *
   * @returns System prompt string
   */
  private getSystemPrompt(): string {
    return `You are a prompt writer for educational image generation.

Rules:
1. Write under 50 words in simple English
2. Use vocabulary a middle school student can understand
3. Include only the era name and basic scene description
4. Do not include detailed historical elements or technical terms
5. Output only the prompt text, no explanations
6. Focus on the main subject and setting
7. Keep the tone friendly and accessible

Example output format:
"A noble woman from Late Joseon Dynasty enjoying a spring outing, traditional Korean setting"`;
  }

  /**
   * Cleans the response by removing quotes and extra whitespace
   * @param response - Raw response from Gemini
   * @returns Cleaned prompt string
   */
  private cleanResponse(response: string): string {
    return response
      .trim()
      .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}

export default SimplePromptService;
