import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import prismaPkg from '@prisma/client';
import {
  createAccessToken,
  verifyAccessToken,
  hashPassword,
  verifyPassword,
} from './services/authUtils.js';

const { PrismaClient } = prismaPkg;

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

const prisma = new PrismaClient();

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

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_ISSUER = process.env.JWT_ISSUER || 'rutube-cinema-hub';
const SESSION_TTL_DAYS = parseIntEnv(process.env.SESSION_TTL_DAYS, 30);

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

const ensureAuthConfigured = (res) => {
  if (!JWT_SECRET) {
    res.status(500).json({ error: 'Auth is not configured (JWT_SECRET missing)' });
    return false;
  }
  return true;
};

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return null;
  return token;
};

const authenticateRequest = async (req) => {
  const token = getBearerToken(req);
  if (!token) return { error: 'missing' };

  const payload = verifyAccessToken(token, {
    secret: JWT_SECRET,
    issuer: JWT_ISSUER,
  });
  if (!payload?.sid || !payload?.sub) return { error: 'invalid' };

  const session = await prisma.session.findUnique({ where: { id: payload.sid } });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return { error: 'expired' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true },
  });

  if (!user) return { error: 'invalid' };
  return { user, session };
};

const createSessionToken = async (userId) => {
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  const token = createAccessToken({
    userId,
    sessionId: session.id,
    secret: JWT_SECRET,
    issuer: JWT_ISSUER,
    expiresIn: JWT_EXPIRES_IN,
  });

  return { token, session };
};

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

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

app.post('/api/auth/register', async (req, res) => {
  if (!ensureAuthConfigured(res)) return;

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });

    const { token } = await createSessionToken(user.id);
    res.status(201).json({ token, user });
  } catch (e) {
    if (e?.code === 'P2002') {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  if (!ensureAuthConfigured(res)) return;

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!isValidEmail(email) || !password) {
    res.status(400).json({ error: 'Invalid email or password' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const { token } = await createSessionToken(user.id);
    res.status(200).json({ token, user: { id: user.id, email: user.email } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  if (!ensureAuthConfigured(res)) return;

  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = createAccessToken({
      userId: auth.user.id,
      sessionId: auth.session.id,
      secret: JWT_SECRET,
      issuer: JWT_ISSUER,
      expiresIn: JWT_EXPIRES_IN,
    });

    res.status(200).json({ token, user: auth.user });
  } catch (e) {
    console.error('Refresh error:', e);
    res.status(500).json({ error: 'Refresh failed' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  if (!ensureAuthConfigured(res)) return;

  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.session.update({
      where: { id: auth.session.id },
      data: { revokedAt: new Date() },
    });

    res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error('Logout error:', e);
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  if (!ensureAuthConfigured(res)) return;

  try {
    const auth = await authenticateRequest(req);
    if (auth.error) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.status(200).json({ user: auth.user });
  } catch (e) {
    console.error('Auth me error:', e);
    res.status(500).json({ error: 'Failed to fetch user' });
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
