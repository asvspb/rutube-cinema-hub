import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loadEnv = () => {
  const envFromFiles = {};
  const envPaths = [
    path.join(__dirname, '..', '..', '.env.local'),
    path.join(__dirname, '..', '..', '.env'),
  ];

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    try {
      const parsed = dotenv.parse(fs.readFileSync(envPath));
      Object.assign(envFromFiles, parsed);
    } catch (e) {
      console.warn(`[dotenv] Failed to read ${envPath}:`, e?.message || e);
    }
  }

  for (const [key, value] of Object.entries(envFromFiles)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

export const validateEnv = () => {
  const requiredEnvVars = ['PORT'];
  const optionalEnvVarsWithDefaults = {
    GEMINI_API_KEY: 'Required for Gemini AI provider (fallback to Mistral if not set)',
    MISTRAL_API_KEY: 'Required for Mistral AI provider (fallback to Gemini if not set)',
    ALLOWED_ORIGINS:
      'Default: http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173',
    PROXY_RATE_LIMIT_WINDOW_MS: 'Default: 900000 (15 minutes)',
    PROXY_RATE_LIMIT_MAX_REQUESTS: 'Default: 100',
    AI_RATE_LIMIT_WINDOW_MS: 'Default: 900000 (15 minutes)',
    AI_RATE_LIMIT_MAX_REQUESTS: 'Default: 50',
    LLM_PROVIDER: 'Default: auto (can be gemini, mistral, or auto)',
    LLM_TIMEOUT_SEC: 'Default: 30',
    LLM_MAX_TOKENS: 'Default: 512',
  };

  const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missingRequired.length > 0) {
    console.warn('[ENV WARN] Missing required environment variables:', missingRequired);
  }

  Object.keys(optionalEnvVarsWithDefaults).forEach(envVar => {
    if (!process.env[envVar]) {
      console.warn(
        `[ENV WARN] Optional environment variable '${envVar}' not set. ${optionalEnvVarsWithDefaults[envVar]}`
      );
    }
  });
};
