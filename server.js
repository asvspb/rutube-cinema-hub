import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

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

// Security Configuration
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173'];
const PROXY_RATE_LIMIT_WINDOW_MS = parseInt(process.env.PROXY_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const PROXY_RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.PROXY_RATE_LIMIT_MAX_REQUESTS) || 100; // requests per window
const PROXY_MAX_REDIRECTS = parseInt(process.env.PROXY_MAX_REDIRECTS) || 5;
const AI_RATE_LIMIT_WINDOW_MS = parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const AI_RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS) || 50; // requests per window
const ALLOWED_DOMAINS = (process.env.ALLOWED_PROXY_DOMAINS || 'rutube.ru,*.rutube.ru,api.rutube.ru').split(',').map(domain => domain.trim());

// Apply security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
      },
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    referrerPolicy: {
      policy: 'same-origin',
    },
  })
);

// Configure CORS with whitelist
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

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

// Function to check if an IP is private/local
const isPrivateIP = (ip) => {
  // Special handling for exact IPv6 localhost
  if (ip === '::1') return true;
  
  // For IPv6 addresses with ports like ::1:8080, extract the IP part
  // Split by ':' and handle the parts appropriately
  const parts = ip.split(':');
  
  // If it starts with '::', handle specially
  if (parts[0] === '' && parts[1] === '') {
    // This is an IPv6 address starting with '::'
    // For ::1 specifically, we already handled it above
    // For other cases like ::ffff:127.0.0.1, check the full address
    if (ip.startsWith('::1') && ip !== '::1') {
      // This is ::1 followed by something else, which is still localhost
      return true;
    }
    if (ip.startsWith('::ffff:127.')) {
      // IPv4-mapped IPv6 address for localhost
      return true;
    }
    if (ip.startsWith('::ffff:192.168.') || 
        ip.startsWith('::ffff:10.') || 
        ip.startsWith('::ffff:172.')) {
      // IPv4-mapped IPv6 addresses for private ranges
      return true;
    }
  }
  
  // For other addresses, extract the base IP without port
  // If there are more than 2 colons, it's likely IPv6
  if (parts.length > 2) {
    // This is likely an IPv6 address
    // Handle compressed format and extract the base address
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // unique local addresses
    if (ip.startsWith('fe80')) return true; // link-local addresses
    if (ip.startsWith('::1')) return true; // localhost IPv6
  } else {
    // This is likely IPv4 or IPv4-like
    const cleanIP = parts[0];
    
    // IPv4 private ranges
    if (cleanIP.startsWith('10.')) return true;
    if (cleanIP.startsWith('172.') && parseInt(cleanIP.split('.')[1], 10) >= 16 && parseInt(cleanIP.split('.')[1], 10) <= 31) return true;
    if (cleanIP.startsWith('192.168.')) return true;
    if (cleanIP.startsWith('127.')) return true;
    if (cleanIP.startsWith('0.')) return true;
    
    // IPv6 private ranges (when extracted without the :: issue)
    if (cleanIP.startsWith('fc') || cleanIP.startsWith('fd')) return true; // unique local addresses
    if (cleanIP.startsWith('fe80')) return true; // link-local addresses
  }
  
  return false;
};

// Function to check if hostname is in allowed domains
const isAllowedDomain = (hostname) => {
  for (const allowedDomain of ALLOWED_DOMAINS) {
    if (allowedDomain.startsWith('*.')) {
      // Wildcard domain check (e.g., *.rutube.ru)
      const domainPattern = allowedDomain.substring(2); // Remove '*.'
      if (hostname === domainPattern || hostname.endsWith('.' + domainPattern)) {
        return true;
      }
    } else {
      // Exact domain match
      if (hostname === allowedDomain) {
        return true;
      }
    }
  }
  return false;
};

// Function to validate URL and check for security issues
const validateAndResolveURL = async (urlString) => {
  try {
    const parsedUrl = new URL(urlString);
    const hostname = parsedUrl.hostname;

    // Block direct localhost references
    if (hostname === 'localhost') {
      throw new Error('Hostname "localhost" is not allowed');
    }

    // Validate resolved hostname even if literal IP is provided
    if (isPrivateIP(hostname)) {
      throw new Error(`Resolved IP '${hostname}' is a private IP address`);
    }

    // Check if domain is in allowlist
    if (!isAllowedDomain(hostname)) {
      throw new Error(`Domain '${hostname}' is not in the allowed domains list`);
    }

    // Resolve hostname to IP and check if it's a private IP
    const resolved = await dnsLookup(hostname);
    if (isPrivateIP(resolved.address)) {
      throw new Error(`Resolved IP '${resolved.address}' is a private IP address`);
    }

    return parsedUrl;
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw new Error(`Hostname could not be resolved: ${urlString}`);
    }
    throw error;
  }
};

// Rate limiting for proxy endpoint
const proxyLimiter = rateLimit({
  windowMs: PROXY_RATE_LIMIT_WINDOW_MS,
  max: PROXY_RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests to proxy endpoint, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: AI_RATE_LIMIT_WINDOW_MS,
  max: AI_RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests to AI endpoints, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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

const extractImdbUrl = (sources) => {
  if (!Array.isArray(sources)) return undefined;
  
  for (const url of sources) {
    if (typeof url === 'string' && url.includes('imdb.com/title/')) {
      return url;
    }
  }
  return undefined;
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

  const imdbUrl = extractImdbUrl(sources);
  
  return { ...data, sources, imdbUrl };
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
app.post('/api/ai/kinorate/search', aiLimiter, async (req, res) => {
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
    if (e.message && e.message.includes('Too many requests')) {
      res.status(429).json({ error: 'Rate limit exceeded' });
    } else {
      res.status(500).json({ error: 'KinoRate AI search failed' });
    }
  }
});

app.post('/api/ai/kinorate/batch', aiLimiter, async (req, res) => {
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
    if (e.message && e.message.includes('Too many requests')) {
      res.status(429).json({ error: 'Rate limit exceeded' });
    } else {
      res.status(500).json({ error: 'KinoRate AI batch failed' });
    }
  }
});

const forwardProxyRequest = async (urlString, init) => {
  let currentUrl = urlString;
  let response;

  for (let redirectCount = 0; redirectCount <= PROXY_MAX_REDIRECTS; redirectCount += 1) {
    await validateAndResolveURL(currentUrl);

    response = await fetch(currentUrl, {
      ...init,
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return response;
      }

      const nextUrl = new URL(location, currentUrl).toString();
      currentUrl = nextUrl;
      continue;
    }

    return response;
  }

  throw new Error('Too many redirects');
};

// Define the proxy route for Rutube API calls
app.get('/api/proxy', proxyLimiter, async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  try {
    const response = await forwardProxyRequest(targetUrl, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://rutube.ru/',
        'Origin': 'https://rutube.ru'
      }
    });

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
    if (e.message.includes('not in the allowed domains list') || e.message.includes('private IP address') || e.message.includes('Hostname "localhost"') || e.message.includes('Too many redirects')) {
      res.status(403).json({ error: e.message });
    } else if (e.message.includes('Too many requests')) {
      res.status(429).json({ error: 'Rate limit exceeded' });
    } else {
      res.status(500).json({ error: 'Proxy request failed', details: e.message });
    }
  }
});

// Serve static files from the dist directory if in production mode
app.use(express.static('dist'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Rutube Cinema Hub Proxy Server running on port ${PORT}`);
  console.log(`Proxy endpoint available at http://localhost:${PORT}/api/proxy`);
});