type LogLevel = "info" | "warn" | "error";

type LogMetadata = Record<string, unknown>;

function write(level: LogLevel, message: string, metadata?: LogMetadata) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(metadata ? { metadata } : {}),
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info(message: string, metadata?: LogMetadata) {
    write("info", message, metadata);
  },
  warn(message: string, metadata?: LogMetadata) {
    write("warn", message, metadata);
  },
  error(message: string, metadata?: LogMetadata) {
    write("error", message, metadata);
  },
};
