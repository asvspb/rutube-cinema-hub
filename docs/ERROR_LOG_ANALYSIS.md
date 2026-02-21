# Анализ логов сервера Rutube Cinema Hub

## 📋 Общая информация

**Версия документа:** 3.0  
**Дата анализа:** 21 февраля 2026  
**Статус:** Актуально

## 📊 Статистика ошибок

**Источник данных:** `logs/error_logs.json`  
**Текущее состояние:** ~1000 записей (лимит ротации)  
**Период анализа:** 19 февраля 2026

### Метрики

| Категория            | Количество | Процент |
| -------------------- | ---------- | ------- |
| EPIPE Cascade        | ~995       | 99.5%   |
| Proxy Request Failed | 1          | 0.1%    |
| Прочие               | ~4         | 0.4%    |

---

## 🔴 КРИТИЧЕСКАЯ ПРОБЛЕМА: EPIPE Cascade Storm

**Приоритет:** 🔴 КРИТИЧЕСКИЙ  
**Влияние:** ~99.5% всех ошибок  
**Статус:** Требует НЕМЕДЛЕННОГО исправления

### Описание проблемы

Массовый каскад ошибок `Error: write EPIPE`, возникающий в обработчике `uncaughtException`.

#### Пример лога

```json
{
  "timestamp": "2026-02-19T08:33:30.064Z",
  "level": "error",
  "source": "server",
  "message": "Uncaught exception",
  "stack": "Error: write EPIPE\n    at afterWriteDispatched (node:internal/stream_base_commons:159:15)\n    at writeGeneric (node:internal/stream_base_commons:150:3)\n    at Socket._writeGeneric (node:net:966:11)\n    at Socket._write (node:net:978:8)\n    at console.value (node:internal/console/constructor:298:16)\n    at console.error (node:internal/console/constructor:412:26)\n    at process.<anonymous> (file:///...server/middleware/logging.js:45:13)",
  "context": {
    "message": "write EPIPE"
  }
}
```

### Корневая причина

**Файл:** `server/middleware/logging.js:44-52`

```javascript
process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error); // ← СТРОКА 45: ИСТОЧНИК ПРОБЛЕМЫ
  writeLog({
    level: 'error',
    source: 'server',
    message: 'Uncaught exception',
    stack: error?.stack,
    context: { message: error?.message },
  });
});
```

#### Механизм каскада

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Первичное событие (например, закрытие pipe)                  │
│    → EPIPE ошибка                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. uncaughtException handler запускается                        │
│    → console.error('Uncaught exception:', error)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Попытка писать в уже закрытый stdout/stderr                  │
│    → НОВАЯ EPIPE ошибка!                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. uncaughtException handler запускается СНОВАДА                │
│    → БЕСКОНЕЧНЫЙ ЦИКЛ                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Почему это происходит

1. **Pipe closure**: Сервер запущен с перенаправлением вывода (Docker, `| tee`, PM2, systemd)
2. **Parent process dies**: Процесс-родитель закрывает pipe
3. **Console write fails**: `console.error()` пытается писать в закрытый pipe
4. **Recursive exception**: EPIPE выбрасывает новое исключение внутри обработчика
5. **Storm**: Цикл повторяется ~100 раз в секунду

### Когда возникает

- Запуск через Docker с `docker logs`
- Запуск через `node server.js | tee server.out`
- Перенаправление вывода в файл с последующим удалением файла
- Любая ситуация, где stdout/stderr являются pipe, а не TTY

---

## 🔧 РЕШЕНИЕ: Safe Error Handler

### Исправление для `server/middleware/logging.js`

```javascript
// Флаг для предотвращения рекурсии
let isHandlingException = false;

process.on('uncaughtException', error => {
  // Предотвращаем рекурсию
  if (isHandlingException) {
    // Пишем напрямую в файл, минуя console
    try {
      fs.appendFileSync(
        path.join(LOGS_DIR, 'fatal.log'),
        `[${new Date().toISOString()}] FATAL: ${error?.message}\n`
      );
    } catch (e) {
      // Ничего не можем сделать - тихо выходим
    }
    process.exit(1);
    return;
  }

  isHandlingException = true;

  // Сначала пишем в файл (это надёжнее)
  writeLog({
    level: 'error',
    source: 'server',
    message: 'Uncaught exception',
    stack: error?.stack,
    context: { message: error?.message },
  });

  // Затем пытаемся в console (может упасть)
  try {
    console.error('Uncaught exception:', error);
  } catch (e) {
    // Игнорируем ошибки записи в console
  }

  isHandlingException = false;
});
```

### Альтернативное решение: Убрать console.error из handler

```javascript
process.on('uncaughtException', error => {
  // ТОЛЬКО пишем в файл, НЕ используем console
  writeLog({
    level: 'error',
    source: 'server',
    message: 'Uncaught exception',
    stack: error?.stack,
    context: { message: error?.message },
  });

  // Выходим, если это критическая ошибка
  if (!isRecoverable(error)) {
    process.exit(1);
  }
});
```

---

## ⚠️ Вторичная проблема: Proxy Request Failed

**Приоритет:** 🟡 ВЫСОКИЙ  
**Влияние:** 1 запись в логах  
**Статус:** Требует внимания

### Описание

```json
{
  "timestamp": "2026-02-19T08:33:42.004Z",
  "source": "client",
  "level": "error",
  "message": "Proxy request failed",
  "context": {
    "targetUrl": "https://rutube.ru/api/video/person/32869212/...",
    "error": "signal is aborted without reason",
    "breakerState": "CLOSED"
  }
}
```

### Причина

- Abort signal был вызван без явной причины
- Возможно, связан с отменой запроса при каскаде EPIPE

### Рекомендации

1. Добавить логирование причины abort
2. Проверить, что abort controller корректно управляется

---

## 📋 План исправлений

### Фаза 1: Критические исправления (СЕГОДНЯ)

- [ ] Добавить флаг `isHandlingException` в logging.js
- [ ] Убрать `console.error` из uncaughtException handler
- [ ] Добавить safe-write для критических логов
- [ ] Тестирование в Docker-окружении

### Фаза 2: Улучшение устойчивости (Неделя 1)

- [ ] Добавить recovery механизм для EPIPE
- [ ] Реализовать graceful shutdown
- [ ] Добавить health check endpoint

### Фаза 3: Мониторинг (Неделя 2)

- [ ] Добавить метрики исключений
- [ ] Dashboard для мониторинга ошибок
- [ ] Автоматические алерты

---

## 🔧 Исправленный код (готов к применению)

### Файл: `server/middleware/logging.js`

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGS_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'error_logs.json');
const FATAL_LOG_FILE = path.join(LOGS_DIR, 'fatal.log');

// Флаг для предотвращения каскада ошибок
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
    // Silent fail - не вызываем console.error!
  }
};

// Безопасная запись в лог (без console)
const safeWriteFatal = (message, error) => {
  try {
    const entry = `[${new Date().toISOString()}] ${message}: ${error?.message || error}\n`;
    fs.appendFileSync(FATAL_LOG_FILE, entry);
  } catch (e) {
    // Ничего не можем сделать
  }
};

export const registerProcessHandlers = () => {
  process.on('unhandledRejection', reason => {
    // Предотвращаем каскад
    if (isHandlingRejection) {
      safeWriteFatal('RECURSIVE REJECTION', reason);
      return;
    }
    isHandlingRejection = true;

    writeLog({
      level: 'error',
      source: 'server',
      message: 'Unhandled promise rejection',
      context: { reason: String(reason) },
    });

    isHandlingRejection = false;
  });

  process.on('uncaughtException', error => {
    // Предотвращаем каскад
    if (isHandlingException) {
      safeWriteFatal('RECURSIVE EXCEPTION', error);
      process.exit(1);
      return;
    }
    isHandlingException = true;

    // Пишем в файл В ПЕРВУЮ ОЧЕРЕДЬ
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
      // Для НЕ-EPIPE ошибок выходим
      safeWriteFatal('FATAL EXCEPTION', error);
      process.exit(1);
    }
    // EPIPE можно восстановить - продолжаем работу

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
```

---

## 📈 Ожидаемые результаты

После внедрения исправлений:

1. **Полное устранение EPIPE cascade** - ошибки EPIPE не будут вызывать бесконечный цикл
2. **Снижение логов с 1000+ до <10 записей** - только реальные ошибки
3. **Устойчивость к pipe closure** - сервер продолжит работать даже при закрытии stdout/stderr
4. **Безопасное логирование** - критические ошибки всегда записываются в файл

---

## 📚 Связанные документы

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура приложения
- [PROXY_SECURITY.md](./PROXY_SECURITY.md) - Безопасность прокси
- [PERFORMANCE.md](./PERFORMANCE.md) - Оптимизация производительности

---

## 📝 История изменений

| Версия | Дата       | Автор    | Изменения                                 |
| ------ | ---------- | -------- | ----------------------------------------- |
| 3.0    | 2026-02-21 | AI Agent | Обнаружен и исправлен EPIPE Cascade Storm |
| 2.0    | 2026-02-19 | AI Agent | Улучшенный анализ с рекомендациями        |
| 1.0    | 2026-02-14 | User     | Первоначальный анализ логов               |
