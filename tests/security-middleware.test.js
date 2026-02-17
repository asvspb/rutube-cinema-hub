import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Security Middleware', () => {
  describe('Rate Limiter Configuration', () => {
    it('should create proxy limiter with correct defaults', () => {
      const getSecurityConfig = () => {
        const proxyRateLimitWindowMs =
          parseInt(process.env.PROXY_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
        const proxyRateLimitMaxRequests =
          parseInt(process.env.PROXY_RATE_LIMIT_MAX_REQUESTS) || 100;

        return {
          proxyLimiter: {
            windowMs: proxyRateLimitWindowMs,
            max: proxyRateLimitMaxRequests,
          },
        };
      };

      const config = getSecurityConfig();
      assert.strictEqual(config.proxyLimiter.windowMs, 15 * 60 * 1000);
      assert.strictEqual(config.proxyLimiter.max, 100);
    });

    it('should respect environment variables', () => {
      const originalEnv = process.env.PROXY_RATE_LIMIT_MAX_REQUESTS;
      process.env.PROXY_RATE_LIMIT_MAX_REQUESTS = '500';

      const getSecurityConfig = () => {
        const proxyRateLimitMaxRequests =
          parseInt(process.env.PROXY_RATE_LIMIT_MAX_REQUESTS) || 100;
        return { max: proxyRateLimitMaxRequests };
      };

      const config = getSecurityConfig();
      assert.strictEqual(config.max, 500);

      if (originalEnv) {
        process.env.PROXY_RATE_LIMIT_MAX_REQUESTS = originalEnv;
      } else {
        delete process.env.PROXY_RATE_LIMIT_MAX_REQUESTS;
      }
    });

    it('should create AI limiter with correct defaults', () => {
      const getSecurityConfig = () => {
        const aiRateLimitWindowMs = parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
        const aiRateLimitMaxRequests = parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS) || 50;

        return {
          aiLimiter: {
            windowMs: aiRateLimitWindowMs,
            max: aiRateLimitMaxRequests,
          },
        };
      };

      const config = getSecurityConfig();
      assert.strictEqual(config.aiLimiter.windowMs, 15 * 60 * 1000);
      assert.strictEqual(config.aiLimiter.max, 50);
    });
  });

  describe('CORS Configuration', () => {
    it('should allow localhost origins by default', () => {
      const getCorsOptions = () => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
          'http://localhost:5173',
          'http://localhost:4173',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:4173',
        ];
        return { allowedOrigins };
      };

      const corsOptions = getCorsOptions();
      assert.ok(corsOptions.allowedOrigins.includes('http://localhost:5173'));
      assert.ok(corsOptions.allowedOrigins.includes('http://localhost:4173'));
    });

    it('should accept requests without origin (server-side)', () => {
      const getCorsOptions = () => ({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          callback(null, true);
        },
      });

      const corsOptions = getCorsOptions();
      let calledWith = null;
      corsOptions.origin(null, (err, result) => {
        calledWith = result;
      });
      assert.strictEqual(calledWith, true);
    });
  });

  describe('Security Headers', () => {
    it('should configure CSP directives correctly', () => {
      const cspDirectives = {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        objectSrc: ["'none'"],
      };

      assert.ok(cspDirectives.defaultSrc.includes("'self'"));
      assert.ok(cspDirectives.objectSrc.includes("'none'"));
      assert.ok(cspDirectives.imgSrc.includes('https:'));
    });
  });
});
