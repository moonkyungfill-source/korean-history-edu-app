import { GoogleGenAI } from "@google/genai";

/**
 * Gemini API 클라이언트 설정 옵션
 */
export interface GeminiClientConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

/**
 * 텍스트 생성 설정 옵션
 */
export interface GenerateContentConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

/**
 * Google Search Grounding 결과
 */
export interface GroundedResponse {
  text: string;
  groundingMetadata?: {
    searchEntryPoint?: {
      renderedContent?: string;
    };
    groundingChunks?: Array<{
      web?: {
        uri?: string;
        title?: string;
      };
    }>;
    groundingSupports?: Array<{
      segment?: {
        startIndex?: number;
        endIndex?: number;
        text?: string;
      };
      groundingChunkIndices?: number[];
      confidenceScores?: number[];
    }>;
    webSearchQueries?: string[];
  };
}

/**
 * Gemini API 에러 클래스
 */
export class GeminiApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = "GeminiApiError";
  }
}

/**
 * 타임아웃 에러 클래스
 */
export class TimeoutError extends Error {
  constructor(message: string = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Gemini API 클라이언트
 *
 * @google/genai 패키지를 사용한 Gemini API 클라이언트입니다.
 * 에러 처리, 재시도 로직, 타임아웃 처리를 포함합니다.
 */
export class GeminiClient {
  private ai: GoogleGenAI;
  private defaultModel: string;
  private maxRetries: number;
  private retryDelayMs: number;
  private timeoutMs: number;

  /**
   * GeminiClient 생성자
   *
   * @param apiKey - Gemini API 키
   * @param model - 사용할 모델 (기본값: gemini-2.0-flash)
   * @param config - 클라이언트 설정
   */
  constructor(
    apiKey: string,
    model: string = "gemini-2.0-flash",
    config: GeminiClientConfig = {}
  ) {
    if (!apiKey) {
      throw new GeminiApiError("API key is required");
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.defaultModel = model;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  /**
   * 지정된 시간만큼 대기
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 타임아웃을 적용한 Promise 실행
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new TimeoutError()), timeoutMs)
      ),
    ]);
  }

  /**
   * 재시도 가능한 에러인지 확인
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof TimeoutError) {
      return true;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // 일시적인 에러 패턴
      const retryablePatterns = [
        "rate limit",
        "quota exceeded",
        "too many requests",
        "service unavailable",
        "internal server error",
        "503",
        "429",
        "500",
        "timeout",
        "network error",
        "econnreset",
        "econnrefused",
      ];

      return retryablePatterns.some((pattern) => message.includes(pattern));
    }

    return false;
  }

  /**
   * 재시도 로직을 포함한 API 호출 실행
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.withTimeout(operation(), this.timeoutMs);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === this.maxRetries;

        if (!isRetryable || isLastAttempt) {
          throw new GeminiApiError(
            `${operationName} failed: ${lastError.message}`,
            undefined,
            isRetryable
          );
        }

        // 지수 백오프를 적용한 재시도 대기
        const backoffDelay = this.retryDelayMs * Math.pow(2, attempt - 1);
        console.warn(
          `${operationName} attempt ${attempt} failed, retrying in ${backoffDelay}ms...`
        );
        await this.delay(backoffDelay);
      }
    }

    throw new GeminiApiError(
      `${operationName} failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      undefined,
      false
    );
  }

  /**
   * 기본 텍스트 생성
   *
   * @param prompt - 생성할 텍스트의 프롬프트
   * @param config - 생성 설정 (temperature, topP 등)
   * @returns 생성된 텍스트
   */
  async generateContent(
    prompt: string,
    config?: GenerateContentConfig
  ): Promise<string> {
    if (!prompt || prompt.trim().length === 0) {
      throw new GeminiApiError("Prompt cannot be empty");
    }

    return this.executeWithRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: config
          ? {
              temperature: config.temperature,
              topP: config.topP,
              topK: config.topK,
              maxOutputTokens: config.maxOutputTokens,
              stopSequences: config.stopSequences,
            }
          : undefined,
      });

      const text = response.text;
      if (!text) {
        throw new GeminiApiError("Empty response from Gemini API");
      }

      return text;
    }, "generateContent");
  }

  /**
   * Google Search Grounding 활성화된 생성
   *
   * Google 검색을 통해 최신 정보를 기반으로 응답을 생성합니다.
   *
   * @param prompt - 생성할 텍스트의 프롬프트
   * @returns 생성된 텍스트와 grounding 메타데이터
   */
  async generateWithSearchGrounding(prompt: string): Promise<GroundedResponse> {
    if (!prompt || prompt.trim().length === 0) {
      throw new GeminiApiError("Prompt cannot be empty");
    }

    return this.executeWithRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      if (!text) {
        throw new GeminiApiError("Empty response from Gemini API");
      }

      // grounding 메타데이터 추출
      const groundingMetadata =
        response.candidates?.[0]?.groundingMetadata ?? undefined;

      return {
        text,
        groundingMetadata,
      };
    }, "generateWithSearchGrounding");
  }

  /**
   * 스트리밍 텍스트 생성
   *
   * 텍스트를 청크 단위로 스트리밍하여 생성합니다.
   *
   * @param prompt - 생성할 텍스트의 프롬프트
   * @yields 생성된 텍스트 청크
   */
  async *generateContentStream(prompt: string): AsyncGenerator<string> {
    if (!prompt || prompt.trim().length === 0) {
      throw new GeminiApiError("Prompt cannot be empty");
    }

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.withTimeout(
          this.ai.models.generateContentStream({
            model: this.defaultModel,
            contents: prompt,
          }),
          this.timeoutMs
        );

        for await (const chunk of response) {
          const text = chunk.text;
          if (text) {
            yield text;
          }
        }

        return; // 성공적으로 완료
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === this.maxRetries;

        if (!isRetryable || isLastAttempt) {
          throw new GeminiApiError(
            `generateContentStream failed: ${lastError.message}`,
            undefined,
            isRetryable
          );
        }

        // 지수 백오프를 적용한 재시도 대기
        const backoffDelay = this.retryDelayMs * Math.pow(2, attempt - 1);
        console.warn(
          `generateContentStream attempt ${attempt} failed, retrying in ${backoffDelay}ms...`
        );
        await this.delay(backoffDelay);
      }
    }

    throw new GeminiApiError(
      `generateContentStream failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      undefined,
      false
    );
  }

  /**
   * 현재 사용 중인 모델 이름 반환
   */
  getModelName(): string {
    return this.defaultModel;
  }

  /**
   * 모델 변경
   */
  setModel(model: string): void {
    this.defaultModel = model;
  }
}

/**
 * 환경 변수에서 API 키를 읽어 GeminiClient 인스턴스 생성
 */
export function createGeminiClient(
  model?: string,
  config?: GeminiClientConfig
): GeminiClient {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiApiError(
      "GEMINI_API_KEY environment variable is not set"
    );
  }

  return new GeminiClient(apiKey, model, config);
}
