import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

describe('Proxy Integration Tests', () => {
  let serverProcess;
  let serverReady = false;
  const TEST_PORT = 9998;
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  before(async () => {
    serverProcess = spawn('node', ['server/index.js'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
        PROXY_RATE_LIMIT_MAX_REQUESTS: '1000',
        PROXY_RATE_LIMIT_WINDOW_MS: '60000',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProcess.stdout.on('data', data => {
      if (data.toString().includes('running on port')) {
        serverReady = true;
      }
    });

    serverProcess.stderr.on('data', data => {
      console.error('Server error:', data.toString());
    });

    let attempts = 0;
    while (!serverReady && attempts < 30) {
      await sleep(500);
      attempts++;
    }

    if (!serverReady) {
      console.log('Server may not be fully ready, proceeding anyway...');
    }
  });

  after(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  describe('Health check', () => {
    it('should respond to health endpoint', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.status, 'ok');
    });
  });

  describe('Rutube API endpoints', () => {
    it('should fetch metainfo from rutube.ru', async () => {
      const url = encodeURIComponent('https://rutube.ru/api/metainfo/');
      const response = await fetch(`${BASE_URL}/api/proxy?url=${url}`);
      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.ok(data.studio);
    });

    it('should fetch video list from rutube channel', async () => {
      const url = encodeURIComponent(
        'https://rutube.ru/api/video/person/32869212/?client=android&format=json'
      );
      const response = await fetch(`${BASE_URL}/api/proxy?url=${url}`);
      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.ok(data.results || data.has_next !== undefined);
    });

    it('should fetch playlist from rutube', async () => {
      const url = encodeURIComponent(
        'https://rutube.ru/api/playlist/user/32869212/?client=android&format=json'
      );
      const response = await fetch(`${BASE_URL}/api/proxy?url=${url}`);
      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.ok(Array.isArray(data.results));
    });

    it('should handle paginated requests', async () => {
      const url = encodeURIComponent(
        'https://rutube.ru/api/video/person/32869212/?client=android&format=json&page=2'
      );
      const response = await fetch(`${BASE_URL}/api/proxy?url=${url}`);
      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.ok(data.page !== undefined || data.results);
    });
  });

  describe('Error handling', () => {
    it('should return 400 for missing URL', async () => {
      const response = await fetch(`${BASE_URL}/api/proxy`);
      assert.strictEqual(response.status, 400);
    });

    it('should return 403 for blocked domain', async () => {
      const url = encodeURIComponent('https://google.com/');
      const response = await fetch(`${BASE_URL}/api/proxy?url=${url}`);
      assert.strictEqual(response.status, 403);
    });

    it('should return 403 for localhost', async () => {
      const url = encodeURIComponent('http://localhost/');
      const response = await fetch(`${BASE_URL}/api/proxy?url=${url}`);
      assert.strictEqual(response.status, 403);
    });

    it('should return 403 for private IP', async () => {
      const url = encodeURIComponent('http://192.168.1.1/');
      const response = await fetch(`${BASE_URL}/api/proxy?url=${url}`);
      assert.strictEqual(response.status, 403);
    });
  });

  describe('Response headers', () => {
    it('should forward content-type header', async () => {
      const url = encodeURIComponent('https://rutube.ru/api/metainfo/');
      const response = await fetch(`${BASE_URL}/api/proxy?url=${url}`);
      assert.ok(response.headers.get('content-type'));
    });

    it('should not forward transfer-encoding header from upstream', async () => {
      const url = encodeURIComponent('https://rutube.ru/api/metainfo/');
      const response = await fetch(`${BASE_URL}/api/proxy?url=${url}`);
      const te = response.headers.get('transfer-encoding');
      assert.strictEqual(te, null);
    });
  });

  describe('Performance', () => {
    it('should complete request within reasonable time', async () => {
      const url = encodeURIComponent('https://rutube.ru/api/metainfo/');
      const start = Date.now();
      const response = await fetch(`${BASE_URL}/api/proxy?url=${url}`);
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 10000, `Request took ${elapsed}ms, expected < 10000ms`);
      assert.strictEqual(response.status, 200);
    });

    it('should handle concurrent requests', async () => {
      const urls = ['https://rutube.ru/api/metainfo/', 'https://rutube.ru/api/metainfo/studio/'];

      const start = Date.now();
      const responses = await Promise.all(
        urls.map(u => fetch(`${BASE_URL}/api/proxy?url=${encodeURIComponent(u)}`))
      );
      const elapsed = Date.now() - start;

      assert.ok(elapsed < 15000, `Concurrent requests took ${elapsed}ms`);
      responses.forEach(r => assert.ok([200, 404].includes(r.status)));
    });
  });
});
