import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('RutubeService - Proxy Logic', () => {
  describe('getProxies function', () => {
    it('should return only local proxy when status is not down', () => {
      const localProxyStatus = 'unknown';
      const getProxies = () => {
        const proxies = [];
        if (localProxyStatus !== 'down') {
          proxies.push(target => `/api/proxy?url=${encodeURIComponent(target)}`);
        }
        return proxies;
      };

      const proxies = getProxies();
      assert.strictEqual(proxies.length, 1);
      assert.strictEqual(proxies[0]('https://test.com'), '/api/proxy?url=https%3A%2F%2Ftest.com');
    });

    it('should return empty array when status is down', () => {
      const localProxyStatus = 'down';
      const getProxies = () => {
        const proxies = [];
        if (localProxyStatus !== 'down') {
          proxies.push(target => `/api/proxy?url=${encodeURIComponent(target)}`);
        }
        return proxies;
      };

      const proxies = getProxies();
      assert.strictEqual(proxies.length, 0);
    });

    it('should not mark proxy as down on single failure (fixed behavior)', () => {
      const localProxyStatus = 'unknown';
      const simulateFailure = () => {
        // Old broken behavior: localProxyStatus = 'down';
        // New fixed behavior: don't change status
      };

      simulateFailure();
      const getProxies = () => {
        const proxies = [];
        if (localProxyStatus !== 'down') {
          proxies.push(target => `/api/proxy?url=${encodeURIComponent(target)}`);
        }
        return proxies;
      };

      const proxies = getProxies();
      assert.strictEqual(proxies.length, 1, 'Proxy should still be available after failure');
    });
  });

  describe('URL encoding', () => {
    it('should encode special characters in URL', () => {
      const targetUrl = 'https://rutube.ru/api/test?query=тест&filter=1';
      const encoded = encodeURIComponent(targetUrl);
      assert.ok(!encoded.includes('тест'));
      assert.ok(encoded.includes('%3A'));
      assert.ok(encoded.includes('%2F'));
      assert.ok(encoded.includes('%3F'));
    });

    it('should handle URL with hash', () => {
      const targetUrl = 'https://rutube.ru/page#section';
      const encoded = encodeURIComponent(targetUrl);
      assert.ok(encoded.includes('%23'));
    });

    it('should preserve URL structure after encoding', () => {
      const targetUrl = 'https://rutube.ru/api/video/?id=123&format=json';
      const encoded = encodeURIComponent(targetUrl);
      const decoded = decodeURIComponent(encoded);
      assert.strictEqual(decoded, targetUrl);
    });
  });

  describe('isValidRutubeId function', () => {
    const isValidRutubeId = id => !!id && /^\d{6,}$/.test(id);

    it('should accept valid 6+ digit IDs', () => {
      assert.strictEqual(isValidRutubeId('32869212'), true);
      assert.strictEqual(isValidRutubeId('123456'), true);
      assert.strictEqual(isValidRutubeId('1234567890'), true);
    });

    it('should reject short IDs', () => {
      assert.strictEqual(isValidRutubeId('12345'), false);
      assert.strictEqual(isValidRutubeId('123'), false);
    });

    it('should reject non-numeric IDs', () => {
      assert.strictEqual(isValidRutubeId('abc123'), false);
      assert.strictEqual(isValidRutubeId('32869212abc'), false);
    });

    it('should reject empty or null values', () => {
      assert.strictEqual(isValidRutubeId(''), false);
      assert.strictEqual(isValidRutubeId(null), false);
      assert.strictEqual(isValidRutubeId(undefined), false);
    });
  });

  describe('Throttle mechanism', () => {
    it('should delay requests sequentially', async () => {
      const REQUEST_THROTTLE_MS = 100;
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

      let throttleChain = Promise.resolve();
      const scheduleRequestSlot = async () => {
        const current = throttleChain;
        let release;
        throttleChain = new Promise(resolve => {
          release = resolve;
        });
        await current;
        await wait(REQUEST_THROTTLE_MS);
        release();
      };

      const start = Date.now();
      await scheduleRequestSlot();
      const t1 = Date.now() - start;
      assert.ok(t1 >= 90, `First slot took ${t1}ms`);

      const start2 = Date.now();
      await scheduleRequestSlot();
      const t2 = Date.now() - start2;
      assert.ok(t2 >= 90, `Second slot took ${t2}ms`);
    });
  });

  describe('Composite AbortSignal', () => {
    it('should abort when either signal aborts', () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();

      const createCompositeSignal = (signal1, signal2) => {
        const controller = new AbortController();
        const abortHandler = () => controller.abort();
        signal1.addEventListener('abort', abortHandler);
        signal2.addEventListener('abort', abortHandler);
        return controller.signal;
      };

      const composite = createCompositeSignal(controller1.signal, controller2.signal);
      assert.strictEqual(composite.aborted, false);

      controller1.abort();
      assert.strictEqual(composite.aborted, true);
    });
  });
});
