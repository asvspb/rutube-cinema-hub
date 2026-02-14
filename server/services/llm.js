import { GoogleGenAI, Type } from '@google/genai';
import { parseJsonFromText, normalizeKinoRatePayload, normalizeStringArray } from './jsonParser.js';

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

const LLM_PROVIDER = (process.env.LLM_PROVIDER || 'auto').trim().toLowerCase();

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
  '\n9. Use the googleSearch tool to find up-to-date information.\n';

const createKinoRateSinglePrompt = query =>
  `Find ratings and Oscar status for the movie: "${query}".\n` +
  'Return ONLY valid JSON (no markdown, no code fences) with keys: title (string), originalTitle (string), year (string), kpRating (number), kpVotes (string), imdbRating (number), description (string), awards (optional array of strings).';

const createKinoRateBatchPrompt = queries => {
  const joined = queries.map((q, i) => `${i + 1}. ${q}`).join('\n');
  return (
    `Find ratings and Oscar status for the following movies:\n${joined}\n` +
    'Return ONLY valid JSON (no markdown, no code fences) as a JSON array of objects in the same order. ' +
    'Each object must have keys: title (string), originalTitle (string), year (string), kpRating (number), kpVotes (string), imdbRating (number), description (string), awards (optional array of strings).'
  );
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
  required: ['title', 'originalTitle', 'year', 'kpRating', 'kpVotes', 'imdbRating', 'description'],
};

const batchSchema = {
  type: Type.ARRAY,
  items: movieRatingSchema,
};

const extractImdbUrl = sources => {
  if (!Array.isArray(sources)) return undefined;

  for (const url of sources) {
    if (typeof url === 'string' && url.includes('imdb.com/title/')) {
      return url;
    }
  }
  return undefined;
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

const callMistralChat = async messages => {
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

const mistralSearchMovieRatings = async query => {
  const content = await callMistralChat([
    { role: 'system', content: KINORATE_SYSTEM_INSTRUCTION_BASE },
    { role: 'user', content: createKinoRateSinglePrompt(query) },
  ]);
  if (!content) return null;

  const parsed = parseJsonFromText(content, 'object');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  return parsed;
};

const mistralAnalyzeBatch = async queries => {
  const content = await callMistralChat([
    { role: 'system', content: KINORATE_SYSTEM_INSTRUCTION_BASE },
    { role: 'user', content: createKinoRateBatchPrompt(queries) },
  ]);
  if (!content) return [];

  const parsed = parseJsonFromText(content, 'array');
  return Array.isArray(parsed) ? parsed : [];
};

const geminiSearchMovieRatings = async query => {
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

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const sources = groundingChunks?.map(c => c.web?.uri).filter(uri => typeof uri === 'string');

  const imdbUrl = extractImdbUrl(sources);

  return { ...data, sources, imdbUrl };
};

const geminiAnalyzeBatch = async queries => {
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

  if (GEMINI_ENABLED) return 'gemini';
  if (MISTRAL_ENABLED) return 'mistral';
  return null;
};

export const kinoRateSearch = async query => {
  const selected = selectProvider();
  if (!selected) {
    throw new Error('No LLM provider enabled. Configure GEMINI_API_KEY or MISTRAL_API_KEY.');
  }

  if (selected === 'gemini') {
    try {
      return { provider: 'gemini', data: await geminiSearchMovieRatings(query) };
    } catch (e) {
      if (LLM_PROVIDER === 'auto' && MISTRAL_ENABLED) {
        console.warn('[LLM] Gemini failed, falling back to Mistral:', e?.message || e);
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
        console.warn('[LLM] Mistral failed, falling back to Gemini:', e?.message || e);
        return { provider: 'gemini', data: await geminiSearchMovieRatings(query) };
      }
      throw e;
    }
  }

  throw new Error(`Unknown LLM provider: ${selected}`);
};

export const kinoRateBatch = async queries => {
  const selected = selectProvider();
  if (!selected) {
    throw new Error('No LLM provider enabled. Configure GEMINI_API_KEY or MISTRAL_API_KEY.');
  }

  if (selected === 'gemini') {
    try {
      return { provider: 'gemini', data: await geminiAnalyzeBatch(queries) };
    } catch (e) {
      if (LLM_PROVIDER === 'auto' && MISTRAL_ENABLED) {
        console.warn('[LLM] Gemini failed, falling back to Mistral:', e?.message || e);
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
        console.warn('[LLM] Mistral failed, falling back to Gemini:', e?.message || e);
        return { provider: 'gemini', data: await geminiAnalyzeBatch(queries) };
      }
      throw e;
    }
  }

  throw new Error(`Unknown LLM provider: ${selected}`);
};

export const normalizeKinoRate = normalizeKinoRatePayload;
