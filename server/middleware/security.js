import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

export const getSecurityConfig = () => {
  const proxyRateLimitWindowMs = parseInt(process.env.PROXY_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  const proxyRateLimitMaxRequests = parseInt(process.env.PROXY_RATE_LIMIT_MAX_REQUESTS) || 100;
  const aiRateLimitWindowMs = parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  const aiRateLimitMaxRequests = parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS) || 50;

  const proxyLimiter = rateLimit({
    windowMs: proxyRateLimitWindowMs,
    max: proxyRateLimitMaxRequests,
    message: { error: 'Too many requests to proxy endpoint, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const aiLimiter = rateLimit({
    windowMs: aiRateLimitWindowMs,
    max: aiRateLimitMaxRequests,
    message: { error: 'Too many requests to AI endpoints, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  return { proxyLimiter, aiLimiter };
};

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      // Allow Rutube iframe embeds
      frameSrc: ["'self'", 'https://rutube.ru', 'https://*.rutube.ru'],
      // Allow media from Rutube CDN
      mediaSrc: ["'self'", 'https:', 'blob:'],
      // Allow fonts and other resources
      fontSrc: ["'self'", 'https:', 'data:'],
    },
  },
  // Allow iframe embedding from Rutube
  frameguard: false,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
});

export const compressionMiddleware = compression();
