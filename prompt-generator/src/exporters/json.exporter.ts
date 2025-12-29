/**
 * JSON Exporter for Korean History Test Case Sets
 *
 * Exports test case sets to JSON format for use in prompt testing
 * and evaluation workflows.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Korean Historical Era Types
 */
export type Era =
  | 'three-kingdoms'
  | 'unified-silla'
  | 'goryeo'
  | 'joseon-early'
  | 'joseon-mid'
  | 'joseon-late'
  | 'korean-empire'
  | 'japanese-occupation';

/**
 * Difficulty levels for test cases
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Individual test case structure
 */
export interface TestCase {
  id: string;
  prompt: string;
  negativePrompt?: string;
  expectedElements: string[];
  forbiddenElements: string[];
  difficulty: Difficulty;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Test case set containing multiple test cases for a specific era/topic
 */
export interface TestCaseSet {
  id: string;
  name: string;
  description: string;
  era: Era;
  topic?: string;
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
  version: string;
  metadata?: Record<string, unknown>;
}

/**
 * Export result containing file path and statistics
 */
export interface ExportResult {
  filePath: string;
  testCaseCount: number;
  exportedAt: string;
}

/**
 * JSON Exporter class for exporting test case sets to JSON files
 */
export class JsonExporter {
  private outputDir: string;

  /**
   * Creates a new JsonExporter instance
   * @param outputDir - Directory path for output files. Defaults to 'output/prompts/'
   */
  constructor(outputDir?: string) {
    this.outputDir = outputDir || path.join(process.cwd(), 'output', 'prompts');
  }

  /**
   * Ensures the output directory exists, creating it if necessary
   */
  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  /**
   * Exports a single test case set to a JSON file
   * @param testCaseSet - The test case set to export
   * @returns Promise resolving to the file path of the exported file
   */
  async exportTestCaseSet(testCaseSet: TestCaseSet): Promise<string> {
    await this.ensureOutputDir();

    const filename = this.generateFilename(testCaseSet.era, testCaseSet.topic);
    const filePath = path.join(this.outputDir, filename);

    const exportData = {
      ...testCaseSet,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0.0',
    };

    const jsonContent = this.formatJson(exportData);
    await fs.writeFile(filePath, jsonContent, 'utf-8');

    return filePath;
  }

  /**
   * Exports multiple test case sets to a single JSON file
   * @param testCaseSets - Array of test case sets to export
   * @param filename - Optional custom filename. If not provided, generates one with timestamp
   * @returns Promise resolving to the file path of the exported file
   */
  async exportMultipleSets(
    testCaseSets: TestCaseSet[],
    filename?: string
  ): Promise<string> {
    await this.ensureOutputDir();

    const timestamp = this.getTimestamp();
    const outputFilename = filename || `test-sets-combined-${timestamp}.json`;
    const filePath = path.join(this.outputDir, outputFilename);

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0.0',
      totalSets: testCaseSets.length,
      totalTestCases: testCaseSets.reduce(
        (sum, set) => sum + set.testCases.length,
        0
      ),
      testCaseSets: testCaseSets.map((set) => ({
        ...set,
        exportedAt: new Date().toISOString(),
      })),
    };

    const jsonContent = this.formatJson(exportData);
    await fs.writeFile(filePath, jsonContent, 'utf-8');

    return filePath;
  }

  /**
   * Exports test case sets grouped by era to separate files
   * @param testCaseSets - Array of test case sets to export
   * @returns Promise resolving to a Map of Era to file path
   */
  async exportByEra(testCaseSets: TestCaseSet[]): Promise<Map<Era, string>> {
    await this.ensureOutputDir();

    // Group test case sets by era
    const groupedByEra = new Map<Era, TestCaseSet[]>();

    for (const testCaseSet of testCaseSets) {
      const existing = groupedByEra.get(testCaseSet.era) || [];
      existing.push(testCaseSet);
      groupedByEra.set(testCaseSet.era, existing);
    }

    // Export each era group to a separate file
    const resultMap = new Map<Era, string>();

    for (const [era, sets] of groupedByEra.entries()) {
      const timestamp = this.getTimestamp();
      const filename = `test-set-${era}-${timestamp}.json`;
      const filePath = path.join(this.outputDir, filename);

      const exportData = {
        era,
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0.0',
        totalSets: sets.length,
        totalTestCases: sets.reduce((sum, set) => sum + set.testCases.length, 0),
        testCaseSets: sets.map((set) => ({
          ...set,
          exportedAt: new Date().toISOString(),
        })),
      };

      const jsonContent = this.formatJson(exportData);
      await fs.writeFile(filePath, jsonContent, 'utf-8');

      resultMap.set(era, filePath);
    }

    return resultMap;
  }

  /**
   * Generates a filename based on era, optional topic, and timestamp
   * @param era - The historical era
   * @param topic - Optional topic for the test case set
   * @returns Generated filename string
   */
  private generateFilename(era: Era, topic?: string): string {
    const timestamp = this.getTimestamp();
    const sanitizedTopic = topic
      ? `-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      : '';

    return `test-set-${era}${sanitizedTopic}-${timestamp}.json`;
  }

  /**
   * Formats data as pretty-printed JSON
   * @param data - Data to format as JSON
   * @returns Formatted JSON string with 2-space indentation
   */
  private formatJson(data: unknown): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Generates a timestamp string for filenames
   * Format: YYYYMMDD-HHmmss
   * @returns Formatted timestamp string
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * Gets the current output directory path
   * @returns The output directory path
   */
  getOutputDir(): string {
    return this.outputDir;
  }

  /**
   * Sets a new output directory path
   * @param newOutputDir - The new output directory path
   */
  setOutputDir(newOutputDir: string): void {
    this.outputDir = newOutputDir;
  }
}

/**
 * Default export instance with default output directory
 */
export const jsonExporter = new JsonExporter();

/**
 * Factory function to create a new JsonExporter with custom output directory
 * @param outputDir - Custom output directory path
 * @returns New JsonExporter instance
 */
export function createJsonExporter(outputDir?: string): JsonExporter {
  return new JsonExporter(outputDir);
}
