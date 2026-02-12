export interface RutubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration: number;
  views: number;
  created_ts: string;
  video_url: string;
  html: string; // Embed code usually
  rating: number; // Calculated rating 0-10
  gravity: number; // Trend score based on velocity
}

export interface RutubeApiResponse {
  results: RutubeVideo[];
  has_next: boolean;
  next: string | null;
}

export interface CategoryDef {
  id: string;
  label: string;
  rutubeId: string; // Channel ID for ALL, Playlist ID for others
  type: 'channel' | 'playlist';
  isSystem?: boolean; // If true, cannot be deleted
  itemCount?: number; // Number of videos in playlist
}

export interface ChannelDef {
  id: string;
  label: string;
  rutubeId: string;
  isSystem?: boolean;
}

export interface ChannelInfo {
  title: string;
  subscribers: string;
  avatarUrl: string;
  bannerUrl: string;
  videoCount?: number; // Total videos in channel
}

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

export interface RatingSettings {
  // Standard Formula: Base + (log10(views/day) * Multiplier)
  ratingBase: number;
  ratingLogScale: number;

  // Gravity Formula: Views / (Hours + Offset)^Power
  gravityHourOffset: number;
  gravityPower: number;

  // Experimental Threshold Formula
  useExperimentalStrategy: boolean;
  thresholdLow: number; // Views count for Rating 'targetRatingLow'
  thresholdHigh: number; // Views count for Rating 'targetRatingHigh'
  targetRatingLow?: number; // The rating value for thresholdLow (default 7.0)
  targetRatingHigh?: number; // The rating value for thresholdHigh (default 9.0)
  useMedianForLow?: boolean; // If true, use Median of current list for 7.0
  useAverageForHigh?: boolean; // If true, use Average of current list for 9.0
}

export interface MovieRatingData {
  title: string; // Localized Russian title
  originalTitle: string; // Original title
  year: string;
  kpRating: number; // Kinopoisk Rating
  kpVotes: string; // Approximate votes
  imdbRating: number; // IMDb Rating
  imdbUrl?: string; // IMDb URL (for AI-fetched data)
  description: string; // Short engaging plot summary in Russian
  sources?: string[]; // URLs from grounding
  awards?: string[]; // Array of awards strings (e.g. "Oscar Won", "Oscar Nominated")
  dataSource?: 'local' | 'ai'; // Track where the data came from
  aiAttempts?: number; // Track number of AI search attempts
}

export interface BatchItem {
  id: string;
  query: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: MovieRatingData;
}
