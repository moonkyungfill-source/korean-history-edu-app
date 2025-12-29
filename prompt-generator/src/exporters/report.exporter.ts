/**
 * Korean History Prompt Generator - Report Exporter
 *
 * Generates comparison analysis reports for test case sets
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TestCaseSet, TestCase, Era } from '../types';

/**
 * Era display names in Korean
 */
const ERA_DISPLAY_NAMES: Record<Era, string> = {
  'goryeo': '고려시대',
  'joseon-early': '조선 전기',
  'joseon-mid': '조선 중기',
  'joseon-late': '조선 후기',
  'japanese-occupation': '일제강점기',
};

/**
 * Report Exporter class for generating comparison analysis reports
 */
export class ReportExporter {
  private outputDir: string;

  /**
   * Creates a new ReportExporter instance
   * @param outputDir - Output directory for reports (default: output/reports/)
   */
  constructor(outputDir?: string) {
    this.outputDir = outputDir || path.join(process.cwd(), 'output', 'reports');
  }

  /**
   * Generates a report for a single test case set
   * @param testCaseSet - The test case set to generate report for
   * @returns Path to the generated report file
   */
  async generateReport(testCaseSet: TestCaseSet): Promise<string> {
    // Ensure output directory exists
    await this.ensureOutputDir();

    // Build the markdown report
    const reportContent = this.buildMarkdownReport(testCaseSet);

    // Generate filename with era and timestamp
    const era = testCaseSet.simpleWithoutNegative.era;
    const timestamp = this.getTimestamp();
    const filename = `report-${era}-${timestamp}.md`;
    const filepath = path.join(this.outputDir, filename);

    // Write the report file
    await fs.writeFile(filepath, reportContent, 'utf-8');

    return filepath;
  }

  /**
   * Generates a summary report for multiple test case sets
   * @param testCaseSets - Array of test case sets
   * @returns Path to the generated summary report file
   */
  async generateSummaryReport(testCaseSets: TestCaseSet[]): Promise<string> {
    // Ensure output directory exists
    await this.ensureOutputDir();

    // Build summary report content
    const timestamp = this.getTimestamp();
    let content = this.buildSummaryHeader(testCaseSets.length, timestamp);

    // Add individual test set sections
    for (let i = 0; i < testCaseSets.length; i++) {
      content += `\n---\n\n`;
      content += `## ${i + 1}. `;
      content += this.buildMarkdownReport(testCaseSets[i], false);
    }

    // Add statistics section
    content += `\n---\n\n`;
    content += this.buildStatisticsSection(testCaseSets);

    // Add overall conclusion
    content += this.buildOverallConclusion(testCaseSets);

    // Generate filename
    const filename = `summary-report-${timestamp}.md`;
    const filepath = path.join(this.outputDir, filename);

    // Write the report file
    await fs.writeFile(filepath, content, 'utf-8');

    return filepath;
  }

  /**
   * Builds the complete markdown report for a test case set
   * @param testCaseSet - The test case set
   * @param includeHeader - Whether to include the main header
   * @returns Markdown formatted report string
   */
  private buildMarkdownReport(testCaseSet: TestCaseSet, includeHeader: boolean = true): string {
    const era = testCaseSet.simpleWithoutNegative.era;
    const eraDisplayName = ERA_DISPLAY_NAMES[era] || era;
    const createdAt = testCaseSet.simpleWithoutNegative.createdAt || new Date();

    let content = '';

    // Header section
    if (includeHeader) {
      content += `# 프롬프트 비교 분석 리포트\n\n`;
    }

    // Test information section
    content += `## 테스트 정보\n\n`;
    content += `| 항목 | 내용 |\n`;
    content += `|------|------|\n`;
    content += `| **시대** | ${eraDisplayName} |\n`;
    content += `| **주제** | ${this.extractSubject(testCaseSet)} |\n`;
    content += `| **생성일** | ${this.formatDate(createdAt)} |\n`;
    content += `| **테스트 케이스 수** | 4개 |\n\n`;

    // Comparison section
    content += this.buildComparisonSection(testCaseSet);

    // Prompt length comparison
    content += this.buildPromptLengthSection(testCaseSet);

    // Expected results analysis
    content += this.buildExpectedResultsSection(testCaseSet);

    // Conclusion
    content += this.buildConclusionSection(testCaseSet);

    return content;
  }

  /**
   * Builds the comparison section with a table of all 4 cases
   * @param testCaseSet - The test case set
   * @returns Markdown formatted comparison section
   */
  private buildComparisonSection(testCaseSet: TestCaseSet): string {
    let content = `## 4가지 케이스 비교 표\n\n`;

    // Create comparison table
    content += `| 구분 | 단순 프롬프트 | 상세 프롬프트 |\n`;
    content += `|------|---------------|---------------|\n`;
    content += `| **네거티브 없음** | ${this.getTestCaseSummary(testCaseSet.simpleWithoutNegative)} | ${this.getTestCaseSummary(testCaseSet.enhancedWithoutNegative)} |\n`;
    content += `| **네거티브 있음** | ${this.getTestCaseSummary(testCaseSet.simpleWithNegative)} | ${this.getTestCaseSummary(testCaseSet.enhancedWithNegative)} |\n\n`;

    // Detailed prompts section
    content += `### 상세 프롬프트 내용\n\n`;

    content += `#### Case 1: 단순 프롬프트 (네거티브 없음)\n`;
    content += `\`\`\`\n${testCaseSet.simpleWithoutNegative.prompt}\n\`\`\`\n\n`;

    content += `#### Case 2: 단순 프롬프트 (네거티브 있음)\n`;
    content += `**프롬프트:**\n\`\`\`\n${testCaseSet.simpleWithNegative.prompt}\n\`\`\`\n`;
    if (testCaseSet.simpleWithNegative.negativePrompt) {
      content += `**네거티브 프롬프트:**\n\`\`\`\n${testCaseSet.simpleWithNegative.negativePrompt}\n\`\`\`\n\n`;
    }

    content += `#### Case 3: 상세 프롬프트 (네거티브 없음)\n`;
    content += `\`\`\`\n${testCaseSet.enhancedWithoutNegative.prompt}\n\`\`\`\n\n`;

    content += `#### Case 4: 상세 프롬프트 (네거티브 있음)\n`;
    content += `**프롬프트:**\n\`\`\`\n${testCaseSet.enhancedWithNegative.prompt}\n\`\`\`\n`;
    if (testCaseSet.enhancedWithNegative.negativePrompt) {
      content += `**네거티브 프롬프트:**\n\`\`\`\n${testCaseSet.enhancedWithNegative.negativePrompt}\n\`\`\`\n\n`;
    }

    return content;
  }

  /**
   * Builds the statistics section for multiple test case sets
   * @param testCaseSets - Array of test case sets
   * @returns Markdown formatted statistics section
   */
  private buildStatisticsSection(testCaseSets: TestCaseSet[]): string {
    let content = `## 통계 분석\n\n`;

    // Calculate statistics
    const stats = this.calculateStatistics(testCaseSets);

    content += `### 전체 통계\n\n`;
    content += `| 항목 | 값 |\n`;
    content += `|------|----|\n`;
    content += `| 총 테스트 세트 수 | ${testCaseSets.length}개 |\n`;
    content += `| 총 테스트 케이스 수 | ${testCaseSets.length * 4}개 |\n`;
    content += `| 평균 단순 프롬프트 길이 | ${stats.avgSimpleLength}자 |\n`;
    content += `| 평균 상세 프롬프트 길이 | ${stats.avgEnhancedLength}자 |\n`;
    content += `| 평균 네거티브 프롬프트 길이 | ${stats.avgNegativeLength}자 |\n`;
    content += `| 상세/단순 비율 | ${stats.enhancedToSimpleRatio.toFixed(2)}배 |\n\n`;

    // Era distribution
    content += `### 시대별 분포\n\n`;
    content += `| 시대 | 테스트 세트 수 |\n`;
    content += `|------|----------------|\n`;
    for (const [era, count] of Object.entries(stats.eraDistribution)) {
      const displayName = ERA_DISPLAY_NAMES[era as Era] || era;
      content += `| ${displayName} | ${count}개 |\n`;
    }
    content += `\n`;

    // Prompt length chart (text-based)
    content += `### 프롬프트 길이 비교 차트\n\n`;
    content += `\`\`\`\n`;
    content += `단순 프롬프트:     ${'█'.repeat(Math.round(stats.avgSimpleLength / 20))} (${stats.avgSimpleLength}자)\n`;
    content += `상세 프롬프트:     ${'█'.repeat(Math.round(stats.avgEnhancedLength / 20))} (${stats.avgEnhancedLength}자)\n`;
    content += `네거티브 프롬프트: ${'█'.repeat(Math.round(stats.avgNegativeLength / 20))} (${stats.avgNegativeLength}자)\n`;
    content += `\`\`\`\n\n`;

    return content;
  }

  /**
   * Builds the prompt length comparison section
   * @param testCaseSet - The test case set
   * @returns Markdown formatted prompt length section
   */
  private buildPromptLengthSection(testCaseSet: TestCaseSet): string {
    let content = `## 프롬프트 길이 비교\n\n`;

    const lengths = {
      simpleWithoutNegative: testCaseSet.simpleWithoutNegative.prompt.length,
      simpleWithNegative: testCaseSet.simpleWithNegative.prompt.length,
      enhancedWithoutNegative: testCaseSet.enhancedWithoutNegative.prompt.length,
      enhancedWithNegative: testCaseSet.enhancedWithNegative.prompt.length,
      negativeSimple: testCaseSet.simpleWithNegative.negativePrompt?.length || 0,
      negativeEnhanced: testCaseSet.enhancedWithNegative.negativePrompt?.length || 0,
    };

    content += `| 케이스 | 프롬프트 길이 | 네거티브 길이 | 총 길이 |\n`;
    content += `|--------|---------------|---------------|----------|\n`;
    content += `| Case 1 (단순/네거티브 없음) | ${lengths.simpleWithoutNegative}자 | - | ${lengths.simpleWithoutNegative}자 |\n`;
    content += `| Case 2 (단순/네거티브 있음) | ${lengths.simpleWithNegative}자 | ${lengths.negativeSimple}자 | ${lengths.simpleWithNegative + lengths.negativeSimple}자 |\n`;
    content += `| Case 3 (상세/네거티브 없음) | ${lengths.enhancedWithoutNegative}자 | - | ${lengths.enhancedWithoutNegative}자 |\n`;
    content += `| Case 4 (상세/네거티브 있음) | ${lengths.enhancedWithNegative}자 | ${lengths.negativeEnhanced}자 | ${lengths.enhancedWithNegative + lengths.negativeEnhanced}자 |\n\n`;

    // Ratio analysis
    const simpleAvg = (lengths.simpleWithoutNegative + lengths.simpleWithNegative) / 2;
    const enhancedAvg = (lengths.enhancedWithoutNegative + lengths.enhancedWithNegative) / 2;
    const ratio = enhancedAvg / simpleAvg;

    content += `**분석:**\n`;
    content += `- 상세 프롬프트는 단순 프롬프트 대비 약 **${ratio.toFixed(2)}배** 더 긴 내용을 포함합니다.\n`;
    content += `- 네거티브 프롬프트 추가 시 전체 토큰 사용량이 증가합니다.\n\n`;

    return content;
  }

  /**
   * Builds the expected results analysis section
   * @param testCaseSet - The test case set
   * @returns Markdown formatted expected results section
   */
  private buildExpectedResultsSection(testCaseSet: TestCaseSet): string {
    let content = `## 예상 결과 분석\n\n`;

    const cases = [
      { name: 'Case 1 (단순/네거티브 없음)', testCase: testCaseSet.simpleWithoutNegative },
      { name: 'Case 2 (단순/네거티브 있음)', testCase: testCaseSet.simpleWithNegative },
      { name: 'Case 3 (상세/네거티브 없음)', testCase: testCaseSet.enhancedWithoutNegative },
      { name: 'Case 4 (상세/네거티브 있음)', testCase: testCaseSet.enhancedWithNegative },
    ];

    for (const { name, testCase } of cases) {
      content += `### ${name}\n\n`;

      if (testCase.expectedCharacteristics && testCase.expectedCharacteristics.length > 0) {
        content += `**예상 특성:**\n`;
        for (const characteristic of testCase.expectedCharacteristics) {
          content += `- ${characteristic}\n`;
        }
        content += `\n`;
      } else {
        content += `- 예상 특성이 정의되지 않았습니다.\n\n`;
      }

      // Add analysis based on complexity
      if (testCase.complexity === 'simple') {
        content += `**예상 품질:** 기본적인 역사적 요소 반영, 세부 묘사 제한적\n\n`;
      } else {
        content += `**예상 품질:** 풍부한 역사적 디테일, 시대 고증 정확성 향상\n\n`;
      }
    }

    return content;
  }

  /**
   * Builds the conclusion section
   * @param testCaseSet - The test case set
   * @returns Markdown formatted conclusion section
   */
  private buildConclusionSection(testCaseSet: TestCaseSet): string {
    const era = testCaseSet.simpleWithoutNegative.era;
    const eraDisplayName = ERA_DISPLAY_NAMES[era] || era;

    let content = `## 결론\n\n`;

    content += `### 권장 사항\n\n`;
    content += `1. **교육 자료 품질 우선 시:** Case 4 (상세 프롬프트 + 네거티브) 권장\n`;
    content += `   - 가장 상세한 역사적 맥락 제공\n`;
    content += `   - 부적절한 요소 효과적 배제\n\n`;

    content += `2. **빠른 프로토타이핑 시:** Case 1 (단순 프롬프트) 권장\n`;
    content += `   - 짧은 생성 시간\n`;
    content += `   - 기본적인 시대 분위기 확인\n\n`;

    content += `3. **균형잡힌 접근:** Case 3 (상세 프롬프트) 권장\n`;
    content += `   - 충분한 역사적 디테일\n`;
    content += `   - 적절한 토큰 사용량\n\n`;

    content += `### ${eraDisplayName} 특화 고려사항\n\n`;

    // Era-specific recommendations
    switch (era) {
      case 'goryeo':
        content += `- 불교 문화 요소의 정확한 표현 확인\n`;
        content += `- 귀족 의복의 화려함과 색상 고증\n`;
        content += `- 고려청자 등 시대 특유의 공예품 포함 여부\n`;
        break;
      case 'joseon-early':
        content += `- 유교적 질서와 의례 표현\n`;
        content += `- 초기 한복 양식의 정확성\n`;
        content += `- 세종대 과학 기구 등 시대 특징\n`;
        break;
      case 'joseon-mid':
        content += `- 임진왜란 후 복구기 특성 반영\n`;
        content += `- 실학의 영향과 서민 문화 성장\n`;
        content += `- 양반 문화의 세련화\n`;
        break;
      case 'joseon-late':
        content += `- 서구 문물 유입 표현\n`;
        content += `- 전통과 근대의 공존\n`;
        content += `- 개항기 복식 변화\n`;
        break;
      case 'japanese-occupation':
        content += `- 민족 정체성 표현\n`;
        content += `- 강제적 근대화와 저항\n`;
        content += `- 전통 복식과 근대 복식의 혼재\n`;
        break;
      default:
        content += `- 해당 시대의 문화적 특성 반영 필요\n`;
    }

    content += `\n`;

    // Final summary
    content += `### 최종 평가\n\n`;
    content += `본 테스트 세트는 ${eraDisplayName}의 역사 교육 자료 생성을 위한 4가지 프롬프트 전략을 비교합니다. `;
    content += `실제 이미지 생성 후 품질 평가를 통해 최적의 전략을 선정하시기 바랍니다.\n\n`;

    content += `---\n`;
    content += `*본 리포트는 Korean History Prompt Generator에 의해 자동 생성되었습니다.*\n`;

    return content;
  }

  /**
   * Builds overall conclusion for summary reports
   * @param testCaseSets - Array of test case sets
   * @returns Markdown formatted overall conclusion
   */
  private buildOverallConclusion(testCaseSets: TestCaseSet[]): string {
    let content = `## 전체 결론\n\n`;

    content += `### 테스트 세트 요약\n\n`;
    content += `총 ${testCaseSets.length}개의 테스트 세트에서 ${testCaseSets.length * 4}개의 프롬프트 케이스가 생성되었습니다.\n\n`;

    content += `### 일반 권장사항\n\n`;
    content += `1. 역사적 정확성이 중요한 교육 자료의 경우, 상세 프롬프트 + 네거티브 프롬프트 조합을 권장합니다.\n`;
    content += `2. 각 시대별 특성을 반영한 맞춤형 프롬프트 전략이 필요합니다.\n`;
    content += `3. A/B 테스트를 통해 실제 교육 효과를 검증하시기 바랍니다.\n\n`;

    content += `---\n`;
    content += `*본 종합 리포트는 Korean History Prompt Generator에 의해 자동 생성되었습니다.*\n`;

    return content;
  }

  /**
   * Builds the summary header for multi-set reports
   * @param count - Number of test sets
   * @param timestamp - Report timestamp
   * @returns Markdown formatted header
   */
  private buildSummaryHeader(count: number, timestamp: string): string {
    return `# 프롬프트 비교 분석 종합 리포트\n\n` +
      `**생성일시:** ${this.formatTimestamp(timestamp)}\n` +
      `**테스트 세트 수:** ${count}개\n` +
      `**총 테스트 케이스 수:** ${count * 4}개\n\n`;
  }

  /**
   * Calculates statistics for multiple test case sets
   * @param testCaseSets - Array of test case sets
   * @returns Statistics object
   */
  private calculateStatistics(testCaseSets: TestCaseSet[]): {
    avgSimpleLength: number;
    avgEnhancedLength: number;
    avgNegativeLength: number;
    enhancedToSimpleRatio: number;
    eraDistribution: Record<string, number>;
  } {
    let totalSimpleLength = 0;
    let totalEnhancedLength = 0;
    let totalNegativeLength = 0;
    let negativeCount = 0;
    const eraDistribution: Record<string, number> = {};

    for (const set of testCaseSets) {
      // Prompt lengths
      totalSimpleLength += set.simpleWithoutNegative.prompt.length;
      totalSimpleLength += set.simpleWithNegative.prompt.length;
      totalEnhancedLength += set.enhancedWithoutNegative.prompt.length;
      totalEnhancedLength += set.enhancedWithNegative.prompt.length;

      // Negative prompt lengths
      if (set.simpleWithNegative.negativePrompt) {
        totalNegativeLength += set.simpleWithNegative.negativePrompt.length;
        negativeCount++;
      }
      if (set.enhancedWithNegative.negativePrompt) {
        totalNegativeLength += set.enhancedWithNegative.negativePrompt.length;
        negativeCount++;
      }

      // Era distribution
      const era = set.simpleWithoutNegative.era;
      eraDistribution[era] = (eraDistribution[era] || 0) + 1;
    }

    const avgSimpleLength = Math.round(totalSimpleLength / (testCaseSets.length * 2));
    const avgEnhancedLength = Math.round(totalEnhancedLength / (testCaseSets.length * 2));
    const avgNegativeLength = negativeCount > 0 ? Math.round(totalNegativeLength / negativeCount) : 0;
    const enhancedToSimpleRatio = avgSimpleLength > 0 ? avgEnhancedLength / avgSimpleLength : 1;

    return {
      avgSimpleLength,
      avgEnhancedLength,
      avgNegativeLength,
      enhancedToSimpleRatio,
      eraDistribution,
    };
  }

  /**
   * Extracts subject from test case set
   * @param testCaseSet - The test case set
   * @returns Subject string
   */
  private extractSubject(testCaseSet: TestCaseSet): string {
    // Try to extract subject from the first test case name or prompt
    const name = testCaseSet.simpleWithoutNegative.name;
    if (name && name !== testCaseSet.simpleWithoutNegative.id) {
      return name;
    }

    // Extract from prompt (first meaningful phrase)
    const prompt = testCaseSet.simpleWithoutNegative.prompt;
    const match = prompt.match(/^[^,.:]+/);
    return match ? match[0].trim() : '(미정)';
  }

  /**
   * Gets a brief summary of a test case
   * @param testCase - The test case
   * @returns Summary string
   */
  private getTestCaseSummary(testCase: TestCase): string {
    const promptLength = testCase.prompt.length;
    const hasNegative = testCase.negativePrompt ? 'Yes' : 'No';
    return `${promptLength}자 / 네거티브: ${hasNegative}`;
  }

  /**
   * Formats a date object to Korean date string
   * @param date - The date to format
   * @returns Formatted date string
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Gets current timestamp for filenames
   * @returns Timestamp string (YYYYMMDD-HHmmss)
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
   * Formats timestamp for display
   * @param timestamp - Timestamp string
   * @returns Formatted timestamp
   */
  private formatTimestamp(timestamp: string): string {
    // Convert YYYYMMDD-HHmmss to readable format
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hours = timestamp.substring(9, 11);
    const minutes = timestamp.substring(11, 13);
    const seconds = timestamp.substring(13, 15);
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Ensures the output directory exists
   */
  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }
}

export default ReportExporter;
