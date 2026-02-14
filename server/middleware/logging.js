import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'error_logs.json');

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
    console.error('Failed to write log:', e);
  }
};

export const registerProcessHandlers = () => {
  process.on('unhandledRejection', reason => {
    console.error('Unhandled promise rejection:', reason);
    writeLog({
      level: 'error',
      source: 'server',
      message: 'Unhandled promise rejection',
      context: { reason },
    });
  });

  process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    writeLog({
      level: 'error',
      source: 'server',
      message: 'Uncaught exception',
      stack: error?.stack,
      context: { message: error?.message },
    });
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
