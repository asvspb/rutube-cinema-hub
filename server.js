import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables.
// Precedence: explicit process env > .env.local > .env
const envFromFiles = {};
// NOTE: user preference: .env takes priority over .env.local
const envPaths = [path.join(__dirname, '.env.local'), path.join(__dirname, '.env')];
for (const p of envPaths) {
  if (!fs.existsSync(p)) continue;
  try {
    const parsed = dotenv.parse(fs.readFileSync(p));
    Object.assign(envFromFiles, parsed); // later files override earlier ones
  } catch (e) {
    console.warn(`[dotenv] Failed to read ${p}:`, e?.message || e);
  }
}
for (const [key, value] of Object.entries(envFromFiles)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const app = express();
const PORT = process.env.PORT || 9230; // Using a different port than the frontend

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

const LOG_FILE = path.join(__dirname, 'logs', 'error_logs.json');

// Ensure logs directory exists
const LOGS_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Helper to write logs
const writeLog = (logEntry) => {
  try {
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      logs = JSON.parse(content || '[]');
    }
    logs.push({
      timestamp: new Date().toISOString(),
      ...logEntry
    });
    // Keep only last 1000 logs
    if (logs.length > 1000) logs = logs.slice(-1000);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Failed to write log:', e);
  }
};

// Logging endpoint
app.post('/api/logs', (req, res) => {
  const logEntry = req.body;
  console.log('[CLIENT LOG]', logEntry);
  writeLog(logEntry);
  res.status(200).json({ status: 'ok' });
});

// --- KinoRate AI (LLM providers: Gemini + Mistral) ---
const parseBool = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  const v = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
  return defaultValue;
};

const parseIntEnv = (value, fallback) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
};

const LLM_TIMEOUT_SEC = parseIntEnv(process.env.LLM_TIMEOUT_SEC, 30);
const LLM_MAX_TOKENS = parseIntEnv(process.env.LLM_MAX_TOKENS, 512);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
const GEMINI_ENABLED = parseBool(process.env.GEMINI_ENABLED, true) && Boolean(GEMINI_API_KEY);

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL_NAME = process.env.MISTRAL_MODEL_NAME || 'mistral-medium-2505';
const MISTRAL_API_BASE_URL = process.env.MISTRAL_API_BASE_URL || 'https://api.mistral.ai/v1';
const MISTRAL_ENABLED = parseBool(process.env.MISTRAL_ENABLED, true) && Boolean(MISTRAL_API_KEY);

const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'auto').trim().toLowerCase(); // gemini | mistral | auto

const geminiClient = GEMINI_ENABLED ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const KINORATE_SYSTEM_INSTRUCTION_BASE = `
Act as a "Cinema Intelligence Agent" for the KinoRate AI application.
Your goal is to retrieve accurate movie ratings from Kinopoisk (KP) and IMDb, and strictly verify Major Awards (Oscars/Academy Awards).

Rules:
1. Fix user typos (e.g., "shoshank" -> "The Shawshank Redemption").
2. If the query is ambiguous, prefer the most acclaimed version.
3. Always localize the 'title' and 'description' to Russian.
4. 'originalTitle' should be in the original language.
5. If ratings are not found, return 0 for that rating.
6. 'kpVotes' should be a string like "900K" or "1.2M".
7. 'description' should be a short, engaging plot summary in Russian.
8. 'awards': Check specifically for Academy Awards (Oscars).
   - If the movie WON any Oscar, add string "Oscar Won".
   - If it was NOMINATED but didn't win, add "Oscar Nominated".
   - You can add specific major wins like "Best Picture", "Best Actor".
   - IGNORE minor festivals unless requested. Focus on Oscars.
`;

const KINORATE_SYSTEM_INSTRUCTION_GEMINI =
  KINORATE_SYSTEM_INSTRUCTION_BASE +
  `\n9. Use the googleSearch tool to find up-to-date information.\n`;

const createKinoRateSinglePrompt = (query) =>
  `Find ratings and Oscar status for the movie: "${query}".\n` +
  `Return ONLY valid JSON (no markdown, no code fences) with keys: title (string), originalTitle (string), year (string), kpRating (number), kpVotes (string), imdbRating (number), description (string), awards (optional array of strings).`;

const createKinoRateBatchPrompt = (queries) => {
  const joined = queries.map((q, i) => `${i + 1}. ${q}`).join('\n');
  return (
    `Find ratings and Oscar status for the following movies:\n${joined}\n` +
    `Return ONLY valid JSON (no markdown, no code fences) as a JSON array of objects in the same order. ` +
    `Each object must have keys: title (string), originalTitle (string), year (string), kpRating (number), kpVotes (string), imdbRating (number), description (string), awards (optional array of strings).`
  );
};

const stripCodeFences = (text) =>
  text.replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1').trim();

const extractJsonSubstring = (text, expected) => {
  const s = stripCodeFences(text);
  const firstObj = s.indexOf('{');
  const lastObj = s.lastIndexOf('}');
  const firstArr = s.indexOf('[');
  const lastArr = s.lastIndexOf(']');

  const trySlice = (start, end) =>
    start !== -1 && end !== -1 && end > start ? s.slice(start, end + 1) : null;

  if (expected === 'array') {
    return trySlice(firstArr, lastArr) || trySlice(firstObj, lastObj);
  }
  if (expected === 'object') {
    return trySlice(firstObj, lastObj) || trySlice(firstArr, lastArr);
  }
  return trySlice(firstObj, lastObj) || trySlice(firstArr, lastArr);
};

const parseJsonFromText = (text, expected = 'any') => {
  if (!text || typeof text !== 'string') return null;
  const cleaned = stripCodeFences(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    const candidate = extractJsonSubstring(cleaned, expected);
    if (!candidate) return null;
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
};

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter((v) => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    const s = value.trim();
    return s ? [s] : [];
  }
  return [];
};

const normalizeMovieRatingData = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;

  const out = { ...value };

  if (out.year !== undefined && out.year !== null && typeof out.year !== 'string') {
    out.year = String(out.year);
  }

  if (out.kpRating !== undefined && typeof out.kpRating === 'string') {
    const n = Number.parseFloat(out.kpRating.replace(',', '.'));
    if (Number.isFinite(n)) out.kpRating = n;
  }

  if (out.imdbRating !== undefined && typeof out.imdbRating === 'string') {
    const n = Number.parseFloat(out.imdbRating.replace(',', '.'));
    if (Number.isFinite(n)) out.imdbRating = n;
  }

  if (
    out.kpVotes !== undefined &&
    out.kpVotes !== null &&
    typeof out.kpVotes !== 'string'
  ) {
    out.kpVotes = String(out.kpVotes);
  }

  const awards = normalizeStringArray(out.awards);
  if (awards.length > 0) {
    out.awards = awards;
  } else if (out.awards !== undefined) {
    delete out.awards;
  }

  const sources = normalizeStringArray(out.sources);
  if (sources.length > 0) {
    out.sources = sources;
  } else if (out.sources !== undefined) {
    delete out.sources;
  }

  return out;
};

const normalizeKinoRatePayload = (value) => {
  if (Array.isArray(value)) return value.map(normalizeMovieRatingData);
  return normalizeMovieRatingData(value);
};

const withTimeout = async (promise, timeoutMs, label) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(label || `Timeout after ${timeoutMs}ms`)),
      timeoutMs
    );
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const callMistralChat = async (messages) => {
  if (!MISTRAL_ENABLED) {
    throw new Error('Mistral provider disabled or missing MISTRAL_API_KEY');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_SEC * 1000);

  try {
    const resp = await fetch(`${MISTRAL_API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL_NAME,
        messages,
        max_tokens: LLM_MAX_TOKENS,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    const raw = await resp.text();
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      json = null;
    }

    if (!resp.ok) {
      throw new Error(`Mistral API error ${resp.status}: ${raw.slice(0, 2000)}`);
    }

    const content = json?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const mistralSearchMovieRatings = async (query) => {
  const content = await callMistralChat([
    { role: 'system', content: KINORATE_SYSTEM_INSTRUCTION_BASE },
    { role: 'user', content: createKinoRateSinglePrompt(query) },
  ]);
  if (!content) return null;

  const parsed = parseJsonFromText(content, 'object');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  return parsed;
};

const mistralAnalyzeBatch = async (queries) => {
  const content = await callMistralChat([
    { role: 'system', content: KINORATE_SYSTEM_INSTRUCTION_BASE },
    { role: 'user', content: createKinoRateBatchPrompt(queries) },
  ]);
  if (!content) return [];

  const parsed = parseJsonFromText(content, 'array');
  return Array.isArray(parsed) ? parsed : [];
};

const movieRatingSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    originalTitle: { type: Type.STRING },
    year: { type: Type.STRING },
    kpRating: { type: Type.NUMBER },
    kpVotes: { type: Type.STRING },
    imdbRating: { type: Type.NUMBER },
    description: { type: Type.STRING },
    awards: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "List of major awards status, e.g., 'Oscar Won', 'Oscar Nominated', 'Best Picture'",
    },
  },
  required: [
    'title',
    'originalTitle',
    'year',
    'kpRating',
    'kpVotes',
    'imdbRating',
    'description',
  ],
};

const batchSchema = {
  type: Type.ARRAY,
  items: movieRatingSchema,
};

const geminiSearchMovieRatings = async (query) => {
  if (!geminiClient) {
    throw new Error('Gemini provider disabled or missing GEMINI_API_KEY');
  }

  const response = await withTimeout(
    geminiClient.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: `Find ratings and awards for the movie: "${query}"`,
      config: {
        systemInstruction: KINORATE_SYSTEM_INSTRUCTION_GEMINI,
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: movieRatingSchema,
        maxOutputTokens: LLM_MAX_TOKENS,
      },
    }),
    LLM_TIMEOUT_SEC * 1000,
    'Gemini request timeout'
  );

  const text = response.text;
  if (!text) return null;

  const data = JSON.parse(text);

  const groundingChunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const sources = groundingChunks
    ?.map((c) => c.web?.uri)
    .filter((uri) => typeof uri === 'string');

  return { ...data, sources };
};

const geminiAnalyzeBatch = async (queries) => {
  if (!geminiClient) {
    throw new Error('Gemini provider disabled or missing GEMINI_API_KEY');
  }

  const joinedQueries = queries.map((q, i) => `${i + 1}. ${q}`).join('\n');
  const response = await withTimeout(
    geminiClient.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: `Find ratings and Oscar status for the following movies:\n${joinedQueries}`,
      config: {
        systemInstruction:
          KINORATE_SYSTEM_INSTRUCTION_GEMINI +
          '\nReturn a JSON array of results in the same order.',
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: batchSchema,
        maxOutputTokens: LLM_MAX_TOKENS,
      },
    }),
    LLM_TIMEOUT_SEC * 1000,
    'Gemini request timeout'
  );

  const text = response.text;
  if (!text) return [];

  const data = JSON.parse(text);
  return Array.isArray(data) ? data : [];
};

const selectProvider = () => {
  if (LLM_PROVIDER === 'gemini') return 'gemini';
  if (LLM_PROVIDER === 'mistral') return 'mistral';

  // auto
  if (GEMINI_ENABLED) return 'gemini';
  if (MISTRAL_ENABLED) return 'mistral';
  return null;
};

const kinoRateSearch = async (query) => {
  const selected = selectProvider();
  if (!selected) {
    throw new Error(
      'No LLM provider enabled. Configure GEMINI_API_KEY or MISTRAL_API_KEY.'
    );
  }

  if (selected === 'gemini') {
    try {
      return { provider: 'gemini', data: await geminiSearchMovieRatings(query) };
    } catch (e) {
      if (LLM_PROVIDER === 'auto' && MISTRAL_ENABLED) {
        console.warn(
          '[LLM] Gemini failed, falling back to Mistral:',
          e?.message || e
        );
        return { provider: 'mistral', data: await mistralSearchMovieRatings(query) };
      }
      throw e;
    }
  }

  if (selected === 'mistral') {
    try {
      return { provider: 'mistral', data: await mistralSearchMovieRatings(query) };
    } catch (e) {
      if (LLM_PROVIDER === 'auto' && GEMINI_ENABLED) {
        console.warn(
          '[LLM] Mistral failed, falling back to Gemini:',
          e?.message || e
        );
        return { provider: 'gemini', data: await geminiSearchMovieRatings(query) };
      }
      throw e;
    }
  }

  throw new Error(`Unknown LLM provider: ${selected}`);
};

const kinoRateBatch = async (queries) => {
  const selected = selectProvider();
  if (!selected) {
    throw new Error(
      'No LLM provider enabled. Configure GEMINI_API_KEY or MISTRAL_API_KEY.'
    );
  }

  if (selected === 'gemini') {
    try {
      return { provider: 'gemini', data: await geminiAnalyzeBatch(queries) };
    } catch (e) {
      if (LLM_PROVIDER === 'auto' && MISTRAL_ENABLED) {
        console.warn(
          '[LLM] Gemini failed, falling back to Mistral:',
          e?.message || e
        );
        return { provider: 'mistral', data: await mistralAnalyzeBatch(queries) };
      }
      throw e;
    }
  }

  if (selected === 'mistral') {
    try {
      return { provider: 'mistral', data: await mistralAnalyzeBatch(queries) };
    } catch (e) {
      if (LLM_PROVIDER === 'auto' && GEMINI_ENABLED) {
        console.warn(
          '[LLM] Mistral failed, falling back to Gemini:',
          e?.message || e
        );
        return { provider: 'gemini', data: await geminiAnalyzeBatch(queries) };
      }
      throw e;
    }
  }

  throw new Error(`Unknown LLM provider: ${selected}`);
};

// KinoRate AI endpoints
app.post('/api/ai/kinorate/search', async (req, res) => {
  const query = req.body?.query;
  if (!query || typeof query !== 'string') {
    res.status(400).json({
      error: 'Missing or invalid "query" in request body',
    });
    return;
  }

  try {
    const { provider, data } = await kinoRateSearch(query);
    res.setHeader('X-LLM-Provider', provider);
    res.status(200).json(normalizeKinoRatePayload(data));
  } catch (e) {
    console.error('KinoRate AI search error:', e);
    res.status(500).json({ error: 'KinoRate AI search failed' });
  }
});

app.post('/api/ai/kinorate/batch', async (req, res) => {
  const queries = req.body?.queries;
  if (!Array.isArray(queries) || !queries.every((q) => typeof q === 'string')) {
    res.status(400).json({
      error: 'Missing or invalid "queries" (string[]) in request body',
    });
    return;
  }

  try {
    const { provider, data } = await kinoRateBatch(queries);
    res.setHeader('X-LLM-Provider', provider);
    res.status(200).json(normalizeKinoRatePayload(data));
  } catch (e) {
    console.error('KinoRate AI batch error:', e);
    res.status(500).json({ error: 'KinoRate AI batch failed' });
  }
});

// Define the proxy route for Rutube API calls
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  try {
    const parsedTarget = new URL(targetUrl);

    // Validate that the target URL is from rutube.ru domain
    if (!parsedTarget.hostname.endsWith('.rutube.ru') && parsedTarget.hostname !== 'rutube.ru') {
      res.status(403).json({ error: 'Only rutube.ru domains are allowed' });
      return;
    }

    // Make the actual request to the target URL
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://rutube.ru/',
        'Origin': 'https://rutube.ru'
      }
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }

    // Forward response status and headers
    res.status(response.status);

    // Forward response headers (except those that might conflict)
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() !== 'access-control-allow-origin' && 
          key.toLowerCase() !== 'content-security-policy' &&
          key.toLowerCase() !== 'transfer-encoding' &&
          key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    }

    // Send the response body
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('Proxy request error:', e);
    res.status(500).json({ error: 'Proxy request failed', details: e.message });
  }
});

// Serve static files from the dist directory if in production mode
app.use(express.static('dist'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Rutube Cinema Hub Proxy Server running on port ${PORT}`);
  console.log(`Proxy endpoint available at http://localhost:${PORT}/api/proxy`);
});