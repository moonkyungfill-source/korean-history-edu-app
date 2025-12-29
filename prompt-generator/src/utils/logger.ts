import chalk from 'chalk';

/**
 * 로그 레벨 열거형
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * 로깅 유틸리티 클래스
 * 콘솔 출력 시 색상 적용 및 시간 측정 기능 제공
 */
export class Logger {
  private level: LogLevel;
  private prefix: string;
  private timers: Map<string, number>;

  /**
   * Logger 생성자
   * @param prefix - 로그 메시지 앞에 붙을 접두사
   * @param level - 최소 로그 레벨 (기본값: INFO)
   */
  constructor(prefix: string = '', level: LogLevel = LogLevel.INFO) {
    this.prefix = prefix;
    this.level = level;
    this.timers = new Map();
  }

  /**
   * 디버그 레벨 로그 출력
   * @param message - 로그 메시지
   * @param args - 추가 인자
   */
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(
        chalk.gray(this.formatMessage('DEBUG', message)),
        ...args
      );
    }
  }

  /**
   * 정보 레벨 로그 출력
   * @param message - 로그 메시지
   * @param args - 추가 인자
   */
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(
        chalk.blue(this.formatMessage('INFO', message)),
        ...args
      );
    }
  }

  /**
   * 경고 레벨 로그 출력
   * @param message - 로그 메시지
   * @param args - 추가 인자
   */
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(
        chalk.yellow(this.formatMessage('WARN', message)),
        ...args
      );
    }
  }

  /**
   * 에러 레벨 로그 출력
   * @param message - 로그 메시지
   * @param args - 추가 인자
   */
  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(
        chalk.red(this.formatMessage('ERROR', message)),
        ...args
      );
    }
  }

  /**
   * 진행 상황 로깅
   * @param current - 현재 진행 수
   * @param total - 전체 수
   * @param message - 진행 상황 메시지
   */
  progress(current: number, total: number, message: string): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(percentage);
    const progressMessage = `[${current}/${total}] ${progressBar} ${percentage}% - ${message}`;

    // 같은 줄에 덮어쓰기 (터미널에서만 동작)
    if (process.stdout.isTTY) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        chalk.cyan(this.formatMessage('PROGRESS', progressMessage))
      );

      // 완료 시 줄바꿈
      if (current === total) {
        console.log();
      }
    } else {
      console.log(
        chalk.cyan(this.formatMessage('PROGRESS', progressMessage))
      );
    }
  }

  /**
   * 타이머 시작
   * @param label - 타이머 라벨
   */
  startTimer(label: string): void {
    this.timers.set(label, Date.now());
    this.debug(`Timer started: ${label}`);
  }

  /**
   * 타이머 종료 및 경과 시간 반환
   * @param label - 타이머 라벨
   * @returns 경과 시간 (밀리초)
   */
  endTimer(label: string): number {
    const startTime = this.timers.get(label);

    if (startTime === undefined) {
      this.warn(`Timer not found: ${label}`);
      return 0;
    }

    const elapsed = Date.now() - startTime;
    this.timers.delete(label);

    const formattedTime = this.formatElapsedTime(elapsed);
    this.info(`Timer [${label}]: ${formattedTime}`);

    return elapsed;
  }

  /**
   * 로그 레벨 설정
   * @param level - 새로운 로그 레벨
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * 현재 로그 레벨 반환
   * @returns 현재 로그 레벨
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * 로그 메시지 포맷팅
   * @param level - 로그 레벨 문자열
   * @param message - 로그 메시지
   * @returns 포맷팅된 메시지
   */
  private formatMessage(level: string, message: string): string {
    const timestamp = this.getTimestamp();
    const prefixStr = this.prefix ? `[${this.prefix}]` : '';
    return `${timestamp} ${prefixStr}[${level}] ${message}`;
  }

  /**
   * 현재 타임스탬프 반환
   * @returns ISO 형식 타임스탬프
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * 프로그레스 바 생성
   * @param percentage - 진행률 (0-100)
   * @returns 프로그레스 바 문자열
   */
  private createProgressBar(percentage: number): string {
    const width = 20;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  /**
   * 경과 시간 포맷팅
   * @param ms - 밀리초
   * @returns 포맷팅된 시간 문자열
   */
  private formatElapsedTime(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(2);
      return `${minutes}m ${seconds}s`;
    }
  }
}

/**
 * 글로벌 로거 인스턴스
 */
export const logger = new Logger('PromptGenerator');

/**
 * 환경 변수에 따른 로그 레벨 설정
 */
if (process.env.LOG_LEVEL) {
  const envLevel = process.env.LOG_LEVEL.toUpperCase();
  switch (envLevel) {
    case 'DEBUG':
      logger.setLevel(LogLevel.DEBUG);
      break;
    case 'INFO':
      logger.setLevel(LogLevel.INFO);
      break;
    case 'WARN':
      logger.setLevel(LogLevel.WARN);
      break;
    case 'ERROR':
      logger.setLevel(LogLevel.ERROR);
      break;
  }
}

export default logger;
