import winston from "winston";
import { MAGENTA_COLOR, RED_COLOR, RESET_COLOR, YELLOW_COLOR, CYAN_COLOR } from "./constants";

class Logger {
  private static instance: winston.Logger;
  private static appName: string = `${CYAN_COLOR} transfer-platform ${RESET_COLOR}`;

  private constructor() {}

  // Method to apply custom colors to log levels
  private static customColorize(level: string, message: unknown): string {
    const msg = String(message);

    switch (level) {
      case "warn":
        return `${YELLOW_COLOR}${msg}${RESET_COLOR}`;
      case "error":
        return `${RED_COLOR}${msg}${RESET_COLOR}`;
      case "info":
      default:
        return msg;
    }
  }

  public static getInstance(): winston.Logger {
    if (!Logger.instance) {
      Logger.instance = winston.createLogger({
        level: "info",
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message }) => {
            const coloredMessage = Logger.customColorize(level, message);
            return `${MAGENTA_COLOR}${timestamp}${RESET_COLOR} | ${Logger.appName} | ${level.toUpperCase()} | : ${coloredMessage}`;
          })
        ),
        transports: [
          new winston.transports.Console({ format: winston.format.combine(winston.format.colorize()) }),
          new winston.transports.File({ filename: "logs/app.log" }),
        ],
      });
    }
    return Logger.instance;
  }
}

export { Logger };
