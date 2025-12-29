/**
 * Batch Generator for Korean History Educational Materials
 *
 * This module provides batch processing capabilities for generating
 * multiple test cases across different eras and topics simultaneously.
 * It includes parallel processing with configurable limits and
 * comprehensive progress tracking.
 */

import { Era } from '../config/eras.config';
import { TestCaseGenerator, TestCaseSet, GenerationOptions } from './testcase.generator';
import { Logger, createLogger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Configuration for batch generation operations
 */
export interface BatchConfig {
  /** Array of historical eras to generate content for */
  eras: Era[];
  /** Array of topics to cover within each era */
  topics: string[];
  /** Output directory for generated files */
  outputDir: string;
  /** Maximum number of concurrent generation tasks (default: 5) */
  parallelLimit?: number;
  /** Optional generation options to pass to TestCaseGenerator */
  generationOptions?: Partial<GenerationOptions>;
  /** Whether to save individual results to files (default: true) */
  saveToFiles?: boolean;
  /** File naming pattern (default: '{era}_{topic}_{timestamp}') */
  fileNamePattern?: string;
}

/**
 * Result of a batch generation operation
 */
export interface BatchResult {
  /** Total number of test case sets attempted */
  totalSets: number;
  /** Number of successfully generated sets */
  successfulSets: number;
  /** Number of failed generation attempts */
  failedSets: number;
  /** Array of successfully generated test case sets */
  results: TestCaseSet[];
  /** Array of errors encountered during generation */
  errors: BatchError[];
  /** Total duration of the batch operation in milliseconds */
  duration: number;
  /** Timestamp when the batch started */
  startTime: Date;
  /** Timestamp when the batch completed */
  endTime: Date;
}

/**
 * Progress information for ongoing batch operations
 */
export interface BatchProgress {
  /** Current task number (1-indexed) */
  current: number;
  /** Total number of tasks */
  total: number;
  /** Current era being processed */
  currentEra: Era;
  /** Current topic being processed */
  currentTopic: string;
  /** Percentage of completion (0-100) */
  percentage: number;
  /** Number of successful completions so far */
  successCount: number;
  /** Number of failures so far */
  failureCount: number;
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;
}

/**
 * Error information for failed batch tasks
 */
export interface BatchError {
  /** The era where the error occurred */
  era: Era;
  /** The topic where the error occurred */
  topic: string;
  /** Error message */
  message: string;
  /** Original error object */
  error: Error;
  /** Timestamp when the error occurred */
  timestamp: Date;
  /** Task index in the batch */
  taskIndex: number;
}

/**
 * Internal task representation for batch processing
 */
interface BatchTask {
  era: Era;
  topic: string;
  index: number;
}

/**
 * Type for progress callback function
 */
type ProgressCallback = (progress: BatchProgress) => void;

/**
 * Type for error callback function
 */
type ErrorCallback = (error: BatchError) => void;

/**
 * BatchGenerator class for processing multiple Korean history topics in parallel
 *
 * @example
 * ```typescript
 * const generator = new BatchGenerator('your-api-key');
 *
 * generator.onProgress((progress) => {
 *   console.log(`Progress: ${progress.percentage}%`);
 * });
 *
 * generator.onError((error) => {
 *   console.error(`Error in ${error.era}/${error.topic}: ${error.message}`);
 * });
 *
 * const result = await generator.runBatch({
 *   eras: ['goryeo', 'joseon-early'],
 *   topics: ['politics', 'culture', 'economy'],
 *   outputDir: './output',
 *   parallelLimit: 3,
 * });
 *
 * console.log(`Generated ${result.successfulSets} of ${result.totalSets} sets`);
 * ```
 */
export class BatchGenerator {
  private testCaseGenerator: TestCaseGenerator;
  private logger: Logger;
  private progressCallbacks: ProgressCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private isRunning: boolean = false;
  private shouldCancel: boolean = false;

  /**
   * Creates a new BatchGenerator instance
   * @param apiKey - API key for the underlying TestCaseGenerator
   */
  constructor(apiKey: string) {
    this.testCaseGenerator = new TestCaseGenerator(apiKey);
    this.logger = createLogger('BatchGenerator');
  }

  /**
   * Registers a callback to receive progress updates
   * @param callback - Function to call with progress information
   * @returns this instance for method chaining
   */
  onProgress(callback: ProgressCallback): this {
    this.progressCallbacks.push(callback);
    return this;
  }

  /**
   * Registers a callback to receive error notifications
   * @param callback - Function to call when an error occurs
   * @returns this instance for method chaining
   */
  onError(callback: ErrorCallback): this {
    this.errorCallbacks.push(callback);
    return this;
  }

  /**
   * Removes all registered progress callbacks
   */
  clearProgressCallbacks(): void {
    this.progressCallbacks = [];
  }

  /**
   * Removes all registered error callbacks
   */
  clearErrorCallbacks(): void {
    this.errorCallbacks = [];
  }

  /**
   * Cancels the currently running batch operation
   * Note: Already running tasks will complete, but no new tasks will start
   */
  cancel(): void {
    if (this.isRunning) {
      this.shouldCancel = true;
      this.logger.info('Batch cancellation requested');
    }
  }

  /**
   * Checks if a batch operation is currently running
   * @returns true if a batch is in progress
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Executes a batch generation operation
   * @param config - Configuration for the batch operation
   * @returns Promise resolving to the batch result
   * @throws Error if a batch is already running
   */
  async runBatch(config: BatchConfig): Promise<BatchResult> {
    if (this.isRunning) {
      throw new Error('A batch operation is already in progress');
    }

    this.isRunning = true;
    this.shouldCancel = false;
    const startTime = new Date();

    const {
      eras,
      topics,
      outputDir,
      parallelLimit = 5,
      saveToFiles = true,
      fileNamePattern = '{era}_{topic}_{timestamp}',
    } = config;

    // Generate all tasks
    const tasks = this.generateTasks(eras, topics);
    const totalTasks = tasks.length;

    this.logger.info(`Starting batch generation: ${totalTasks} tasks with parallelLimit=${parallelLimit}`);

    // Ensure output directory exists
    if (saveToFiles) {
      await this.ensureOutputDirectory(outputDir);
    }

    const results: TestCaseSet[] = [];
    const errors: BatchError[] = [];
    let completedCount = 0;
    let successCount = 0;
    let failureCount = 0;
    const taskStartTimes: Map<number, number> = new Map();
    let averageTaskDuration = 0;

    // Process tasks in parallel with limit
    const processingPromises: Promise<void>[] = [];
    let taskIndex = 0;

    const processTask = async (task: BatchTask): Promise<void> => {
      if (this.shouldCancel) {
        return;
      }

      const taskStartTime = Date.now();
      taskStartTimes.set(task.index, taskStartTime);

      try {
        this.logger.debug(`Processing task ${task.index + 1}/${totalTasks}: ${task.era}/${task.topic}`);

        // Emit progress before starting
        this.emitProgress({
          current: completedCount + 1,
          total: totalTasks,
          currentEra: task.era,
          currentTopic: task.topic,
          percentage: Math.round((completedCount / totalTasks) * 100),
          successCount,
          failureCount,
          estimatedTimeRemaining: this.calculateEstimatedTime(
            averageTaskDuration,
            totalTasks - completedCount
          ),
        });

        // Generate test cases
        const result = await this.testCaseGenerator.generate(
          task.era,
          task.topic,
          config.generationOptions
        );

        // Save to file if configured
        if (saveToFiles) {
          const fileName = this.generateFileName(fileNamePattern, task.era, task.topic);
          const filePath = path.join(outputDir, `${fileName}.json`);
          await this.saveResultToFile(result, filePath);
        }

        results.push(result);
        successCount++;

        this.logger.debug(`Task ${task.index + 1} completed successfully`);
      } catch (error) {
        const batchError: BatchError = {
          era: task.era,
          topic: task.topic,
          message: error instanceof Error ? error.message : String(error),
          error: error instanceof Error ? error : new Error(String(error)),
          timestamp: new Date(),
          taskIndex: task.index,
        };

        errors.push(batchError);
        failureCount++;
        this.emitError(batchError);

        this.logger.error(`Task ${task.index + 1} failed: ${batchError.message}`);
      } finally {
        completedCount++;
        const taskDuration = Date.now() - taskStartTime;
        averageTaskDuration = this.updateAverageDuration(averageTaskDuration, taskDuration, completedCount);
      }
    };

    // Create a semaphore-like mechanism for parallel processing
    const runWithLimit = async (): Promise<void> => {
      while (taskIndex < tasks.length && !this.shouldCancel) {
        const currentBatch: Promise<void>[] = [];

        // Start up to parallelLimit tasks
        while (currentBatch.length < parallelLimit && taskIndex < tasks.length && !this.shouldCancel) {
          const task = tasks[taskIndex];
          currentBatch.push(processTask(task));
          taskIndex++;
        }

        // Wait for current batch to complete
        await Promise.all(currentBatch);
      }
    };

    await runWithLimit();

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    this.isRunning = false;
    this.shouldCancel = false;

    const batchResult: BatchResult = {
      totalSets: totalTasks,
      successfulSets: successCount,
      failedSets: failureCount,
      results,
      errors,
      duration,
      startTime,
      endTime,
    };

    this.logger.info(
      `Batch completed: ${successCount}/${totalTasks} successful, ${failureCount} failed, duration: ${duration}ms`
    );

    return batchResult;
  }

  /**
   * Generates all task combinations from eras and topics
   */
  private generateTasks(eras: Era[], topics: string[]): BatchTask[] {
    const tasks: BatchTask[] = [];
    let index = 0;

    for (const era of eras) {
      for (const topic of topics) {
        tasks.push({ era, topic, index });
        index++;
      }
    }

    return tasks;
  }

  /**
   * Ensures the output directory exists, creating it if necessary
   */
  private async ensureOutputDirectory(outputDir: string): Promise<void> {
    try {
      await fs.access(outputDir);
    } catch {
      await fs.mkdir(outputDir, { recursive: true });
      this.logger.info(`Created output directory: ${outputDir}`);
    }
  }

  /**
   * Generates a filename based on the pattern
   */
  private generateFileName(pattern: string, era: Era, topic: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedTopic = topic.replace(/[^a-zA-Z0-9가-힣]/g, '_');

    return pattern
      .replace('{era}', era)
      .replace('{topic}', sanitizedTopic)
      .replace('{timestamp}', timestamp);
  }

  /**
   * Saves a result to a JSON file
   */
  private async saveResultToFile(result: TestCaseSet, filePath: string): Promise<void> {
    const content = JSON.stringify(result, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
    this.logger.debug(`Saved result to: ${filePath}`);
  }

  /**
   * Calculates estimated time remaining
   */
  private calculateEstimatedTime(avgDuration: number, remainingTasks: number): number | undefined {
    if (avgDuration <= 0 || remainingTasks <= 0) {
      return undefined;
    }
    return Math.round(avgDuration * remainingTasks);
  }

  /**
   * Updates the running average of task duration
   */
  private updateAverageDuration(
    currentAvg: number,
    newDuration: number,
    count: number
  ): number {
    if (count === 1) {
      return newDuration;
    }
    return currentAvg + (newDuration - currentAvg) / count;
  }

  /**
   * Emits progress to all registered callbacks
   */
  private emitProgress(progress: BatchProgress): void {
    for (const callback of this.progressCallbacks) {
      try {
        callback(progress);
      } catch (error) {
        this.logger.error('Error in progress callback:', error);
      }
    }
  }

  /**
   * Emits error to all registered callbacks
   */
  private emitError(error: BatchError): void {
    for (const callback of this.errorCallbacks) {
      try {
        callback(error);
      } catch (err) {
        this.logger.error('Error in error callback:', err);
      }
    }
  }
}

/**
 * Creates a new BatchGenerator instance
 * @param apiKey - API key for the generation service
 * @returns New BatchGenerator instance
 */
export function createBatchGenerator(apiKey: string): BatchGenerator {
  return new BatchGenerator(apiKey);
}

/**
 * Runs a quick batch generation with default settings
 * @param apiKey - API key for the generation service
 * @param config - Batch configuration
 * @returns Promise resolving to batch result
 */
export async function runQuickBatch(
  apiKey: string,
  config: BatchConfig
): Promise<BatchResult> {
  const generator = new BatchGenerator(apiKey);
  return generator.runBatch(config);
}
