/**
 * KinoRate Types
 * Types for movie rating data from Kinopoisk, IMDb, and AI search
 */

// ============================================================================
// Movie Rating Data
// ============================================================================

/** Movie rating information from multiple sources */
export interface MovieRatingData {
  title: string;
  originalTitle: string;
  year: string;
  kpRating: number;
  kpVotes: string;
  imdbRating: number;
  imdbUrl?: string;
  description: string;
  sources?: string[];
  awards?: string[];
  dataSource?: 'local' | 'ai';
  aiAttempts?: number;
}

/** Batch processing item for AI search */
export interface BatchItem {
  id: string;
  query: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: MovieRatingData;
}

// ============================================================================
// AI/LLM Response Types
// ============================================================================

/** Raw AI response from kinorate search */
export interface AiKinorateSearchResponse {
  success: boolean;
  data?: MovieRatingData;
  error?: string;
}

/** Raw AI response from batch search */
export interface AiKinorateBatchResponse {
  success: boolean;
  data?: MovieRatingData[];
  error?: string;
}

/** LLM service response wrapper */
export interface LlmServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source?: 'local' | 'ai';
}

// ============================================================================
// Top250 Dataset Types
// ============================================================================

/** Raw movie data from Top250 dataset */
export interface TopMovieRaw {
  id?: string | number;
  imdbId?: string | number;
  title?: string;
  originalTitle?: string;
  year?: string | number;
  rating?: string | number;
  votes?: string | number;
  awards?: unknown[];
}

/** Raw Top250 JSON structure */
export interface TopDatasetJson {
  movies?: TopMovieRaw[];
  [key: string]: unknown;
}

/** Award object structure */
export interface Award {
  name: string;
  year?: number;
  nomination?: string;
}
