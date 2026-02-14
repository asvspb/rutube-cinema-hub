import { Router } from 'express';
import { writeLog } from '../middleware/logging.js';

export const logsRouter = Router();

logsRouter.post('/api/logs', (req, res) => {
  const logEntry = req.body;
  console.log('[CLIENT LOG]', logEntry);
  writeLog({
    source: 'client',
    ...logEntry,
  });
  res.status(200).json({ status: 'ok' });
});
