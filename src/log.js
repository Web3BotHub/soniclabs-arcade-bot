import fs from "fs"
import { createLogger, format, transports } from "winston"
const { combine, timestamp, printf, colorize } = format
const logFormat = printf(
  ({ level: level, message: message, timestamp: timestamp }) => {
    return `${timestamp} [${level}]: ${message}`
  }
)

const LOG_PATH = "app.log"

class Log {
  constructor() {
    this.logger = createLogger({
      level: "debug",
      format: combine(
        timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        colorize(),
        logFormat
      ),
      transports: [new transports.File({ filename: LOG_PATH })],
      exceptionHandlers: [new transports.File({ filename: LOG_PATH })],
      rejectionHandlers: [new transports.File({ filename: LOG_PATH })],
    })
  }
  info(message) {
    this.logger.info(message)
  }
  warn(message) {
    this.logger.warn(message)
  }
  error(message) {
    this.logger.error(message)
  }
  debug(message) {
    this.logger.debug(message)
  }
  setLevel(message) {
    this.logger.level = message
  }
  clear() {
    fs.truncate(LOG_PATH, 0, (error) => {
      if (error) {
        return this.logger.error("Failed to clear logs: " + error.message)
      }

      this.logger.info("Logs cleared")
    })
  }
}

export default new Log()
