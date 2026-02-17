import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { validateAndResolveURL } from '../server/middleware/validation.js';

describe('Validation Middleware', () => {
  const allowedDomains = ['rutube.ru', '*.rutube.ru', 'api.rutube.ru'];

  describe('isAllowedDomain (via validateAndResolveURL)', () => {
    it('should accept exact domain match', async () => {
      const result = await validateAndResolveURL('https://rutube.ru/api/test', allowedDomains);
      assert.strictEqual(result.hostname, 'rutube.ru');
    });

    it('should accept subdomain with wildcard', async () => {
      const result = await validateAndResolveURL(
        'https://video.rutube.ru/api/test',
        allowedDomains
      );
      assert.strictEqual(result.hostname, 'video.rutube.ru');
    });

    it('should accept api.rutube.ru', async () => {
      try {
        const result = await validateAndResolveURL('https://api.rutube.ru/test', allowedDomains);
        assert.strictEqual(result.hostname, 'api.rutube.ru');
      } catch (e) {
        if (e.message.includes('could not be resolved')) {
          console.log('  Skipping: DNS resolution failed for api.rutube.ru');
        } else {
          throw e;
        }
      }
    });

    it('should reject non-allowed domain', async () => {
      await assert.rejects(
        async () => validateAndResolveURL('https://google.com/', allowedDomains),
        /not in the allowed domains list/
      );
    });

    it('should reject subdomain of non-allowed domain', async () => {
      await assert.rejects(
        async () => validateAndResolveURL('https://api.google.com/', allowedDomains),
        /not in the allowed domains list/
      );
    });

    it('should reject similar-looking domain', async () => {
      await assert.rejects(
        async () => validateAndResolveURL('https://rutube.com/', allowedDomains),
        /not in the allowed domains list/
      );
    });
  });

  describe('isPrivateIP (via validateAndResolveURL)', () => {
    it('should reject localhost', async () => {
      await assert.rejects(
        async () => validateAndResolveURL('http://localhost/test', allowedDomains),
        /not allowed/
      );
    });

    it('should reject 127.0.0.1', async () => {
      await assert.rejects(
        async () => validateAndResolveURL('http://127.0.0.1/test', allowedDomains),
        /private IP/
      );
    });

    it('should reject 192.168.x.x', async () => {
      await assert.rejects(
        async () => validateAndResolveURL('http://192.168.1.1/test', allowedDomains),
        /private IP/
      );
    });

    it('should reject 10.x.x.x', async () => {
      await assert.rejects(
        async () => validateAndResolveURL('http://10.0.0.1/test', allowedDomains),
        /private IP/
      );
    });

    it('should reject 172.16-31.x.x', async () => {
      await assert.rejects(
        async () => validateAndResolveURL('http://172.16.0.1/test', allowedDomains),
        /private IP/
      );
    });

    it('should reject 0.0.0.0', async () => {
      await assert.rejects(
        async () => validateAndResolveURL('http://0.0.0.0/test', allowedDomains),
        /private IP/
      );
    });
  });

  describe('URL parsing', () => {
    it('should reject invalid URL', async () => {
      await assert.rejects(
        async () => validateAndResolveURL('not-a-url', allowedDomains),
        /Invalid URL/
      );
    });

    it('should reject missing protocol', async () => {
      await assert.rejects(
        async () => validateAndResolveURL('rutube.ru/api', allowedDomains),
        /Invalid URL/
      );
    });

    it('should parse URL with query params', async () => {
      const result = await validateAndResolveURL(
        'https://rutube.ru/api/test?param=value&other=123',
        allowedDomains
      );
      assert.strictEqual(result.hostname, 'rutube.ru');
      assert.strictEqual(result.pathname, '/api/test');
      assert.strictEqual(result.search, '?param=value&other=123');
    });

    it('should parse URL with port', async () => {
      const result = await validateAndResolveURL('https://rutube.ru:8443/api/test', allowedDomains);
      assert.strictEqual(result.hostname, 'rutube.ru');
      assert.strictEqual(result.port, '8443');
    });
  });
});
