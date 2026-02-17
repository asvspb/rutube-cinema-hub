import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';

const getFreePort = async () =>
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });

const waitForHttp = async (url, timeoutMs = 10_000) => {
  const start = Date.now();

  while (true) {
    try {
      const res = await fetch(url);
      // Any status means the server is reachable.
      if (typeof res.status === 'number') return;
    } catch {
      // ignore
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timeout waiting for server at ${url}`);
    }
    await new Promise(r => setTimeout(r, 150));
  }
};

const startServer = async ({ port }) => {
  const child = spawn(process.execPath, ['server/index.js'], {
    env: {
      ...process.env,
      PORT: String(port),
      // Ensure we don't accidentally hit external providers in validation tests.
      GEMINI_ENABLED: 'false',
      MISTRAL_ENABLED: 'false',
      LLM_PROVIDER: 'auto',
    },
    stdio: ['ignore', 'ignore', 'ignore'],
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  // /api/proxy without url returns 400 but doesn't call external.
  await waitForHttp(`${baseUrl}/api/proxy`);

  return {
    child,
    baseUrl,
  };
};

test('KinoRate AI endpoints validate request bodies', async () => {
  const port = await getFreePort();
  const { child, baseUrl } = await startServer({ port });

  try {
    // search: missing query
    {
      const res = await fetch(`${baseUrl}/api/ai/kinorate/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    }

    // search: non-string query
    {
      const res = await fetch(`${baseUrl}/api/ai/kinorate/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 123 }),
      });
      assert.equal(res.status, 400);
    }

    // batch: missing queries
    {
      const res = await fetch(`${baseUrl}/api/ai/kinorate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    }

    // batch: invalid queries element
    {
      const res = await fetch(`${baseUrl}/api/ai/kinorate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: ['ok', 1] }),
      });
      assert.equal(res.status, 400);
    }
  } finally {
    child.kill();
  }
});
