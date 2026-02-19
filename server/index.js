import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv, validateEnv } from './config/env.js';
import { getCorsOptions } from './config/cors.js';
import {
  compressionMiddleware,
  getSecurityConfig,
  securityMiddleware,
} from './middleware/security.js';
import { errorHandler, registerProcessHandlers } from './middleware/logging.js';
import { healthRouter } from './routes/health.js';
import { logsRouter } from './routes/logs.js';
import { aiRouter } from './routes/ai.js';
import { proxyRouter } from './routes/proxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv();
validateEnv();
registerProcessHandlers();

const app = express();
const PORT = process.env.PORT || 9230;

const { proxyLimiter, aiLimiter } = getSecurityConfig();

const allowedDomains = (process.env.ALLOWED_PROXY_DOMAINS || 'rutube.ru,*.rutube.ru,api.rutube.ru')
  .split(',')
  .map(domain => domain.trim());

const maxRedirects = parseInt(process.env.PROXY_MAX_REDIRECTS) || 5;

app.use(securityMiddleware);
app.use(cors(getCorsOptions()));
app.use(compressionMiddleware);
app.use(express.json({ limit: '1mb' }));

app.use(healthRouter);
app.use(logsRouter);
app.use(aiRouter(aiLimiter));
app.use(proxyRouter({ proxyLimiter, allowedDomains, maxRedirects }));

app.use(errorHandler);
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kino Club Proxy Server running on port ${PORT}`);
  console.log(`Proxy endpoint available at http://localhost:${PORT}/api/proxy`);
});
