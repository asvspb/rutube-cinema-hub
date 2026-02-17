import {
  RutubeApiResponse,
  RutubeVideo,
  CategoryDef,
  ChannelDef,
  SortOption,
  RatingSettings,
  ChannelInfo,
} from '../types';
import { logger } from './loggerService';
import { CircuitBreaker } from '../utils/CircuitBreaker';

const BASE_API = 'https://rutube.ru/api';

export const DEFAULT_CHANNELS: ChannelDef[] = [
  {
    id: '32869212',
    label: 'Смотри кино',
    rutubeId: '32869212',
    isSystem: true,
  },
  {
    id: '32181632',
    label: 'Фильмач',
    rutubeId: '32181632',
    isSystem: true,
  },
  {
    id: '36921062',
    label: 'Синемач',
    rutubeId: '36921062',
    isSystem: true,
  },
  {
    id: '38284124',
    label: 'Твое кино',
    rutubeId: '38284124',
    isSystem: true,
  },
  {
    id: '33284182',
    label: 'СмотретьOnline',
    rutubeId: '33284182',
    isSystem: true,
  },
];

export const DEFAULT_PLAYLISTS_BY_CHANNEL: Record<string, CategoryDef[]> = {
  '32869212': [
    {
      id: 'all-32869212',
      label: 'Все видео',
      rutubeId: '32869212',
      type: 'channel',
      isSystem: true,
    },
  ],
  '32181632': [
    {
      id: 'all-32181632',
      label: 'Все видео',
      rutubeId: '32181632',
      type: 'channel',
      isSystem: true,
    },
  ],
  '36921062': [
    {
      id: 'all-36921062',
      label: 'Все видео',
      rutubeId: '36921062',
      type: 'channel',
      isSystem: true,
    },
  ],
  '38284124': [
    {
      id: 'all-38284124',
      label: 'Все видео',
      rutubeId: '38284124',
      type: 'channel',
      isSystem: true,
    },
  ],
  '33284182': [
    {
      id: 'all-33284182',
      label: 'Все видео',
      rutubeId: '33284182',
      type: 'channel',
      isSystem: true,
    },
  ],
};

export const DEFAULT_RATING_SETTINGS: RatingSettings = {
  ratingBase: 5.0,
  ratingLogScale: 1.0,
  gravityHourOffset: 2.0,
  gravityPower: 1.5,
  useExperimentalStrategy: false,
  thresholdLow: 50000,
  thresholdHigh: 500000,
  targetRatingLow: 7.0,
  targetRatingHigh: 9.0,
  useMedianForLow: false,
  useAverageForHigh: false,
};

export const parseRutubeUrl = (
  url: string
): { id: string; type: 'channel' | 'playlist' } | null => {
  try {
    let urlToParse = url.trim();
    if (!/^https?:\/\//i.test(urlToParse)) {
      urlToParse = 'https://' + urlToParse;
    }

    const urlObj = new URL(urlToParse);
    const path = urlObj.pathname;

    const channelMatch = path.match(/\/channel\/(\d+)/);
    if (channelMatch && channelMatch[1]) {
      return { id: channelMatch[1], type: 'channel' };
    }

    const userMatch = path.match(/\/u\/([^/]+)/);
    if (userMatch && userMatch[1]) {
      return { id: userMatch[1], type: 'channel' };
    }

    const playlistMatch = path.match(/\/plst\/(\d+)/);
    if (playlistMatch && playlistMatch[1]) {
      return { id: playlistMatch[1], type: 'playlist' };
    }

    return null;
  } catch (e) {
    return null;
  }
};

// Синхронизированные таймауты: сервер max 60s, клиент ждёт 70s
const CLIENT_PROXY_TIMEOUT_MS = 70000;
const REQUEST_THROTTLE_MS = 800;
const PROXY_RETRY_DELAY_MS = 2000;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Инициализация Circuit Breaker для локального прокси
const localProxyBreaker = new CircuitBreaker({
  failureThreshold: 3, // После 3 ошибок подряд открываем
  resetTimeout: 30000, // Ждём 30 секунд перед проверкой
});

let throttleChain = Promise.resolve();
const scheduleRequestSlot = async () => {
  const current = throttleChain;
  let release!: () => void;
  throttleChain = new Promise<void>(resolve => {
    release = resolve;
  });

  await current;
  await wait(REQUEST_THROTTLE_MS);
  release();
};

const isValidRutubeId = (id: string | undefined | null) => !!id && /^\d{6,}$/.test(id);

// Export function to check proxy status for UI
export const getProxyStatus = () => ({
  state: localProxyBreaker.getState(),
  failureCount: localProxyBreaker.getFailureCount(),
  timeUntilReset: localProxyBreaker.getTimeUntilReset(),
});

// Helper: Makes request through local proxy with Circuit Breaker
const fetchTextWithRace = async (
  targetUrl: string,
  options?: { signal?: AbortSignal }
): Promise<string> => {
  // 1. Проверяем, жив ли прокси (Circuit Breaker)
  if (!localProxyBreaker.canRequest()) {
    const timeUntilReset = localProxyBreaker.getTimeUntilReset();
    throw new Error(
      `Local proxy is temporarily unavailable (Circuit Breaker Open). ` +
        `Retry in ${Math.ceil(timeUntilReset / 1000)}s`
    );
  }

  const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_PROXY_TIMEOUT_MS);

  try {
    await scheduleRequestSlot();

    // Create a composite signal that combines both signals
    const compositeSignal = options?.signal
      ? createCompositeSignal(controller.signal, options.signal)
      : controller.signal;

    const res = await fetch(proxyUrl, { signal: compositeSignal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // 5xx ошибки считаем сбоем инфраструктуры
      if (res.status >= 500) {
        localProxyBreaker.recordFailure();
      }
      if (res.status === 429) {
        await wait(PROXY_RETRY_DELAY_MS);
      }
      throw new Error(`Proxy status ${res.status}`);
    }

    const text = await res.text();

    // Проверяем валидность ответа
    if (
      text.length <= 20 ||
      text.includes('Proxy Error') ||
      text.includes('Access Denied') ||
      text.includes('Cloudflare')
    ) {
      localProxyBreaker.recordFailure();
      throw new Error(text.includes('Access Denied') ? 'Access Denied' : 'Proxy error or empty');
    }

    // Успех! Сбрасываем счетчик ошибок
    localProxyBreaker.recordSuccess();
    return text;
  } catch (e) {
    clearTimeout(timeoutId);

    // Записываем ошибку в Circuit Breaker
    localProxyBreaker.recordFailure();

    const errorMessage = e instanceof Error ? e.message : 'Proxy fetch failed';
    logger.error('Proxy request failed', {
      targetUrl,
      error: errorMessage,
      breakerState: localProxyBreaker.getState(),
    });

    throw e instanceof Error ? e : new Error('Proxy fetch failed');
  }
};

// Helper function to create a composite signal that aborts when either signal aborts
const createCompositeSignal = (signal1: AbortSignal, signal2: AbortSignal): AbortSignal => {
  const controller = new AbortController();

  const abortHandler = () => {
    controller.abort();
  };

  signal1.addEventListener('abort', abortHandler);
  signal2.addEventListener('abort', abortHandler);

  // Clean up listeners when either signal aborts
  controller.signal.addEventListener('abort', () => {
    signal1.removeEventListener('abort', abortHandler);
    signal2.removeEventListener('abort', abortHandler);
  });

  return controller.signal;
};

const parseProxyResponse = (text: string): any => {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Received HTML or invalid JSON');
  }

  if (data && typeof data === 'object' && 'contents' in data && 'status' in data) {
    try {
      if (typeof data.contents === 'string') return JSON.parse(data.contents);
      return data.contents;
    } catch (e) {
      throw new Error('Invalid wrapper');
    }
  }
  return data;
};

const findIdInHtml = (html: string): string | null => {
  const reduxMatch = html.match(/window\.reduxState\s*=\s*(\{.+?\});/);
  if (reduxMatch && reduxMatch[1]) {
    try {
      const state = JSON.parse(reduxMatch[1]);
      const candidates = [
        state.userChannel?.id,
        state.channel?.id,
        state.profile?.id,
        state.currentChannel?.id,
      ];
      const found = candidates.find(id => id && String(id).match(/^\d+$/));
      if (found) return String(found);
    } catch (e) {}
  }
  return null;
};

export const resolveRutubeId = async (
  id: string,
  type: 'channel' | 'playlist',
  options?: { signal?: AbortSignal }
): Promise<string | null> => {
  if (type === 'playlist') return id;
  if (/^\d+$/.test(id)) return id;

  const timestamp = new Date().getTime();
  const apiUrl = `${BASE_API}/profile/user/${id}/?client=android&format=json&_=${timestamp}`;
  try {
    const text = await fetchTextWithRace(apiUrl, options);
    const data = parseProxyResponse(text);
    if (data && data.id) return String(data.id);
  } catch (e) {
    /* ignore */
  }

  try {
    const strategies = [`https://rutube.ru/channel/${id}/`, `https://rutube.ru/u/${id}/`];

    for (const url of strategies) {
      try {
        const html = await fetchTextWithRace(url, options);
        const idMatch =
          html.match(/"user":\s*\{[^}]*"id":\s*(\d+)/) ||
          html.match(/"author":\s*\{[^}]*"id":\s*(\d+)/) ||
          html.match(/user_id\s*=\s*(\d+)/) ||
          html.match(/"id":\s*(\d+),\s*"is_official"/);
        if (idMatch && idMatch[1]) return idMatch[1];
        const reduxId = findIdInHtml(html);
        if (reduxId) return reduxId;
      } catch (e) {}
    }
  } catch (e) {}

  return null;
};

export const calculateRating = (
  views: number,
  createdTs: string,
  settings: RatingSettings = DEFAULT_RATING_SETTINGS
): number => {
  const v = Number(views);
  if (isNaN(v) || v < 0) return 0;

  if (settings.useExperimentalStrategy) {
    if (v < 10) return 1.0;
    const low = Math.max(1, settings.thresholdLow);
    const high = Math.max(low + 1, settings.thresholdHigh);
    const rLow = settings.targetRatingLow ?? 7.0;
    const rHigh = settings.targetRatingHigh ?? 9.0;
    const logViews = Math.log10(v);
    const logLow = Math.log10(low);
    const logHigh = Math.log10(high);
    const slope = (rHigh - rLow) / (logHigh - logLow);
    const intercept = rLow - slope * logLow;
    const rating = slope * logViews + intercept;
    return Math.max(1.0, Math.min(10.0, Math.round(rating * 10) / 10));
  }

  const createdDate = new Date(createdTs);
  if (isNaN(createdDate.getTime())) return 0;
  const now = new Date();
  const ageInMs = now.getTime() - createdDate.getTime();
  const ageInDays = Math.max(1, ageInMs / (1000 * 60 * 60 * 24));
  const viewsPerDay = v / ageInDays;
  if (viewsPerDay < 0.1) return 4.0;
  const rating = settings.ratingBase + Math.log10(viewsPerDay) * settings.ratingLogScale;
  return Math.max(1.0, Math.min(10.0, Math.round(rating * 10) / 10));
};

export const calculateGravity = (
  views: number,
  createdTs: string,
  settings: RatingSettings = DEFAULT_RATING_SETTINGS
): number => {
  const v = Number(views);
  if (isNaN(v) || v < 0) return 0;
  const createdDate = new Date(createdTs);
  if (isNaN(createdDate.getTime())) return 0;
  const now = new Date();
  const ageInMs = now.getTime() - createdDate.getTime();
  const ageInHours = Math.max(0, ageInMs / (1000 * 60 * 60));
  const denominator = Math.pow(ageInHours + settings.gravityHourOffset, settings.gravityPower);
  return denominator === 0 ? 0 : v / denominator;
};

const getYear = (video: RutubeVideo): number => {
  const titleMatch = video.title.match(/(?:19|20)\d{2}/);
  if (titleMatch) return parseInt(titleMatch[0], 10);
  const date = new Date(video.created_ts);
  return isNaN(date.getFullYear()) ? 0 : date.getFullYear();
};

export const sortVideos = (
  videos: RutubeVideo[],
  option: SortOption,
  direction: 'asc' | 'desc' = 'desc',
  videoWatchedStatuses: Record<string, 'watched' | 'watch_later'> = {},
  videoLikedStatuses: Record<string, 'liked' | 'disliked'> = {}
): RutubeVideo[] => {
  if (option === 'default') return direction === 'asc' ? [...videos] : [...videos].reverse();
  const sorted = [...videos];
  const dir = direction === 'asc' ? 1 : -1;
  switch (option) {
    case 'rating':
      return sorted.sort((a, b) => (a.rating - b.rating) * dir);
    case 'trend':
      return sorted.sort((a, b) => (a.gravity - b.gravity) * dir);
    case 'views':
      return sorted.sort((a, b) => (a.views - b.views) * dir);
    case 'date':
      return sorted.sort(
        (a, b) => (new Date(a.created_ts).getTime() - new Date(b.created_ts).getTime()) * dir
      );
    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title) * dir);
    case 'year':
      return sorted.sort((a, b) => (getYear(a) - getYear(b)) * dir);
    case 'watched':
      return sorted.sort((a, b) => {
        const statusA = videoWatchedStatuses[a.id] === 'watched' ? 1 : 0;
        const statusB = videoWatchedStatuses[b.id] === 'watched' ? 1 : 0;
        if (statusA !== statusB) return (statusA - statusB) * dir;
        return new Date(b.created_ts).getTime() - new Date(a.created_ts).getTime();
      });
    case 'liked':
      return sorted.sort((a, b) => {
        const statusA = videoLikedStatuses[a.id] === 'liked' ? 1 : 0;
        const statusB = videoLikedStatuses[b.id] === 'liked' ? 1 : 0;
        if (statusA !== statusB) return (statusA - statusB) * dir;
        return new Date(b.created_ts).getTime() - new Date(a.created_ts).getTime();
      });
    case 'watch_later':
      return sorted.sort((a, b) => {
        const statusA = videoWatchedStatuses[a.id] === 'watch_later' ? 1 : 0;
        const statusB = videoWatchedStatuses[b.id] === 'watch_later' ? 1 : 0;
        if (statusA !== statusB) return (statusA - statusB) * dir;
        return new Date(b.created_ts).getTime() - new Date(a.created_ts).getTime();
      });
    default:
      return sorted;
  }
};

const mapRutubeItem = (item: any, settings: RatingSettings) => {
  if (!item || typeof item !== 'object') return null;
  const views =
    typeof item.views === 'number' ? item.views : typeof item.hits === 'number' ? item.hits : 0;
  const created_ts = item.created_ts || new Date().toISOString();
  return {
    id: String(item.id || Math.random().toString(36)),
    title: item.title || 'Без названия',
    description: item.description || '',
    thumbnail_url: item.thumbnail_url || item.picture_url || '',
    duration: typeof item.duration === 'number' ? item.duration : 0,
    views: views,
    created_ts: created_ts,
    video_url: item.video_url || '',
    html: item.html || '',
    rating: calculateRating(views, created_ts, settings),
    gravity: calculateGravity(views, created_ts, settings),
  };
};

const fetchSinglePage = async (
  url: string,
  options?: { signal?: AbortSignal }
): Promise<{ results: any[]; next: string | null }> => {
  const timestamp = new Date().getTime();
  let fetchUrl = url;
  if (fetchUrl.startsWith('http:')) fetchUrl = fetchUrl.replace('http:', 'https:');
  const urlWithCacheBust = fetchUrl.includes('_=')
    ? fetchUrl
    : `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}_=${timestamp}`;

  try {
    const text = await fetchTextWithRace(urlWithCacheBust, options);
    const data = parseProxyResponse(text);

    if (Array.isArray(data)) {
      return { results: data, next: null };
    }

    if (data && (Array.isArray(data.results) || data.results)) {
      const results = Array.isArray(data.results) ? data.results : [];
      let next: string | null = null;
      if (typeof data.next === 'string' && data.next.length > 0) {
        next = data.next;
      }
      if (data.has_next === false || data.has_next === 0) {
        next = null;
      }
      return { results, next };
    }
  } catch (e) {
    /* ignore */
  }

  return { results: [], next: null };
};

const findVideosInRedux = (state: any): any[] => {
  if (!state || typeof state !== 'object') return [];

  const potentialPaths = [
    state.userChannel?.videos?.results,
    state.feed?.results,
    state.channel?.videos?.results,
    state.profile?.videos?.results,
    state.videos?.results,
  ];

  for (const list of potentialPaths) {
    if (Array.isArray(list) && list.length > 0) return list;
  }

  return [];
};

const extractVideosFromHtml = (html: string): any[] => {
  const reduxMatch = html.match(/window\.reduxState\s*=\s*(\{.+?\});/);
  if (reduxMatch && reduxMatch[1]) {
    try {
      const state = JSON.parse(reduxMatch[1]);
      const videos = findVideosInRedux(state);
      if (videos.length > 0) return videos;
    } catch (e) {}
  }

  const videos = new Map<string, any>();
  const scriptRegex = /\{[^{}]*"video_url"[^{}]*\}/g;
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    try {
      const objStr = m[0];
      const vidUrlM = objStr.match(/"video_url":"([^"]+)"/);
      const titleM = objStr.match(/"title":"([^"]+)"/);
      const hitsM = objStr.match(/"view_count":(\d+)/) || objStr.match(/"hits":(\d+)/);

      if (vidUrlM && titleM) {
        const vidUrl = vidUrlM[1];
        const idMatch = vidUrl.match(/\/video\/([a-z0-9]+)\//);
        const id = idMatch ? idMatch[1] : Math.random().toString(36).substr(2);

        if (!videos.has(id)) {
          videos.set(id, {
            id,
            title: titleM[1],
            views: hitsM ? parseInt(hitsM[1], 10) : 0,
            video_url: vidUrl,
            thumbnail_url: '',
          });
        }
      }
    } catch (e) {}
  }

  if (videos.size === 0) {
    const linkRegex = /href="\/video\/([a-z0-9]+)\/"[^>]*title="([^"]+)"/g;
    while ((m = linkRegex.exec(html)) !== null) {
      const id = m[1];
      if (!videos.has(id)) {
        videos.set(id, {
          id: id,
          title: m[2],
          views: 0,
          video_url: `https://rutube.ru/video/${id}/`,
          thumbnail_url: '',
        });
      }
    }
  }

  return Array.from(videos.values());
};

const scrapeVideosFromHtml = async (
  channelId: string,
  options?: { signal?: AbortSignal }
): Promise<any[]> => {
  try {
    let html = await fetchTextWithRace(`https://rutube.ru/channel/${channelId}/videos/`, options);
    let videos = extractVideosFromHtml(html);
    if (videos.length > 0) return videos;
    if (!/^\d+$/.test(channelId)) {
      html = await fetchTextWithRace(`https://rutube.ru/u/${channelId}/videos/`, options);
      videos = extractVideosFromHtml(html);
      if (videos.length > 0) return videos;
    }
    if (videos.length > 0) return videos;

    html = await fetchTextWithRace(`https://rutube.ru/channel/${channelId}/`, options);
    videos = extractVideosFromHtml(html);

    return videos;
  } catch (e) {
    return [];
  }
};

const scrapeVideosPaginated = async (
  channelId: string,
  maxPages: number,
  options?: { signal?: AbortSignal }
): Promise<any[]> => {
  const aggregated: any[] = [];
  const seenIds = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    const suffix = page === 1 ? '' : `?page=${page}`;
    let html: string;
    try {
      html = await fetchTextWithRace(
        `https://rutube.ru/channel/${channelId}/videos/${suffix}`,
        options
      );
    } catch {
      break;
    }
    const pageVideos = extractVideosFromHtml(html);
    if (!pageVideos.length) break;

    pageVideos.forEach(v => {
      if (v.id && !seenIds.has(v.id)) {
        seenIds.add(v.id);
        aggregated.push(v);
      }
    });

    // Heuristic stop: if last page had fewer than 10 items, likely no more pages
    if (pageVideos.length < 10) break;
  }

  // Fallback to /u/{id} pagination if nothing was found
  if (aggregated.length === 0 && !/^\d+$/.test(channelId)) {
    for (let page = 1; page <= Math.max(2, maxPages); page++) {
      const suffix = page === 1 ? '' : `?page=${page}`;
      try {
        const html = await fetchTextWithRace(
          `https://rutube.ru/u/${channelId}/videos/${suffix}`,
          options
        );
        const pageVideos = extractVideosFromHtml(html);
        if (!pageVideos.length) break;
        pageVideos.forEach(v => {
          if (v.id && !seenIds.has(v.id)) {
            seenIds.add(v.id);
            aggregated.push(v);
          }
        });
        if (pageVideos.length < 10) break;
      } catch {
        break;
      }
    }
  }

  return aggregated;
};

export const fetchVideos = async (
  category: CategoryDef,
  settings: RatingSettings = DEFAULT_RATING_SETTINGS,
  nextPageCursor?: string | null,
  fetchAll: boolean = false,
  options?: { signal?: AbortSignal }
): Promise<{ videos: RutubeVideo[]; nextUrl: string | null }> => {
  if (nextPageCursor) {
    const { results, next } = await fetchSinglePage(nextPageCursor, options);
    const videos = results
      .map(item => mapRutubeItem(item, settings))
      .filter((item): item is RutubeVideo => item !== null);
    return { videos, nextUrl: next };
  }

  // Guard against bad IDs to avoid hammering proxies
  if (!category.rutubeId) return { videos: [], nextUrl: null };

  // --- CHANNEL STRATEGY: try API first, then HTML scraping
  if (category.type === 'channel') {
    let channelId = category.rutubeId;
    if (!isValidRutubeId(channelId)) {
      const resolved = await resolveRutubeId(channelId, 'channel');
      if (!resolved || !isValidRutubeId(resolved)) {
        return { videos: [], nextUrl: null };
      }
      channelId = resolved;
    }
    const apiUrl = `${BASE_API}/video/person/${channelId}/?client=android&format=json`;
    const apiRes = await fetchSinglePage(apiUrl, options);
    const apiVideos = apiRes.results
      .map(item => mapRutubeItem(item, settings))
      .filter((item): item is RutubeVideo => item !== null);

    if (apiVideos.length > 0) {
      if (!fetchAll) {
        return { videos: apiVideos, nextUrl: apiRes.next };
      }

      let allVideos = [...apiVideos];
      let cursor = apiRes.next;
      let page = 0;
      const pageSize = apiVideos.length || 20;
      const expectedTotalPages =
        category.itemCount && category.itemCount > 0
          ? Math.ceil(category.itemCount / Math.max(1, pageSize))
          : null;
      const MAX_TOTAL_PAGES = 200;
      const maxAdditionalPages =
        expectedTotalPages !== null
          ? Math.min(Math.max(expectedTotalPages - 1, 0), MAX_TOTAL_PAGES - 1)
          : MAX_TOTAL_PAGES - 1;
      const seenCursors = new Set<string>();

      while (cursor && page < maxAdditionalPages && !seenCursors.has(cursor)) {
        seenCursors.add(cursor);
        const { results: nextRes, next: nextNext } = await fetchSinglePage(cursor, options);
        allVideos = [
          ...allVideos,
          ...nextRes
            .map(item => mapRutubeItem(item, settings))
            .filter((item): item is RutubeVideo => item !== null),
        ];
        if (category.itemCount && allVideos.length >= category.itemCount) {
          cursor = null;
          break;
        }
        cursor = nextNext;
        page++;
      }

      return { videos: allVideos, nextUrl: null };
    }

    const maxPages = fetchAll ? 8 : 3;
    const scraped = await scrapeVideosPaginated(channelId, maxPages, options);
    const videos = scraped
      .map(item => mapRutubeItem(item, settings))
      .filter((item): item is RutubeVideo => item !== null);
    return { videos, nextUrl: null };
  }

  // --- PLAYLIST STRATEGY: keep JSON API, but fail fast on invalid ID
  if (category.type === 'playlist' && !isValidRutubeId(category.rutubeId)) {
    return { videos: [], nextUrl: null };
  }

  let results: any[] = [];
  let next: string | null = null;

  const initialUrls = [
    `${BASE_API}/playlist/custom/${category.rutubeId}/videos/?client=android&format=json`,
  ];

  for (const url of initialUrls) {
    const res = await fetchSinglePage(url, options);
    if (res.results.length > 0) {
      results = res.results;
      next = res.next;
      break;
    }
  }

  const mapAndFilter = (res: any[]) =>
    res
      .map(item => mapRutubeItem(item, settings))
      .filter((item): item is RutubeVideo => item !== null);

  if (!fetchAll) {
    return { videos: mapAndFilter(results), nextUrl: next };
  }

  let allVideos = mapAndFilter(results);
  let cursor = next;
  let page = 0;
  const pageSize = results.length || 20;
  const expectedTotalPages =
    category.itemCount && category.itemCount > 0
      ? Math.ceil(category.itemCount / Math.max(1, pageSize))
      : null;
  const MAX_TOTAL_PAGES = 200;
  const maxAdditionalPages =
    expectedTotalPages !== null
      ? Math.min(Math.max(expectedTotalPages - 1, 0), MAX_TOTAL_PAGES - 1)
      : MAX_TOTAL_PAGES - 1;
  const seenCursors = new Set<string>();

  while (cursor && page < maxAdditionalPages && !seenCursors.has(cursor)) {
    seenCursors.add(cursor);
    const { results: nextRes, next: nextNext } = await fetchSinglePage(cursor, options);
    allVideos = [...allVideos, ...mapAndFilter(nextRes)];
    if (category.itemCount && allVideos.length >= category.itemCount) {
      cursor = null;
      break;
    }
    cursor = nextNext;
    page++;
  }

  return { videos: allVideos, nextUrl: null };
};

const findPlaylistsInRedux = (state: any): any[] => {
  if (!state || typeof state !== 'object') return [];

  const potentialPaths = [
    state.userChannel?.playlists?.results,
    state.userChannel?.playlists,
    state.profile?.playlists?.results,
    state.profile?.playlists,
    state.channel?.playlists?.results,
    state.playlists?.results,
  ];

  for (const list of potentialPaths) {
    if (Array.isArray(list) && list.length > 0) return list;
  }

  return [];
};

export const fetchChannelPlaylists = async (
  rutubeId: string,
  options?: { signal?: AbortSignal }
): Promise<CategoryDef[]> => {
  const uniquePlaylists = new Map<string, CategoryDef>();

  const addPlaylists = (list: any[]) => {
    list.forEach((item: any) => {
      const id = String(item.id);
      const name = item.title || item.name || 'Без названия';
      const count = item.video_count || item.videos_count || item.count || undefined;

      if (id && !uniquePlaylists.has(id)) {
        uniquePlaylists.set(id, {
          id: `playlist-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          label: name,
          rutubeId: id,
          type: 'playlist',
          isSystem: false,
          itemCount: count,
        });
      }
    });
  };

  const endpoints = [`${BASE_API}/playlist/user/${rutubeId}/?client=android&format=json`];

  for (const endpoint of endpoints) {
    try {
      let currentUrl: string | null = endpoint;
      let pages = 0;
      const MAX_PLAYLIST_PAGES = 10;

      while (currentUrl && pages < MAX_PLAYLIST_PAGES) {
        const { results, next } = await fetchSinglePage(currentUrl, options);
        if (results && results.length > 0) {
          addPlaylists(results);
          currentUrl = next;
          pages++;
        } else {
          break;
        }
      }
      if (uniquePlaylists.size > 20) break;
    } catch (e) {}
  }

  const urlsToCheck = [`https://rutube.ru/channel/${rutubeId}/playlists/`];
  if (!/^\d+$/.test(rutubeId)) {
    urlsToCheck.push(`https://rutube.ru/u/${rutubeId}/playlists/`);
  }

  for (const pageUrl of urlsToCheck) {
    try {
      const html = await fetchTextWithRace(pageUrl, options);

      const reduxMatch = html.match(/window\.reduxState\s*=\s*(\{.+?\});/);
      if (reduxMatch && reduxMatch[1]) {
        try {
          const state = JSON.parse(reduxMatch[1]);
          const list = findPlaylistsInRedux(state);
          if (list.length > 0) addPlaylists(list);
        } catch (e) {}
      }

      const jsonLikeRegex = /\{[^{}]*"playlist_url"[^{}]*\}/g;
      let m;
      while ((m = jsonLikeRegex.exec(html)) !== null) {
        const objStr = m[0];
        const pidM = objStr.match(/"playlist_url":"\/plst\/(\d+)\/"/);
        const titleM = objStr.match(/"title":"([^"]+)"/);
        if (pidM && titleM) {
          const id = pidM[1];
          const name = titleM[1];
          if (!uniquePlaylists.has(id)) {
            uniquePlaylists.set(id, {
              id: `playlist-${id}-${Date.now()}`,
              label: name,
              rutubeId: id,
              type: 'playlist',
              isSystem: false,
            });
          }
        }
      }

      const playlistLinkRegex = /href="\/plst\/(\d+)\/"[^>]*?>([^<]+?)<\/a>/g;
      while ((m = playlistLinkRegex.exec(html)) !== null) {
        const pid = m[1];
        const title = m[2].trim();
        if (pid && title && !uniquePlaylists.has(pid)) {
          uniquePlaylists.set(pid, {
            id: `playlist-${pid}-${Date.now()}`,
            label: title,
            rutubeId: pid,
            type: 'playlist',
            isSystem: false,
          });
        }
      }
    } catch (e) {}
  }

  return Array.from(uniquePlaylists.values());
};

export const formatSubscribers = (count: number): string => {
  if (isNaN(count) || count < 0) return '0';
  if (count >= 1000000)
    return `${(count / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
  if (count >= 1000)
    return `${(count / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K`;
  return count.toLocaleString('ru-RU');
};

const fixRutubeUrl = (url: any): string => {
  if (typeof url !== 'string' || !url) return '';
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return 'https://rutube.ru' + url;
  if (url.startsWith('data:')) return url;
  if (!url.startsWith('http')) return 'https://' + url;
  return url;
};

const cleanChannelTitle = (rawTitle: string): string => {
  let title = rawTitle;

  title = title
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ');

  const separators = [
    '•',
    '—',
    '–',
    '|',
    ' смотреть онлайн',
    ' на Rutube',
    ' в Rutube',
    ' видео онлайн',
    ' бесплатно',
    ' полная коллекция',
    ' коллекция видео',
  ];

  for (const sep of separators) {
    if (title.includes(sep)) {
      title = title.split(sep)[0];
    }
  }

  return title.trim();
};

export const fetchChannelInfo = async (
  rutubeId: string,
  options?: { signal?: AbortSignal }
): Promise<ChannelInfo | null> => {
  if (!rutubeId) return null;

  const channelUrl = `https://rutube.ru/channel/${rutubeId}/`;

  try {
    const html = await fetchTextWithRace(channelUrl, options);

    const result: Partial<ChannelInfo> & { rawSubs?: number; rawVideos?: number } = {};

    let subMatch = html.match(/"followers_count":\s*(\d+)/);
    if (!subMatch) subMatch = html.match(/"subscribers_count":\s*(\d+)/);
    if (!subMatch) subMatch = html.match(/"followers":\s*(\d+)/);
    if (subMatch && subMatch[1]) result.rawSubs = parseInt(subMatch[1], 10);

    const videoCountMatch = html.match(/"video_count":\s*(\d+)/);
    if (videoCountMatch && videoCountMatch[1]) result.rawVideos = parseInt(videoCountMatch[1], 10);

    const imgBannerMatch = html.match(
      /class="[^"]*wdp-feed-banner-module__section-background-image[^"]*"[^>]*src="([^"]+)"/
    );
    if (imgBannerMatch && imgBannerMatch[1]) {
      result.bannerUrl = fixRutubeUrl(imgBannerMatch[1]);
    }

    if (!result.bannerUrl) {
      const patterns = [
        /"cover":\s*\{\s*"url":\s*"([^"]+)"/,
        /"banner_url":\s*"([^"]+)"/,
        /"tv_banner_url":\s*"([^"]+)"/,
        /"original_image":\s*"([^"]+)"/,
        /"artwork":\s*"([^"]+)"/,
        /"feed_banner_url":\s*"([^"]+)"/,
      ];
      for (const regex of patterns) {
        const match = html.match(regex);
        if (match && match[1] && (match[1].includes('rutube') || match[1].includes('http'))) {
          result.bannerUrl = fixRutubeUrl(match[1]);
          break;
        }
      }
    }

    const imgAvatarMatch = html.match(
      /class="[^"]*wdp-feed-banner-avatar-module__avatar-image[^"]*"[^>]*src="([^"]+)"/
    );
    if (imgAvatarMatch && imgAvatarMatch[1]) {
      result.avatarUrl = fixRutubeUrl(imgAvatarMatch[1]);
    }

    if (!result.avatarUrl) {
      const avMatch =
        html.match(/"avatar":\s*\{\s*"url":\s*"([^"]+)"/) ||
        html.match(/"avatar_url":\s*"([^"]+)"/);
      if (avMatch && avMatch[1]) result.avatarUrl = fixRutubeUrl(avMatch[1]);
    }

    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      result.title = cleanChannelTitle(ogTitleMatch[1]);
    }

    if (!result.title) {
      const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleTagMatch && titleTagMatch[1]) {
        result.title = cleanChannelTitle(titleTagMatch[1]);
      }
    }

    if (!result.title) {
      const nameRegex = /"name":\s*"([^"]+)"/g;
      let m;
      while ((m = nameRegex.exec(html)) !== null) {
        const candidate = m[1];
        if (
          !candidate.startsWith('data-') &&
          !candidate.includes('_') &&
          candidate.length > 2 &&
          !/^[a-z]+$/.test(candidate)
        ) {
          result.title = candidate;
          break;
        }
      }
    }

    if (result.title) {
      return {
        title: result.title,
        subscribers: formatSubscribers(result.rawSubs || 0),
        avatarUrl: result.avatarUrl || '',
        bannerUrl: result.bannerUrl || '',
        videoCount: result.rawVideos,
      };
    }
  } catch (e) {}

  return null;
};

export const getEmbedUrl = (videoId: string): string => {
  return `https://rutube.ru/play/embed/${videoId}`;
};

export const formatDuration = (seconds: number | undefined | null): string => {
  const sTotal = Number(seconds);
  if (isNaN(sTotal) || sTotal <= 0) return '0:00';
  const h = Math.floor(sTotal / 3600);
  const m = Math.floor((sTotal % 3600) / 60);
  const s = Math.floor(sTotal % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatViews = (views: number | undefined | null): string => {
  const v = Number(views);
  if (isNaN(v) || v < 0) return '0';
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toString();
};

export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'только что';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн. назад`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} нед. назад`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} мес. назад`;
  const years = Math.floor(days / 365.25);
  return `${years} г. назад`;
};
