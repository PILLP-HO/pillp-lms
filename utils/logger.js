import { format, transports, createLogger } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const consoleLogFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD hh:mm:ss a" }),
  format.colorize(),
  format.printf(({ timestamp, level, message }) => `[${level}]: ${message}`),
);

const fileLogFormat = format.combine(
  format.errors({ stack: true }),
  format.timestamp({ format: "YYYY-MM-DD hh:mm:ss a" }),
  format.json(),
  format.prettyPrint(),
);

// Logger for console logging
const consoleLogger = createLogger({
  levels,
  format: consoleLogFormat,
  transports: [new transports.Console()],
});

// Logger for HTTP/file logging
const httpFileLogger = createLogger({
  levels,
  format: fileLogFormat,
  transports: [
    new DailyRotateFile({
      filename: "logs/HTTP-Logs-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d", // Keep logs for 14 days
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: "logs/exceptions.log" }), // Log exceptions separately
  ],
});

// Export loggers
export { consoleLogger, httpFileLogger };
