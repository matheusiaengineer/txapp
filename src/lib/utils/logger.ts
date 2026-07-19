const IS_DEV = process.env.NODE_ENV === "development";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3,
};

const currentLevel: LogLevel = IS_DEV ? "debug" : "error";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export const logger = {
  debug: (...args: any[]) => { if (shouldLog("debug")) console.debug("[TXD]", ...args); },
  info: (...args: any[]) => { if (shouldLog("info")) console.info("[TXD]", ...args); },
  warn: (...args: any[]) => { if (shouldLog("warn")) console.warn("[TXD]", ...args); },
  error: (...args: any[]) => { if (shouldLog("error")) console.error("[TXD]", ...args); },
};

// For development logging that should never reach production
export const devLogger = {
  log: (...args: any[]) => { if (IS_DEV) console.log("[DEV]", ...args); },
};
