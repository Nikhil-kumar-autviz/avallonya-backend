const winston = require("winston");
const { combine, timestamp, printf, colorize, json } = winston.format;
const path = require("path");
const fs = require("fs");

const logDir = "logs";
const isProduction = process.env.NODE_ENV === "production";

// Only create logs directory if not in production
if (!isProduction && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const loggerTransports = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    )
  })
];

if (!isProduction) {
  loggerTransports.push(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error"
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log")
    })
  );
}

const exceptionHandlers = isProduction
  ? []
  : [
      new winston.transports.File({
        filename: path.join(logDir, "exceptions.log")
      })
    ];

const rejectionHandlers = isProduction
  ? []
  : [
      new winston.transports.File({
        filename: path.join(logDir, "rejections.log")
      })
    ];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    json(),
    printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
      });
    })
  ),
  transports: loggerTransports,
  exceptionHandlers,
  rejectionHandlers
});

module.exports = logger;
