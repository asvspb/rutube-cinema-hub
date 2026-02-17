import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
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

const startMistralStub = async () => {
  const port = await getFreePort();

  const server = http.createServer(async (req, res) => {
    const { method, url, headers } = req;

    if (method !== 'POST' || url !== '/v1/chat/completions') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
      return;
    }

    const auth = headers.authorization;
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Unauthorized' }));
      return;
    }

    let body = '';
    for await (const chunk of req) body += chunk;

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = null;
    }

    const lastUserMessage = parsed?.messages?.[parsed.messages.length - 1]?.content ?? '';
    const wantArray = typeof lastUserMessage === 'string' && lastUserMessage.includes('JSON array');

    const single = {
      title: 'Тестовый фильм',
      originalTitle: 'Test Movie',
      // Intentionally wrong types to ensure backend normalizes them.
      year: 2000,
      kpRating: 0,
      kpVotes: '0',
      imdbRating: 0,
      description: 'Тестовое описание.',
      awards: 'Oscar Nominated',
    };

    const content = wantArray ? JSON.stringify([single]) : JSON.stringify(single);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        id: 'stub',
        object: 'chat.completion',
        choices: [{ index: 0, message: { role: 'assistant', content } }],
      })
    );
  });

  await new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });

  return {
    server,
    baseUrl: `http://127.0.0.1:${port}/v1`,
  };
};

const startBackend = async ({ port, mistralBaseUrl }) => {
  const child = spawn(process.execPath, ['server/index.js'], {
    env: {
      ...process.env,
      PORT: String(port),
      LLM_PROVIDER: 'mistral',
      // Force Mistral provider and point it to our local stub.
      MISTRAL_ENABLED: 'true',
      MISTRAL_API_KEY: 'stub-key',
      MISTRAL_API_BASE_URL: mistralBaseUrl,
      // Ensure Gemini never triggers.
      GEMINI_ENABLED: 'false',
    },
    stdio: ['ignore', 'ignore', 'ignore'],
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForHttp(`${baseUrl}/api/proxy`);

  return { child, baseUrl };
};

test('KinoRate AI search works with stubbed Mistral API', async () => {
  const mistral = await startMistralStub();
  const port = await getFreePort();
  const backend = await startBackend({ port, mistralBaseUrl: mistral.baseUrl });

  try {
    const res = await fetch(`${backend.baseUrl}/api/ai/kinorate/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Anything' }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-llm-provider'), 'mistral');

    const data = await res.json();
    assert.equal(typeof data, 'object');
    assert.equal(data.title, 'Тестовый фильм');
    assert.equal(data.originalTitle, 'Test Movie');
    // Backend should normalize number -> string.
    assert.equal(data.year, '2000');
    assert.equal(typeof data.description, 'string');
    // Backend should normalize string -> string[].
    assert.ok(Array.isArray(data.awards));
    assert.deepEqual(data.awards, ['Oscar Nominated']);
  } finally {
    backend.child.kill();
    mistral.server.close();
  }
});

test('KinoRate AI batch works with stubbed Mistral API', async () => {
  const mistral = await startMistralStub();
  const port = await getFreePort();
  const backend = await startBackend({ port, mistralBaseUrl: mistral.baseUrl });

  try {
    const res = await fetch(`${backend.baseUrl}/api/ai/kinorate/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries: ['Anything'] }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-llm-provider'), 'mistral');

    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.equal(data.length, 1);

    assert.equal(data[0].title, 'Тестовый фильм');
    assert.equal(data[0].originalTitle, 'Test Movie');
    assert.equal(data[0].year, '2000');
    assert.ok(Array.isArray(data[0].awards));
    assert.deepEqual(data[0].awards, ['Oscar Nominated']);
  } finally {
    backend.child.kill();
    mistral.server.close();
  }
});
