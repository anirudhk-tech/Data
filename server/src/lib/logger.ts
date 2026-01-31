import type { LogEntry, LogLevel, LogSource } from "./types";

/**
 * ExecutionLogger - Captures logs during pipeline execution
 */
export class ExecutionLogger {
  private logs: LogEntry[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  log(
    level: LogLevel,
    source: LogSource,
    message: string,
    details?: Record<string, unknown>,
    duration_ms?: number
  ): void {
    this.logs.push({
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      details,
      duration_ms,
    });
  }

  // System logs
  system(message: string, details?: Record<string, unknown>, duration_ms?: number): void {
    this.log("info", "system", message, details, duration_ms);
  }

  systemSuccess(message: string, details?: Record<string, unknown>, duration_ms?: number): void {
    this.log("success", "system", message, details, duration_ms);
  }

  systemError(message: string, details?: Record<string, unknown>, duration_ms?: number): void {
    this.log("error", "system", message, details, duration_ms);
  }

  // Keywords AI logs
  keywords(message: string, details?: Record<string, unknown>, duration_ms?: number): void {
    this.log("info", "keywords", message, details, duration_ms);
  }

  keywordsSuccess(message: string, details?: Record<string, unknown>, duration_ms?: number): void {
    this.log("success", "keywords", message, details, duration_ms);
  }

  keywordsError(message: string, details?: Record<string, unknown>): void {
    this.log("error", "keywords", message, details);
  }

  // WASM engine logs
  wasm(message: string, details?: Record<string, unknown>, duration_ms?: number): void {
    this.log("info", "wasm", message, details, duration_ms);
  }

  wasmSuccess(message: string, details?: Record<string, unknown>, duration_ms?: number): void {
    this.log("success", "wasm", message, details, duration_ms);
  }

  wasmError(message: string, details?: Record<string, unknown>): void {
    this.log("error", "wasm", message, details);
  }

  // Validator logs
  validator(message: string, details?: Record<string, unknown>, duration_ms?: number): void {
    this.log("info", "validator", message, details, duration_ms);
  }

  validatorSuccess(message: string, details?: Record<string, unknown>, duration_ms?: number): void {
    this.log("success", "validator", message, details, duration_ms);
  }

  validatorWarn(message: string, details?: Record<string, unknown>): void {
    this.log("warn", "validator", message, details);
  }

  validatorError(message: string, details?: Record<string, unknown>): void {
    this.log("error", "validator", message, details);
  }

  // Executor logs
  executor(message: string, details?: Record<string, unknown>, duration_ms?: number): void {
    this.log("info", "executor", message, details, duration_ms);
  }

  executorSuccess(message: string, details?: Record<string, unknown>, duration_ms?: number): void {
    this.log("success", "executor", message, details, duration_ms);
  }

  executorError(message: string, details?: Record<string, unknown>): void {
    this.log("error", "executor", message, details);
  }

  // Debug logs (only in development)
  debug(source: LogSource, message: string, details?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      this.log("debug", source, message, details);
    }
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get total execution time
  getTotalTime(): number {
    return Date.now() - this.startTime;
  }

  // Clear logs
  clear(): void {
    this.logs = [];
    this.startTime = Date.now();
  }
}

// Helper to create a timed operation
export function timedOperation<T>(
  logger: ExecutionLogger,
  source: LogSource,
  operationName: string,
  operation: () => T
): T {
  const start = Date.now();
  logger.log("info", source, `Starting: ${operationName}`, undefined, undefined);
  
  try {
    const result = operation();
    const duration = Date.now() - start;
    logger.log("success", source, `Completed: ${operationName}`, undefined, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.log("error", source, `Failed: ${operationName}`, { error: String(error) }, duration);
    throw error;
  }
}

// Async version
export async function timedOperationAsync<T>(
  logger: ExecutionLogger,
  source: LogSource,
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - start;
    logger.log("success", source, operationName, undefined, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.log("error", source, `Failed: ${operationName}`, { error: String(error) }, duration);
    throw error;
  }
}
