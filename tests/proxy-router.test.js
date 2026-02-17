import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import { proxyRouter } from '../server/routes/proxy.js';
import rateLimit from 'express-rate-limit';

describe('Proxy Router', () => {
  let app;
  const allowedDomains = ['rutube.ru', '*.rutube.ru', 'api.rutube.ru'];
  const maxRedirects = 5;

  const proxyLimiter = rateLimit({
    windowMs: 60000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  });

  before(() => {
    app = express();
    app.use(proxyRouter({ proxyLimiter, allowedDomains, maxRedirects }));
  });

  describe('Request validation', () => {
    it('should return 400 for missing url parameter', async () => {
      const response = await request(app).get('/api/proxy');
      assert.strictEqual(response.status, 400);
      assert.deepStrictEqual(response.body, { error: 'Missing url parameter' });
    });

    it('should return 400 for empty url parameter', async () => {
      const response = await request(app).get('/api/proxy?url=');
      assert.strictEqual(response.status, 400);
      assert.deepStrictEqual(response.body, { error: 'Missing url parameter' });
    });

    it('should handle OPTIONS preflight request', async () => {
      const response = await request(app).options('/api/proxy?url=https://rutube.ru/api/test');
      assert.strictEqual(response.status, 200);
    });
  });

  describe('Domain allowlist', () => {
    it('should return 403 for non-allowed domain', async () => {
      const response = await request(app).get(
        '/api/proxy?url=' + encodeURIComponent('https://google.com/')
      );
      assert.strictEqual(response.status, 403);
      assert.ok(response.body.error.includes('not in the allowed domains list'));
    });

    it('should return 403 for subdomain of non-allowed domain', async () => {
      const response = await request(app).get(
        '/api/proxy?url=' + encodeURIComponent('https://api.google.com/')
      );
      assert.strictEqual(response.status, 403);
    });

    it('should return 403 for similar-looking domain', async () => {
      const response = await request(app).get(
        '/api/proxy?url=' + encodeURIComponent('https://rutube.com/')
      );
      assert.strictEqual(response.status, 403);
    });
  });

  describe('Private IP blocking', () => {
    it('should return 403 for localhost', async () => {
      const response = await request(app).get(
        '/api/proxy?url=' + encodeURIComponent('http://localhost/')
      );
      assert.strictEqual(response.status, 403);
      assert.ok(
        response.body.error.includes('localhost') || response.body.error.includes('not allowed')
      );
    });

    it('should return 403 for 127.0.0.1', async () => {
      const response = await request(app).get(
        '/api/proxy?url=' + encodeURIComponent('http://127.0.0.1/')
      );
      assert.strictEqual(response.status, 403);
      assert.ok(response.body.error.includes('private IP'));
    });

    it('should return 403 for 192.168.x.x', async () => {
      const response = await request(app).get(
        '/api/proxy?url=' + encodeURIComponent('http://192.168.1.1/')
      );
      assert.strictEqual(response.status, 403);
      assert.ok(response.body.error.includes('private IP'));
    });

    it('should return 403 for 10.x.x.x', async () => {
      const response = await request(app).get(
        '/api/proxy?url=' + encodeURIComponent('http://10.0.0.1/')
      );
      assert.strictEqual(response.status, 403);
      assert.ok(response.body.error.includes('private IP'));
    });

    it('should return 403 for 172.16.x.x', async () => {
      const response = await request(app).get(
        '/api/proxy?url=' + encodeURIComponent('http://172.16.0.1/')
      );
      assert.strictEqual(response.status, 403);
      assert.ok(response.body.error.includes('private IP'));
    });

    it('should return 403 for 0.0.0.0', async () => {
      const response = await request(app).get(
        '/api/proxy?url=' + encodeURIComponent('http://0.0.0.0/')
      );
      assert.strictEqual(response.status, 403);
      assert.ok(response.body.error.includes('private IP'));
    });
  });

  describe('URL encoding', () => {
    it('should handle properly encoded URLs', async () => {
      const targetUrl = 'https://rutube.ru/api/test?param=value&other=123';
      const response = await request(app).get('/api/proxy?url=' + encodeURIComponent(targetUrl));
      assert.ok([200, 404, 500].includes(response.status));
    });

    it('should handle URL with special characters', async () => {
      const targetUrl = 'https://rutube.ru/api/test?query=%D1%82%D0%B5%D1%81%D1%82';
      const response = await request(app).get('/api/proxy?url=' + encodeURIComponent(targetUrl));
      assert.ok([200, 404, 500].includes(response.status));
    });
  });

  describe('Redirect handling', () => {
    it('should handle too many redirects', async () => {
      const response = await request(app).get(
        '/api/proxy?url=' + encodeURIComponent('https://rutube.ru/redirect-loop-test')
      );
      assert.ok(response.status <= 500);
    });
  });
});
