import 'dotenv/config';
import { TestCaseGenerator } from './generators/test-case.generator';
import { BatchGenerator } from './generators/batch.generator';
import { JsonExporter } from './exporters/json.exporter';
import { CsvExporter } from './exporters/csv.exporter';
import { ReportExporter } from './exporters/report.exporter';
import { logger } from './utils/logger';
import { Validators, VALID_ERAS } from './utils/validators';
import { Era } from './types';
import { getApiKey } from './config/api.config';

// CLI 인자 타입 정의
interface Args {
  help: boolean;
  batch: boolean;
  era: Era;
  topic: string;
  config?: string;
}

// CLI 인자 파싱
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = {
    help: false,
    batch: false,
    era: 'joseon-mid' as Era,
    topic: '한국사 일반',
    config: undefined
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        result.help = true;
        break;
      case '--batch':
      case '-b':
        result.batch = true;
        break;
      case '--era':
      case '-e':
        if (i + 1 < args.length) {
          const eraValue = args[++i];
          if (Validators.isValidEra(eraValue)) {
            result.era = eraValue as Era;
          } else {
            logger.error(`유효하지 않은 시대: ${eraValue}`);
            logger.info(`유효한 시대: ${VALID_ERAS.join(', ')}`);
            process.exit(1);
          }
        }
        break;
      case '--topic':
      case '-t':
        if (i + 1 < args.length) {
          result.topic = args[++i];
        }
        break;
      case '--config':
      case '-c':
        if (i + 1 < args.length) {
          result.config = args[++i];
        }
        break;
      default:
        if (arg.startsWith('-')) {
          logger.warn(`알 수 없는 옵션: ${arg}`);
        }
    }
  }

  return result;
}

// 메인 함수
async function main() {
  logger.info('네거티브 프롬프트 고증 검증 효과 분석 프로그램 시작');

  const apiKey = getApiKey();

  // CLI 인자 파싱
  const args = parseArgs();

  if (args.help) {
    printHelp();
    return;
  }

  logger.info(`실행 모드: ${args.batch ? '배치' : '단일'}`);
  logger.info(`시대: ${args.era}, 주제: ${args.topic}`);

  // 단일 테스트 또는 배치 실행
  if (args.batch) {
    await runBatch(apiKey, args);
  } else {
    await runSingle(apiKey, args);
  }

  logger.info('프로그램 완료');
}

// 단일 테스트 실행
async function runSingle(apiKey: string, args: Args) {
  logger.info('단일 테스트 케이스 생성 시작');

  const generator = new TestCaseGenerator(apiKey);
  const result = await generator.generateTestCaseSet(args.era, args.topic);

  logger.info('테스트 케이스 생성 완료, 결과 저장 중...');

  // 결과 저장
  const jsonExporter = new JsonExporter();
  const csvExporter = new CsvExporter();
  const reportExporter = new ReportExporter();

  const [jsonPath, csvPath, reportPath] = await Promise.all([
    jsonExporter.exportTestCaseSet(result),
    csvExporter.exportToCsv([result]),
    reportExporter.generateReport(result)
  ]);

  logger.info(`JSON 저장: ${jsonPath}`);
  logger.info(`CSV 저장: ${csvPath}`);
  logger.info(`리포트 저장: ${reportPath}`);
}

// 배치 실행
async function runBatch(apiKey: string, args: Args) {
  logger.info('배치 모드 실행');

  if (!args.config) {
    logger.error('배치 모드에는 --config 옵션이 필요합니다');
    process.exit(1);
  }

  const batchGenerator = new BatchGenerator(apiKey);

  try {
    const results = await batchGenerator.runFromConfig(args.config);

    logger.info(`배치 실행 완료: ${results.length}개의 테스트 세트 생성`);

    // 결과 저장
    const jsonExporter = new JsonExporter();
    const csvExporter = new CsvExporter();
    const reportExporter = new ReportExporter();

    // 각 결과를 개별 저장
    for (const result of results) {
      await jsonExporter.exportTestCaseSet(result);
    }

    // 전체 결과를 CSV로 저장
    await csvExporter.exportToCsv(results);

    // 각 결과에 대한 리포트 생성
    for (const result of results) {
      await reportExporter.generateReport(result);
    }

    logger.info('모든 결과 저장 완료');
  } catch (error) {
    logger.error('배치 실행 중 오류 발생', error);
    process.exit(1);
  }
}

// 도움말 출력
function printHelp() {
  console.log(`
================================================================================
네거티브 프롬프트 고증 검증 효과 분석 프로그램
================================================================================

이 프로그램은 한국사 교육 콘텐츠에서 네거티브 프롬프트의 고증 오류 검증
효과를 분석하기 위한 테스트 케이스를 생성합니다.

사용법:
  npx ts-node src/index.ts [옵션]

옵션:
  -h, --help              도움말 출력
  -e, --era <시대>        시대 선택
  -t, --topic <주제>      테스트 주제
  -b, --batch             배치 모드 실행
  -c, --config <파일>     배치 설정 파일 경로 (JSON)

지원 시대:
  - goryeo                고려시대
  - joseon-early          조선 전기
  - joseon-mid            조선 중기
  - joseon-late           조선 후기
  - japanese-occupation   일제강점기

예시:
  # 단일 테스트 케이스 생성
  npx ts-node src/index.ts --era joseon-mid --topic "임진왜란"

  # 배치 모드 실행
  npx ts-node src/index.ts --batch --config batch-config.json

환경 변수:
  OPENAI_API_KEY          OpenAI API 키 (필수)
  OUTPUT_DIR              출력 디렉토리 (기본: ./output)
  LOG_LEVEL               로그 레벨 (기본: info)

배치 설정 파일 형식 (JSON):
  {
    "testCases": [
      { "era": "joseon-mid", "topic": "임진왜란" },
      { "era": "japanese-occupation", "topic": "3.1운동" }
    ],
    "options": {
      "parallel": true,
      "maxConcurrent": 3
    }
  }

출력:
  - JSON: 상세 테스트 케이스 데이터
  - CSV: 분석용 요약 데이터
  - 리포트: 마크다운 형식의 분석 보고서

================================================================================
  `);
}

// 프로그램 실행
main().catch((error) => {
  logger.error('치명적 오류 발생', error);
  process.exit(1);
});
