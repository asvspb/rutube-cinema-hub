import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'error_logs.json');
const FATAL_LOG_FILE = path.join(LOGS_DIR, 'fatal.log');

// Флаги для предотвращения каскада ошибок (EPIPE storm protection)
let isHandlingException = false;
let isHandlingRejection = false;

// Создаём директорию логов при старте
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

export const writeLog = logEntry => {
  try {
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      logs = JSON.parse(content || '[]');
    }
    logs.push({
      timestamp: new Date().toISOString(),
      ...logEntry,
    });
    if (logs.length > 1000) logs = logs.slice(-1000);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (e) {
    // Silent fail - не вызываем console.error во избежание рекурсии!
  }
};

// Безопасная запись в лог (без console) - для критических ситуаций
const safeWriteFatal = (message, error) => {
  try {
    const entry = `[${new Date().toISOString()}] ${message}: ${error?.message || error}\n`;
    fs.appendFileSync(FATAL_LOG_FILE, entry);
  } catch (e) {
    // Ничего не можем сделать - тихо игнорируем
  }
};

export const registerProcessHandlers = () => {
  process.on('unhandledRejection', reason => {
    // Предотвращаем каскад ошибок
    if (isHandlingRejection) {
      safeWriteFatal('RECURSIVE REJECTION', reason);
      return;
    }
    isHandlingRejection = true;

    // Пишем в файл логов
    writeLog({
      level: 'error',
      source: 'server',
      message: 'Unhandled promise rejection',
      context: { reason: String(reason) },
    });

    isHandlingRejection = false;
  });

  process.on('uncaughtException', error => {
    // Предотвращаем каскад ошибок (EPIPE storm protection)
    if (isHandlingException) {
      safeWriteFatal('RECURSIVE EXCEPTION', error);
      process.exit(1);
      return;
    }
    isHandlingException = true;

    // Пишем в файл В ПЕРВУЮ ОЧЕРЕДЬ (это надёжно)
    writeLog({
      level: 'error',
      source: 'server',
      message: 'Uncaught exception',
      stack: error?.stack,
      context: { message: error?.message },
    });

    // Проверяем, является ли ошибка EPIPE (recoverable)
    const isEpipe = error?.code === 'EPIPE' || error?.message?.includes('EPIPE');

    if (!isEpipe) {
      // Для НЕ-EPIPE ошибок - безопасное логирование и выход
      safeWriteFatal('FATAL EXCEPTION', error);
      process.exit(1);
    }
    // EPIPE можно восстановить - продолжаем работу без вывода в console

    isHandlingException = false;
  });
};

export const errorHandler = (err, req, res, next) => {
  writeLog({
    level: 'error',
    source: 'server',
    message: 'Unhandled server error',
    context: {
      method: req.method,
      url: req.originalUrl,
      message: err?.message,
    },
    stack: err?.stack,
  });
  res.status(500).json({ error: 'Internal server error' });
};
