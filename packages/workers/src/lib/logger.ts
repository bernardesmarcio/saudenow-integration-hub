import pino from "pino";
import config from "../config";

const transport = config.logging.pretty
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    }
  : undefined;

export const logger = pino({
  level: config.logging.level,
  transport,
  base: {
    env: config.environment,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Create child loggers for different components
export const createLogger = (component: string) => {
  return logger.child({ component });
};

// Specific loggers
export const queueLogger = createLogger("queue");
export const workerLogger = createLogger("worker");
export const sapLogger = createLogger("sap");
export const cacheLogger = createLogger("cache");
export const estoqueLogger = createLogger("estoque");
export const alertLogger = createLogger("alert");

export default logger;
