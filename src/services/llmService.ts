import { MovieRatingData, validateMovieRatingData, validateMovieRatingArray } from '../types';
import { indexedDBService, LLM_RESPONSES, TTL } from './indexedDBService';

/**
 * Generate a cache key for LLM queries
 */
function getCacheKey(query: string): string {
  return `llm_${query.toLowerCase().trim()}`;
}

/**
 * Search movie ratings with caching
 * Checks IndexedDB cache first, falls back to API
 */
export const searchMovieRatings = async (query: string): Promise<MovieRatingData | null> => {
  if (!query || !query.trim()) return null;

  const cacheKey = getCacheKey(query);

  try {
    // Check IndexedDB cache first
    const cached = await indexedDBService.get<MovieRatingData>(LLM_RESPONSES, cacheKey);
    if (cached) {
      console.log(`LLM Cache: Hit for "${query}"`);
      return cached;
    }

    console.log(`LLM Cache: Miss for "${query}", fetching from API`);

    const response = await fetch('/api/ai/kinorate/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Validate external data with Zod schema
    const validatedData = validateMovieRatingData(data);

    if (validatedData) {
      // Cache the result in IndexedDB with 7-day TTL
      await indexedDBService.set(LLM_RESPONSES, cacheKey, validatedData, TTL.LLM_RESPONSES);
      console.log(`LLM Cache: Stored result for "${query}"`);
    }

    return validatedData;
  } catch (error) {
    console.error('LLM Search Error:', error);
    return null;
  }
};

/**
 * Batch analyze movies with caching
 * Checks IndexedDB cache first for each query, only fetches uncached queries
 */
export const analyzeBatchWithAgent = async (queries: string[]): Promise<MovieRatingData[]> => {
  if (queries.length === 0) return [];

  const results: MovieRatingData[] = [];
  const uncachedQueries: string[] = [];
  const cacheKeyMap = new Map<string, string>();

  // Check cache for each query
  for (const query of queries) {
    if (!query || !query.trim()) continue;

    const cacheKey = getCacheKey(query);
    cacheKeyMap.set(query, cacheKey);

    const cached = await indexedDBService.get<MovieRatingData>(LLM_RESPONSES, cacheKey);
    if (cached) {
      console.log(`LLM Cache: Hit for batch query "${query}"`);
      results.push(cached);
    } else {
      uncachedQueries.push(query);
    }
  }

  // If all queries were cached, return results
  if (uncachedQueries.length === 0) {
    return results;
  }

  console.log(`LLM Cache: Fetching ${uncachedQueries.length} uncached queries from API`);

  try {
    const response = await fetch('/api/ai/kinorate/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queries: uncachedQueries }),
    });

    if (!response.ok) return results;

    const data = await response.json();

    // Validate external data with Zod schema
    const validatedData = validateMovieRatingArray(data);

    // Cache and add new results
    for (const item of validatedData) {
      if (item && item.title) {
        const cacheKey = getCacheKey(item.title);
        await indexedDBService.set(LLM_RESPONSES, cacheKey, item, TTL.LLM_RESPONSES);
        console.log(`LLM Cache: Stored batch result for "${item.title}"`);
      }
      results.push(item);
    }

    return results;
  } catch (error) {
    console.error('LLM Batch Error:', error);
    return results;
  }
};

/**
 * Clear the LLM response cache
 */
export const clearLLMCache = async (): Promise<void> => {
  await indexedDBService.clearStore(LLM_RESPONSES);
  console.log('LLM Cache: Cleared all cached responses');
};

/**
 * Get LLM cache statistics
 */
export const getLLMCacheStats = async (): Promise<{ count: number }> => {
  const count = await indexedDBService.getStoreSize(LLM_RESPONSES);
  return { count };
};
