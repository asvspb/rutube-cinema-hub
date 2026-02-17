import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';

// Load local env file quietly so the test can be run locally.
// User preference: use .env (keys are stored there).
dotenv.config({ path: '.env', quiet: true });

const parseBool = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const v = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
  return defaultValue;
};

const runExternal = parseBool(process.env.MISTRAL_EXTERNAL_TEST, false);
const apiKey = process.env.MISTRAL_API_KEY;
const enabled = parseBool(process.env.MISTRAL_ENABLED, true) && Boolean(apiKey);

const baseUrl = process.env.MISTRAL_API_BASE_URL || 'https://api.mistral.ai/v1';
const model = process.env.MISTRAL_MODEL_NAME || 'mistral-medium-2505';

const timeoutMs = Number.parseInt(process.env.LLM_TIMEOUT_SEC || '30', 10) * 1000;

test(
  'Mistral API is reachable and returns a completion (external)',
  { skip: !runExternal || !enabled },
  async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a connectivity test. Reply with exactly one word: pong',
            },
            { role: 'user', content: 'ping' },
          ],
          max_tokens: 8,
          temperature: 0,
        }),
        signal: controller.signal,
      });

      const raw = await resp.text();
      assert.equal(resp.ok, true, `HTTP ${resp.status}: ${raw.slice(0, 500)}`);

      const json = JSON.parse(raw);
      const content = json?.choices?.[0]?.message?.content;
      assert.equal(typeof content, 'string');
      assert.match(content.trim().toLowerCase(), /pong/);
    } finally {
      clearTimeout(timeoutId);
    }
  }
);
