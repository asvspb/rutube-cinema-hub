import { Router } from 'express';
import { kinoRateSearch, kinoRateBatch, normalizeKinoRate } from '../services/llm.js';
import { writeLog } from '../middleware/logging.js';

// Безопасное логирование ошибок (без console.error для предотвращения EPIPE)
const logError = (message, error) => {
  try {
    writeLog({
      level: 'error',
      source: 'ai',
      message,
      context: { error: error?.message || String(error) },
    });
  } catch {
    // Игнорируем ошибки логирования
  }
};

export const aiRouter = aiLimiter => {
  const router = Router();

  router.post('/api/ai/kinorate/search', aiLimiter, async (req, res) => {
    const query = req.body?.query;
    if (!query || typeof query !== 'string') {
      res.status(400).json({
        error: 'Missing or invalid "query" in request body',
      });
      return;
    }

    try {
      const { provider, data } = await kinoRateSearch(query);
      res.setHeader('X-LLM-Provider', provider);
      res.status(200).json(normalizeKinoRate(data));
    } catch (e) {
      logError('KinoRate AI search error', e);
      if (e.message && e.message.includes('Too many requests')) {
        res.status(429).json({ error: 'Rate limit exceeded' });
      } else {
        res.status(500).json({ error: 'KinoRate AI search failed' });
      }
    }
  });

  router.post('/api/ai/kinorate/batch', aiLimiter, async (req, res) => {
    const queries = req.body?.queries;
    if (!Array.isArray(queries) || !queries.every(q => typeof q === 'string')) {
      res.status(400).json({
        error: 'Missing or invalid "queries" (string[]) in request body',
      });
      return;
    }

    try {
      const { provider, data } = await kinoRateBatch(queries);
      res.setHeader('X-LLM-Provider', provider);
      res.status(200).json(normalizeKinoRate(data));
    } catch (e) {
      logError('KinoRate AI batch error', e);
      if (e.message && e.message.includes('Too many requests')) {
        res.status(429).json({ error: 'Rate limit exceeded' });
      } else {
        res.status(500).json({ error: 'KinoRate AI batch failed' });
      }
    }
  });

  return router;
};
