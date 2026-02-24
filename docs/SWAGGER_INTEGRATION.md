# Интеграция Swagger в Kino Club API

## Что такое Swagger?

**Swagger** — это набор инструментов с открытым исходным кодом для разработки, проектирования, документирования и тестирования REST API. Основан на спецификации OpenAPI (OAS).

### Основные компоненты:

- **Swagger Editor** — веб-редактор для написания спецификаций API в формате YAML/JSON
- **Swagger UI** — интерактивная документация с возможностью тестирования запросов
- **Swagger Codegen** — генератор клиентских SDK и серверных заглушек

---

## План интеграции

### Выявленные API endpoints в проекте:

| Метод | Endpoint                  | Описание                        |
| ----- | ------------------------- | ------------------------------- |
| GET   | `/health`                 | Проверка здоровья сервера       |
| GET   | `/api/health`             | Проверка здоровья API           |
| GET   | `/api/proxy?url=...`      | Прокси запросов к Rutube        |
| POST  | `/api/ai/kinorate/search` | Поиск рейтингов фильма через AI |
| POST  | `/api/ai/kinorate/batch`  | Пакетный запрос рейтингов       |

---

## Шаги интеграции

### Шаг 1: Установка зависимостей

```bash
npm install swagger-jsdoc swagger-ui-express
```

### Шаг 2: Создать файл конфигурации

Создать файл `server/config/swagger.js`:

```javascript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kino Club API',
      version: '1.0.0',
      description: 'API документация для Kino Club Proxy Server',
      contact: {
        name: 'Kino Club Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:9230',
        description: 'Development server',
      },
      {
        url: 'https://your-production-url.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        KinoRateResponse: {
          type: 'object',
          properties: {
            imdb: {
              type: 'number',
              example: 8.6,
              description: 'Рейтинг IMDB',
            },
            kinopoisk: {
              type: 'number',
              example: 8.2,
              description: 'Рейтинг Кинопоиск',
            },
            title: {
              type: 'string',
              example: 'Интерстеллар',
              description: 'Название фильма',
            },
            year: {
              type: 'number',
              example: 2014,
              description: 'Год выпуска',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message',
            },
            details: {
              type: 'string',
              example: 'Detailed error information',
            },
          },
        },
      },
    },
  },
  apis: ['./server/routes/*.js'], // Пути к файлам с JSDoc аннотациями
};

export const swaggerSpec = swaggerJsdoc(options);
```

### Шаг 3: Подключить Swagger UI в `server/index.js`

Добавить импорты и роут:

```javascript
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

// ... после подключения других роутов

// Swagger UI документация
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// JSON спецификация (для генерации клиентов)
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
```

### Шаг 4: Добавить JSDoc аннотации в роуты

#### `server/routes/health.js`

```javascript
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Проверка здоровья сервера
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Сервер работает
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
healthRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Проверка здоровья API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API работает
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
healthRouter.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

#### `server/routes/proxy.js`

```javascript
/**
 * @openapi
 * /api/proxy:
 *   get:
 *     summary: Прокси запросов к внешним ресурсам
 *     description: Проксирует запросы к разрешённым доменам (rutube.ru и др.)
 *     tags: [Proxy]
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: URL для проксирования
 *         example: https://rutube.ru/api/video/123
 *     responses:
 *       200:
 *         description: Успешный прокси-ответ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Отсутствует параметр url
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Домен не разрешён или приватный IP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Ошибка прокси-запроса
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/api/proxy', proxyLimiter, async (req, res) => { ... });
```

#### `server/routes/ai.js`

```javascript
/**
 * @openapi
 * /api/ai/kinorate/search:
 *   post:
 *     summary: Поиск рейтингов фильма через AI
 *     description: Ищет рейтинги IMDB и Кинопоиск для указанного фильма
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Название фильма для поиска
 *                 example: "Интерстеллар"
 *     responses:
 *       200:
 *         description: Рейтинги найдены
 *         headers:
 *           X-LLM-Provider:
 *             schema:
 *               type: string
 *             description: Использованный AI провайдер (google/mistral)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KinoRateResponse'
 *       400:
 *         description: Неверный запрос (отсутствует query)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Ошибка AI поиска
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/api/ai/kinorate/search', aiLimiter, async (req, res) => { ... });

/**
 * @openapi
 * /api/ai/kinorate/batch:
 *   post:
 *     summary: Пакетный поиск рейтингов фильмов
 *     description: Ищет рейтинги для нескольких фильмов за один запрос
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - queries
 *             properties:
 *               queries:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Массив названий фильмов
 *                 example: ["Интерстеллар", "Начало", "Матрица"]
 *     responses:
 *       200:
 *         description: Рейтинги найдены
 *         headers:
 *           X-LLM-Provider:
 *             schema:
 *               type: string
 *             description: Использованный AI провайдер
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/KinoRateResponse'
 *       400:
 *         description: Неверный запрос (queries не массив или содержит не строки)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Ошибка AI поиска
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/api/ai/kinorate/batch', aiLimiter, async (req, res) => { ... });
```

---

## Результат

После интеграции документация будет доступна по адресам:

| URL                                   | Описание                                |
| ------------------------------------- | --------------------------------------- |
| `http://localhost:9230/api/docs`      | Swagger UI — интерактивная документация |
| `http://localhost:9230/api/docs.json` | OpenAPI спецификация в формате JSON     |

---

## Преимущества для проекта

1. **Интерактивное тестирование** — можно тестировать все endpoints прямо из браузера без Postman
2. **Актуальная документация** — документация генерируется из кода и всегда соответствует реализации
3. **Передача проекта** — новые разработчики быстро разберутся в API
4. **Генерация клиентов** — из OpenAPI спецификации можно сгенерировать клиентские SDK
5. **Стандартизация** — единый формат описания API для всей команды

---

## Дополнительные возможности

### Генерация TypeScript типов

Можно использовать `openapi-typescript` для генерации TypeScript типов из спецификации:

```bash
npm install -D openapi-typescript
npx openapi-typescript http://localhost:9230/api/docs.json -o src/types/api.d.ts
```

### Валидация запросов

Для валидации запросов по схеме OpenAPI можно использовать `express-openapi-validator`:

```bash
npm install express-openapi-validator
```
