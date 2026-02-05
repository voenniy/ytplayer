import pino from "pino";
import path from "path";

const logDir = process.env.LOG_DIR || "./logs";
const logFile = path.join(logDir, "app.log");

// В dev режиме пишем и в консоль, и в файл
// В prod только в файл
const isDev = process.env.NODE_ENV !== "production";

const streams = [
  // Всегда пишем в файл
  {
    level: "info" as const,
    stream: pino.destination({
      dest: logFile,
      mkdir: true,
      sync: false,
    }),
  },
];

// В dev добавляем вывод в консоль с pretty print
if (isDev) {
  streams.push({
    level: "debug" as const,
    stream: process.stdout,
  });
}

export const logger = pino(
  {
    level: isDev ? "debug" : "info",
    base: { pid: process.pid },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream(streams)
);

// Отдельный логгер для YouTube API запросов
export const youtubeLogger = logger.child({ service: "youtube-api" });
