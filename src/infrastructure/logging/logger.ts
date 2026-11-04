type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  message: string;
  module?: string;
  context?: Record<string, unknown>;
  error?: unknown;
}

export const logger = {
  log: (level: LogLevel, { message, module, context, error }: LogPayload) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]${module ? ` [${module}]` : ""}`;
    const formatted = `${prefix} ${message}`;

    if (level === "error") {
      console.error(formatted, context ?? "", error ?? "");
    } else if (level === "warn") {
      console.warn(formatted, context ?? "");
    } else {
      console.log(formatted, context ?? "");
    }
  },
  debug: (message: string, context?: Record<string, unknown>, module?: string) =>
    logger.log("debug", { message, context, module }),
  info: (message: string, context?: Record<string, unknown>, module?: string) =>
    logger.log("info", { message, context, module }),
  warn: (message: string, context?: Record<string, unknown>, module?: string) =>
    logger.log("warn", { message, context, module }),
  error: (message: string, error?: unknown, context?: Record<string, unknown>, module?: string) =>
    logger.log("error", { message, error, context, module }),
};
