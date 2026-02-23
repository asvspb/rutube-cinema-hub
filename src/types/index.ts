/**
 * Types Index
 * Re-exports all types from separate modules
 */

// Rutube API types
export type {
  RutubeApiVideoItem,
  RutubeApiResponseRaw,
  RutubeApiPlaylistItem,
  RutubeApiProfile,
  RutubeApiPlaylistResponse,
  RutubeVideo,
  RutubeApiResponse,
  ChannelInfo,
  CachedPlaylistData,
  RutubeReduxState,
  ProxyWrappedResponse,
  ParsedPageResult,
} from './rutube';

// KinoRate types
export type {
  MovieRatingData,
  BatchItem,
  AiKinorateSearchResponse,
  AiKinorateBatchResponse,
  LlmServiceResponse,
  TopMovieRaw,
  TopDatasetJson,
  Award,
} from './kinorate';

// UI types
export type {
  CategoryDef,
  ChannelDef,
  SortOption,
  RatingSettings,
  VideoWatchedStatus,
  VideoLikedStatus,
  VideoWatchedStatusMap,
  VideoLikedStatusMap,
  WatchHistoryItem,
  AvailablePlaylist,
  VideoCache,
  MetadataCache,
  KinoRateContext,
} from './ui';

// Zod schemas and validation helpers
export {
  RutubeApiVideoItemSchema,
  RutubeApiResponseRawSchema,
  RutubeApiPlaylistItemSchema,
  RutubeApiPlaylistResponseSchema,
  ProxyWrappedResponseSchema,
  MovieRatingDataSchema,
  AiKinorateSearchResponseSchema,
  AiKinorateBatchResponseSchema,
  safeParseJson,
  parseProxyResponse,
  validateVideoItems,
  validateMovieRatingData,
  validateMovieRatingArray,
  extractNextUrl,
} from './schemas';
