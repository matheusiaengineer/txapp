type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  route?: string
  userId?: string
  statusCode?: number
  duration?: number
  error?: string
  meta?: Record<string, unknown>
  timestamp: string
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const minLevel = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || "info"] ?? 1

function formatEntry(entry: LogEntry): string {
  return JSON.stringify(entry)
}

function log(level: LogLevel, message: string, data?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>) {
  if (LOG_LEVELS[level] < minLevel) return
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  }
  const formatted = formatEntry(entry)
  if (level === "error") {
    console.error(formatted)
  } else if (level === "warn") {
    console.warn(formatted)
  } else {
    console.log(formatted)
  }
}

export const logger = {
  debug: (msg: string, data?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>) => log("debug", msg, data),
  info: (msg: string, data?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>) => log("info", msg, data),
  warn: (msg: string, data?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>) => log("warn", msg, data),
  error: (msg: string, data?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>) => log("error", msg, data),

  apiError(route: string, error: unknown, statusCode = 500) {
    const message = error instanceof Error ? error.message : String(error)
    log("error", `API Error: ${route}`, { route, statusCode, error: message })
  },

  apiRequest(route: string, userId?: string, statusCode?: number, duration?: number) {
    log("info", `API Request: ${route}`, { route, userId, statusCode, duration })
  },
}
