/**
 * Rutube API Types
 * Interfaces for Rutube API responses and internal video representation
 */

// ============================================================================
// Raw API Response Types (from Rutube API)
// ============================================================================

/** Raw video item from Rutube API */
export interface RutubeApiVideoItem {
  id: string | number;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  picture_url?: string;
  duration?: number;
  views?: number;
  hits?: number;
  created_ts?: string;
  video_url?: string;
  html?: string;
}

/** Raw API response with pagination */
export interface RutubeApiResponseRaw {
  results?: RutubeApiVideoItem[] | { [key: string]: unknown };
  has_next?: boolean | 0 | 1;
  next?: string | null;
}

/** Raw playlist item from Rutube API */
export interface RutubeApiPlaylistItem {
  id: string | number;
  title?: string;
  name?: string;
  video_count?: number;
  videos_count?: number;
  count?: number;
}

/** Raw channel profile from Rutube API */
export interface RutubeApiProfile {
  id?: string | number;
  name?: string;
  avatar_url?: string;
  followers_count?: number;
  subscribers_count?: number;
  video_count?: number;
}

/** Raw playlist API response */
export interface RutubeApiPlaylistResponse {
  results?: RutubeApiPlaylistItem[];
  next?: string | null;
}

// ============================================================================
// Internal Types (used in application)
// ============================================================================

/** Processed video data used throughout the application */
export interface RutubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration: number;
  views: number;
  created_ts: string;
  video_url: string;
  html: string;
  rating: number;
  gravity: number;
}

/** API response wrapper with processed videos */
export interface RutubeApiResponse {
  results: RutubeVideo[];
  has_next: boolean;
  next: string | null;
}

/** Channel information displayed in UI */
export interface ChannelInfo {
  title: string;
  subscribers: string;
  avatarUrl: string;
  bannerUrl: string;
  videoCount?: number;
}

/** Cached playlist data structure */
export interface CachedPlaylistData {
  data: RutubeVideo[];
  nextUrl: string | null;
}

// ============================================================================
// Redux State Types (for HTML parsing)
// ============================================================================

/** Possible Redux state structure from Rutube HTML pages */
export interface RutubeReduxState {
  userChannel?: {
    id?: string | number;
    videos?: {
      results?: RutubeApiVideoItem[];
    };
    playlists?: {
      results?: RutubeApiPlaylistItem[];
    };
  };
  channel?: {
    id?: string | number;
    videos?: {
      results?: RutubeApiVideoItem[];
    };
    playlists?: {
      results?: RutubeApiPlaylistItem[];
    };
  };
  profile?: {
    id?: string | number;
    videos?: {
      results?: RutubeApiVideoItem[];
    };
    playlists?: {
      results?: RutubeApiPlaylistItem[];
    };
  };
  currentChannel?: {
    id?: string | number;
  };
  feed?: {
    results?: RutubeApiVideoItem[];
  };
  videos?: {
    results?: RutubeApiVideoItem[];
  };
  playlists?: {
    results?: RutubeApiPlaylistItem[];
  };
}

// ============================================================================
// Proxy Response Types
// ============================================================================

/** Response from local proxy wrapper */
export interface ProxyWrappedResponse {
  contents: string | unknown;
  status: number;
}

/** Parsed single page result */
export interface ParsedPageResult {
  results: RutubeApiVideoItem[];
  next: string | null;
}
