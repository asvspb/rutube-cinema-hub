/**
 * Zod Schemas for Runtime Validation
 * Validates external data from Rutube API and LLM responses
 */

import { z } from 'zod';

// ============================================================================
// Rutube API Schemas
// ============================================================================

/** Schema for raw video item from Rutube API */
export const RutubeApiVideoItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().optional(),
  description: z.string().optional(),
  thumbnail_url: z.string().optional(),
  picture_url: z.string().optional(),
  duration: z.number().optional(),
  views: z.number().optional(),
  hits: z.number().optional(),
  created_ts: z.string().optional(),
  video_url: z.string().optional(),
  html: z.string().optional(),
});

/** Schema for raw API response with pagination */
export const RutubeApiResponseRawSchema = z.object({
  results: z
    .union([z.array(RutubeApiVideoItemSchema), z.record(z.string(), z.unknown())])
    .optional()
    .nullable(),
  has_next: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
  next: z.string().nullable().optional(),
});

/** Schema for raw playlist item from Rutube API */
export const RutubeApiPlaylistItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().optional(),
  name: z.string().optional(),
  video_count: z.number().optional(),
  videos_count: z.number().optional(),
  count: z.number().optional(),
});

/** Schema for playlist API response */
export const RutubeApiPlaylistResponseSchema = z.object({
  results: z.array(RutubeApiPlaylistItemSchema).optional().nullable(),
  next: z.string().nullable().optional(),
});

/** Schema for proxy wrapped response */
export const ProxyWrappedResponseSchema = z.object({
  contents: z.union([z.string(), z.unknown()]),
  status: z.number(),
});

// ============================================================================
// KinoRate / LLM Response Schemas
// ============================================================================

/** Schema for movie rating data from AI */
export const MovieRatingDataSchema = z.object({
  title: z.string(),
  originalTitle: z.string(),
  year: z.string(),
  kpRating: z.number(),
  kpVotes: z.string(),
  imdbRating: z.number(),
  imdbUrl: z.string().optional(),
  description: z.string(),
  sources: z.array(z.string()).optional(),
  awards: z.array(z.string()).optional(),
  dataSource: z.enum(['local', 'ai']).optional(),
  aiAttempts: z.number().optional(),
});

/** Schema for AI kinorate search response */
export const AiKinorateSearchResponseSchema = z.object({
  success: z.boolean(),
  data: MovieRatingDataSchema.optional().nullable(),
  error: z.string().optional(),
});

/** Schema for AI kinorate batch response */
export const AiKinorateBatchResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(MovieRatingDataSchema).optional().nullable(),
  error: z.string().optional(),
});

// ============================================================================
// Parsing Helper Functions
// ============================================================================

/**
 * Safely parse JSON text with validation
 * Returns parsed data or null if invalid
 */
export function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Parse and validate proxy response
 * Handles both direct JSON and wrapped responses
 */
export function parseProxyResponse(text: string): unknown {
  const parsed = safeParseJson(text);
  if (parsed === null) {
    throw new Error('Received HTML or invalid JSON');
  }

  // Check if it's a wrapped proxy response
  const wrappedResult = ProxyWrappedResponseSchema.safeParse(parsed);
  if (wrappedResult.success && typeof wrappedResult.data.contents === 'string') {
    try {
      return JSON.parse(wrappedResult.data.contents);
    } catch {
      throw new Error('Invalid wrapper');
    }
  }

  return parsed;
}

/**
 * Validate video item array from API response
 * Returns validated items or empty array
 */
export function validateVideoItems(data: unknown): z.infer<typeof RutubeApiVideoItemSchema>[] {
  if (Array.isArray(data)) {
    return data.filter(item => RutubeApiVideoItemSchema.safeParse(item).success);
  }

  if (data && typeof data === 'object' && 'results' in data) {
    const results = (data as { results?: unknown }).results;
    if (Array.isArray(results)) {
      return results.filter(item => RutubeApiVideoItemSchema.safeParse(item).success);
    }
  }

  return [];
}

/**
 * Validate movie rating data from AI
 */
export function validateMovieRatingData(
  data: unknown
): z.infer<typeof MovieRatingDataSchema> | null {
  const result = MovieRatingDataSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate array of movie rating data from AI batch
 */
export function validateMovieRatingArray(data: unknown): z.infer<typeof MovieRatingDataSchema>[] {
  if (!Array.isArray(data)) return [];
  return data.filter(item => MovieRatingDataSchema.safeParse(item).success);
}

/**
 * Extract next URL from paginated response
 */
export function extractNextUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  // Explicit next URL
  if (typeof obj.next === 'string' && obj.next.length > 0) {
    return obj.next;
  }

  // Check has_next flag
  if (obj.has_next === false || obj.has_next === 0) {
    return null;
  }

  return null;
}
