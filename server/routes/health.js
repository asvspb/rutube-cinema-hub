import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

healthRouter.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
