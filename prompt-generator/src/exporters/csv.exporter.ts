/**
 * CSV Exporter for Korean History Test Case Sets
 *
 * Exports test case sets to CSV format for spreadsheet analysis,
 * data processing, and integration with external tools.
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
 * Era display names for CSV output
 */
const ERA_DISPLAY_NAMES: Record<Era, string> = {
  'three-kingdoms': '삼국시대 (Three Kingdoms)',
  'unified-silla': '통일신라 (Unified Silla)',
  'goryeo': '고려시대 (Goryeo Dynasty)',
  'joseon-early': '조선 전기 (Early Joseon)',
  'joseon-mid': '조선 중기 (Mid Joseon)',
  'joseon-late': '조선 후기 (Late Joseon)',
  'korean-empire': '대한제국 (Korean Empire)',
  'japanese-occupation': '일제강점기 (Japanese Occupation)',
};

/**
 * Difficulty levels for test cases
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Complexity levels for prompts
 */
export type Complexity = 'simple' | 'enhanced';

/**
 * Negative prompt mode
 */
export type NegativeMode = 'with-negative' | 'without-negative';

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
  complexity?: Complexity;
  negativeMode?: NegativeMode;
  deepResearchUsed?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt?: string;
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
 * CSV Export Options
 */
export interface CsvExportOptions {
  /** Include header row */
  includeHeaders?: boolean;
  /** Field delimiter (default: comma) */
  delimiter?: string;
  /** Line ending (default: \n) */
  lineEnding?: string;
  /** Include BOM for Excel compatibility */
  includeBom?: boolean;
}

/**
 * CSV Exporter class for exporting test case sets to CSV files
 */
export class CsvExporter {
  private outputDir: string;

  /**
   * Creates a new CsvExporter instance
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
   * Exports test case sets to a CSV file
   * @param testCaseSets - Array of test case sets to export
   * @param filename - Optional custom filename. If not provided, generates one with timestamp
   * @returns Promise resolving to the file path of the exported file
   */
  async exportToCsv(
    testCaseSets: TestCaseSet[],
    filename?: string
  ): Promise<string> {
    await this.ensureOutputDir();

    const timestamp = this.getTimestamp();
    const outputFilename = filename || `test-cases-${timestamp}.csv`;
    const filePath = path.join(this.outputDir, outputFilename);

    // Build CSV content
    const headers = this.getHeaders();
    const rows: string[][] = [headers];

    // Process each test case set
    for (const testCaseSet of testCaseSets) {
      let caseNumber = 1;
      for (const testCase of testCaseSet.testCases) {
        const row = this.testCaseToRow(
          testCaseSet.id,
          testCaseSet.era,
          testCaseSet.topic || '',
          testCase,
          caseNumber
        );
        rows.push(row);
        caseNumber++;
      }
    }

    // Convert rows to CSV string
    const csvContent = this.rowsToCsvString(rows);

    // Write to file with BOM for Excel compatibility
    const bom = '\uFEFF';
    await fs.writeFile(filePath, bom + csvContent, 'utf-8');

    return filePath;
  }

  /**
   * Gets the CSV column headers
   * @returns Array of header strings
   */
  private getHeaders(): string[] {
    return [
      'id',
      'era',
      'era_name',
      'topic',
      'case_number',
      'complexity',
      'negative_mode',
      'base_prompt',
      'negative_prompt',
      'final_prompt',
      'prompt_length',
      'negative_keywords_count',
      'deep_research_used',
      'created_at',
    ];
  }

  /**
   * Converts a test case to a CSV row
   * @param setId - The test case set ID
   * @param era - The historical era
   * @param topic - The topic of the test case set
   * @param testCase - The test case to convert
   * @param caseNumber - The sequential case number within the set
   * @returns Array of string values for the CSV row
   */
  private testCaseToRow(
    setId: string,
    era: Era,
    topic: string,
    testCase: TestCase,
    caseNumber: number
  ): string[] {
    // Determine complexity from test case or infer from prompt length
    const complexity = testCase.complexity || this.inferComplexity(testCase.prompt);

    // Determine negative mode
    const negativeMode = testCase.negativeMode ||
      (testCase.negativePrompt ? 'with-negative' : 'without-negative');

    // Calculate base prompt (without negative prompt embedded)
    const basePrompt = testCase.prompt;

    // Calculate final prompt (could include negative prompt context)
    const finalPrompt = testCase.negativePrompt
      ? `${testCase.prompt}\n[Negative: ${testCase.negativePrompt}]`
      : testCase.prompt;

    // Count negative keywords
    const negativeKeywordsCount = testCase.negativePrompt
      ? testCase.negativePrompt.split(',').length
      : 0;

    // Get era display name
    const eraName = ERA_DISPLAY_NAMES[era] || era;

    return [
      testCase.id,
      era,
      eraName,
      topic,
      String(caseNumber),
      complexity,
      negativeMode,
      basePrompt,
      testCase.negativePrompt || '',
      finalPrompt,
      String(testCase.prompt.length),
      String(negativeKeywordsCount),
      String(testCase.deepResearchUsed ?? false),
      testCase.createdAt || new Date().toISOString(),
    ];
  }

  /**
   * Infers complexity from prompt characteristics
   * @param prompt - The prompt text to analyze
   * @returns Inferred complexity level
   */
  private inferComplexity(prompt: string): Complexity {
    // Simple heuristic: enhanced prompts tend to be longer and more detailed
    const wordCount = prompt.split(/\s+/).length;
    const hasDetailedDescriptors = /\b(detailed|intricate|elaborate|authentic|traditional|historical)\b/i.test(prompt);

    if (wordCount > 50 || hasDetailedDescriptors) {
      return 'enhanced';
    }
    return 'simple';
  }

  /**
   * Escapes a value for CSV format
   * Handles quotes, commas, and newlines according to RFC 4180
   * @param value - The string value to escape
   * @returns Escaped string suitable for CSV
   */
  private escapeCSV(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // Check if value contains special characters that require quoting
    const needsQuoting = /[",\n\r]/.test(stringValue);

    if (needsQuoting) {
      // Double up any existing quotes and wrap in quotes
      const escaped = stringValue.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return stringValue;
  }

  /**
   * Converts a 2D array of values to a CSV string
   * @param rows - Array of row arrays
   * @returns CSV formatted string
   */
  private rowsToCsvString(rows: string[][]): string {
    return rows
      .map((row) => row.map((cell) => this.escapeCSV(cell)).join(','))
      .join('\n');
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

  /**
   * Exports test case sets grouped by era to separate CSV files
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
      const filename = `test-cases-${era}-${timestamp}.csv`;
      const filePath = await this.exportToCsv(sets, filename);
      resultMap.set(era, filePath);
    }

    return resultMap;
  }

  /**
   * Exports a summary statistics CSV
   * @param testCaseSets - Array of test case sets to analyze
   * @param filename - Optional custom filename
   * @returns Promise resolving to the file path of the exported summary
   */
  async exportSummary(
    testCaseSets: TestCaseSet[],
    filename?: string
  ): Promise<string> {
    await this.ensureOutputDir();

    const timestamp = this.getTimestamp();
    const outputFilename = filename || `test-cases-summary-${timestamp}.csv`;
    const filePath = path.join(this.outputDir, outputFilename);

    // Build summary headers
    const headers = [
      'era',
      'era_name',
      'total_sets',
      'total_cases',
      'simple_cases',
      'enhanced_cases',
      'with_negative',
      'without_negative',
      'avg_prompt_length',
      'deep_research_count',
    ];

    const rows: string[][] = [headers];

    // Group by era for summary
    const groupedByEra = new Map<Era, TestCaseSet[]>();
    for (const testCaseSet of testCaseSets) {
      const existing = groupedByEra.get(testCaseSet.era) || [];
      existing.push(testCaseSet);
      groupedByEra.set(testCaseSet.era, existing);
    }

    // Calculate summary for each era
    for (const [era, sets] of groupedByEra.entries()) {
      const allCases = sets.flatMap((s) => s.testCases);
      const totalCases = allCases.length;

      const simpleCases = allCases.filter(
        (c) => (c.complexity || this.inferComplexity(c.prompt)) === 'simple'
      ).length;

      const enhancedCases = totalCases - simpleCases;

      const withNegative = allCases.filter((c) => c.negativePrompt).length;
      const withoutNegative = totalCases - withNegative;

      const avgPromptLength = totalCases > 0
        ? Math.round(
            allCases.reduce((sum, c) => sum + c.prompt.length, 0) / totalCases
          )
        : 0;

      const deepResearchCount = allCases.filter((c) => c.deepResearchUsed).length;

      rows.push([
        era,
        ERA_DISPLAY_NAMES[era] || era,
        String(sets.length),
        String(totalCases),
        String(simpleCases),
        String(enhancedCases),
        String(withNegative),
        String(withoutNegative),
        String(avgPromptLength),
        String(deepResearchCount),
      ]);
    }

    // Convert rows to CSV string
    const csvContent = this.rowsToCsvString(rows);

    // Write to file with BOM for Excel compatibility
    const bom = '\uFEFF';
    await fs.writeFile(filePath, bom + csvContent, 'utf-8');

    return filePath;
  }
}

/**
 * Default export instance with default output directory
 */
export const csvExporter = new CsvExporter();

/**
 * Factory function to create a new CsvExporter with custom output directory
 * @param outputDir - Custom output directory path
 * @returns New CsvExporter instance
 */
export function createCsvExporter(outputDir?: string): CsvExporter {
  return new CsvExporter(outputDir);
}
