/**
 * UI Types
 * Types for UI components, filters, and user preferences
 */

// ============================================================================
// Category & Channel Definitions
// ============================================================================

/** Category definition for playlists and channels */
export interface CategoryDef {
  id: string;
  label: string;
  rutubeId: string;
  type: 'channel' | 'playlist';
  isSystem?: boolean;
  itemCount?: number;
}

/** Channel definition */
export interface ChannelDef {
  id: string;
  label: string;
  rutubeId: string;
  isSystem?: boolean;
}

// ============================================================================
// Sorting & Filtering
// ============================================================================

/** Available sort options */
export type SortOption =
  | 'date'
  | 'rating'
  | 'alphabetical'
  | 'year'
  | 'watched'
  | 'liked'
  | 'watch_later'
  | 'views'
  | 'trend'
  | 'default';

// ============================================================================
// Rating Settings
// ============================================================================

/** Rating calculation settings */
export interface RatingSettings {
  // Standard Formula: Base + (log10(views/day) * Multiplier)
  ratingBase: number;
  ratingLogScale: number;

  // Gravity Formula: Views / (Hours + Offset)^Power
  gravityHourOffset: number;
  gravityPower: number;

  // Experimental Threshold Formula
  useExperimentalStrategy: boolean;
  thresholdLow: number;
  thresholdHigh: number;
  targetRatingLow?: number;
  targetRatingHigh?: number;
  useMedianForLow?: boolean;
  useAverageForHigh?: boolean;
}

// ============================================================================
// Video Status
// ============================================================================

/** Video watched status type */
export type VideoWatchedStatus = 'watched' | 'watch_later';

/** Video liked status type */
export type VideoLikedStatus = 'liked' | 'disliked';

/** Video status map types */
export type VideoWatchedStatusMap = Record<string, VideoWatchedStatus>;
export type VideoLikedStatusMap = Record<string, VideoLikedStatus>;
