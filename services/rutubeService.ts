
import { RutubeApiResponse, RutubeVideo, CategoryDef, ChannelDef, SortOption, RatingSettings, ChannelInfo } from '../types';
import { logger } from './loggerService';

const BASE_API = 'https://rutube.ru/api';

export const DEFAULT_CHANNELS: ChannelDef[] = [
  { 
    id: '32869212', 
    label: 'Смотри кино', 
    rutubeId: '32869212', 
    isSystem: true 
  },
  { 
    id: '32181632', 
    label: 'Фильмач', 
    rutubeId: '32181632', 
    isSystem: true 
  },
  { 
    id: '36921062', 
    label: 'Синемач', 
    rutubeId: '36921062', 
    isSystem: true 
  },
  { 
    id: '38284124', 
    label: 'Твое кино', 
    rutubeId: '38284124', 
    isSystem: true 
  }
];

export const DEFAULT_PLAYLISTS_BY_CHANNEL: Record<string, CategoryDef[]> = {
  '32869212': [
    { 
      id: 'all-32869212', 
      label: 'Все видео', 
      rutubeId: '32869212', 
      type: 'channel', 
      isSystem: true 
    }
  ],
  '32181632': [
    { 
      id: 'all-32181632', 
      label: 'Все видео', 
      rutubeId: '32181632', 
      type: 'channel', 
      isSystem: true 
    }
  ],
  '36921062': [
    { 
      id: 'all-36921062', 
      label: 'Все видео', 
      rutubeId: '36921062', 
      type: 'channel', 
      isSystem: true 
    }
  ],
  '38284124': [
    { 
      id: 'all-38284124', 
      label: 'Все видео', 
      rutubeId: '38284124', 
      type: 'channel', 
      isSystem: true 
    }
  ]
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
  useAverageForHigh: false
};

export const parseRutubeUrl = (url: string): { id: string, type: 'channel' | 'playlist' } | null => {
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

    const userMatch = path.match(/\/u\/([^\/]+)/);
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

const getProxies = () => [
  // 1. PRIMARY STRATEGY: Self-hosted / Local Middleware
  (target: string) => `http://localhost:9230/api/proxy?url=${encodeURIComponent(target)}`,

  // 2. FALLBACK: Direct access (Works in Russia without VPN)
  (target: string) => target,

  // 3. FALLBACK: Public Proxies
  (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
  (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
  (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
];

// Helper: Tries all proxies in parallel and returns the first successful text response
const fetchTextWithRace = async (targetUrl: string): Promise<string> => {
  const proxies = getProxies();
  
  const requests = proxies.map(proxyGen => {
    const url = proxyGen(targetUrl);
    return new Promise<string>((resolve, reject) => {
      const controller = new AbortController();
      const isLocal = url.startsWith('/api');
      const timeoutMs = isLocal ? 3000 : 10000; // Increased timeout for public proxies
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs); 

      fetch(url, { signal: controller.signal })
        .then(async (res) => {
          clearTimeout(timeoutId);
          if (res.ok) {
            try {
              const text = await res.text();
              if (text.length > 20 && !text.includes('Proxy Error') && !text.includes('Access Denied')) {
                resolve(text);
              } else {
                const errorMsg = text.includes('Access Denied') ? 'Access Denied' : 'Proxy error or empty';
                logger.warn(`Proxy response issue: ${errorMsg}`, { url, text: text.substring(0, 100) });
                reject(new Error(errorMsg));
              }
            } catch (e) {
              logger.error('Failed to read proxy response', { url }, e as Error);
              reject(e);
            }
          } else {
            logger.warn(`Proxy returned status ${res.status}`, { url });
            reject(new Error(`Status ${res.status}`));
          }
        })
        .catch(e => {
          clearTimeout(timeoutId);
          if (e.name !== 'AbortError') {
            logger.error('Proxy fetch failed', { url }, e as Error);
          }
          reject(e);
        });
    });
  });

  return new Promise((resolve, reject) => {
    let errorsCount = 0;
    if (requests.length === 0) {
        reject(new Error('No proxies available'));
        return;
    }
    
    let resolved = false;

    requests.forEach(p => {
      p.then(text => {
        if (!resolved) {
          resolved = true;
          resolve(text);
        }
      }).catch(() => {
        errorsCount++;
        if (errorsCount === requests.length && !resolved) {
          logger.error('All proxies failed for URL', { targetUrl });
          reject(new Error('All proxies failed'));
        }
      });
    });
  });
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
      } catch (e) { throw new Error('Invalid wrapper'); }
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
                state.currentChannel?.id
            ];
            const found = candidates.find(id => id && String(id).match(/^\d+$/));
            if (found) return String(found);
        } catch(e) {}
    }
    return null;
}

export const resolveRutubeId = async (id: string, type: 'channel' | 'playlist'): Promise<string | null> => {
  if (type === 'playlist') return id;
  if (/^\d+$/.test(id)) return id;

  const timestamp = new Date().getTime();
  const apiUrl = `${BASE_API}/profile/user/${id}/?client=android&format=json&_=${timestamp}`;
  try {
    const text = await fetchTextWithRace(apiUrl);
    const data = parseProxyResponse(text);
    if (data && data.id) return String(data.id);
  } catch (e) { /* ignore */ }

  try {
      const strategies = [
          `https://rutube.ru/channel/${id}/`,
          `https://rutube.ru/u/${id}/`
      ];

      for (const url of strategies) {
          try {
            const html = await fetchTextWithRace(url);
            const idMatch = html.match(/"user":\s*\{[^}]*"id":\s*(\d+)/) || 
                            html.match(/"author":\s*\{[^}]*"id":\s*(\d+)/) ||
                            html.match(/user_id\s*=\s*(\d+)/) ||
                            html.match(/"id":\s*(\d+),\s*"is_official"/);
            if (idMatch && idMatch[1]) return idMatch[1];
            const reduxId = findIdInHtml(html);
            if (reduxId) return reduxId;
          } catch(e) {}
      }
  } catch(e) {}

  return null;
};

export const calculateRating = (views: number, createdTs: string, settings: RatingSettings = DEFAULT_RATING_SETTINGS): number => {
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
    const intercept = rLow - (slope * logLow);
    let rating = (slope * logViews) + intercept;
    return Math.max(1.0, Math.min(10.0, Math.round(rating * 10) / 10));
  }
  
  const createdDate = new Date(createdTs);
  if (isNaN(createdDate.getTime())) return 0;
  const now = new Date();
  const ageInMs = now.getTime() - createdDate.getTime();
  const ageInDays = Math.max(1, ageInMs / (1000 * 60 * 60 * 24));
  const viewsPerDay = v / ageInDays;
  if (viewsPerDay < 0.1) return 4.0; 
  let rating = settings.ratingBase + (Math.log10(viewsPerDay) * settings.ratingLogScale);
  return Math.max(1.0, Math.min(10.0, Math.round(rating * 10) / 10));
};

export const calculateGravity = (views: number, createdTs: string, settings: RatingSettings = DEFAULT_RATING_SETTINGS): number => {
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
  videoStatuses: Record<string, 'watched' | 'liked' | 'watch_later'> = {}
): RutubeVideo[] => {
  if (option === 'default') return direction === 'asc' ? [...videos] : [...videos].reverse();
  const sorted = [...videos];
  const dir = direction === 'asc' ? 1 : -1;
  switch (option) {
    case 'rating': return sorted.sort((a, b) => (a.rating - b.rating) * dir);
    case 'trend': return sorted.sort((a, b) => (a.gravity - b.gravity) * dir);
    case 'views': return sorted.sort((a, b) => (a.views - b.views) * dir);
    case 'date': return sorted.sort((a, b) => (new Date(a.created_ts).getTime() - new Date(b.created_ts).getTime()) * dir);
    case 'alphabetical': return sorted.sort((a, b) => a.title.localeCompare(b.title) * dir);
    case 'year': return sorted.sort((a, b) => (getYear(a) - getYear(b)) * dir);
    case 'watched':
      return sorted.sort((a, b) => {
          const statusA = videoStatuses[a.id] === 'watched' ? 1 : 0;
          const statusB = videoStatuses[b.id] === 'watched' ? 1 : 0;
          if (statusA !== statusB) return (statusA - statusB) * dir;
          return (new Date(b.created_ts).getTime() - new Date(a.created_ts).getTime());
      });
    case 'liked':
      return sorted.sort((a, b) => {
          const statusA = videoStatuses[a.id] === 'liked' ? 1 : 0;
          const statusB = videoStatuses[b.id] === 'liked' ? 1 : 0;
          if (statusA !== statusB) return (statusA - statusB) * dir;
          return (new Date(b.created_ts).getTime() - new Date(a.created_ts).getTime());
      });
    case 'watch_later':
      return sorted.sort((a, b) => {
          const statusA = videoStatuses[a.id] === 'watch_later' ? 1 : 0;
          const statusB = videoStatuses[b.id] === 'watch_later' ? 1 : 0;
          if (statusA !== statusB) return (statusA - statusB) * dir;
          return (new Date(b.created_ts).getTime() - new Date(a.created_ts).getTime());
      });
    default: return sorted;
  }
};

const mapRutubeItem = (item: any, settings: RatingSettings) => {
    if (!item || typeof item !== 'object') return null;
    const views = typeof item.views === 'number' ? item.views : (typeof item.hits === 'number' ? item.hits : 0);
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
      gravity: calculateGravity(views, created_ts, settings)
    };
};

const fetchSinglePage = async (url: string): Promise<{ results: any[], next: string | null }> => {
  const timestamp = new Date().getTime();
  let fetchUrl = url;
  if (fetchUrl.startsWith('http:')) fetchUrl = fetchUrl.replace('http:', 'https:');
  const urlWithCacheBust = fetchUrl.includes('_=') ? fetchUrl : `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}_=${timestamp}`;

  try {
    const text = await fetchTextWithRace(urlWithCacheBust);
    const data = parseProxyResponse(text);
    
    if (Array.isArray(data)) {
        return { results: data, next: null };
    }

    if (data && (Array.isArray(data.results) || data.results)) {
       const results = Array.isArray(data.results) ? data.results : [];
       const next = data.has_next ? data.next : null;
       return { results, next };
    }
  } catch (e) { /* ignore */ }

  return { results: [], next: null };
};

const findVideosInRedux = (state: any): any[] => {
    if (!state || typeof state !== 'object') return [];
    
    const potentialPaths = [
        state.userChannel?.videos?.results,
        state.feed?.results,
        state.channel?.videos?.results,
        state.profile?.videos?.results,
        state.videos?.results
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
        } catch(e) {}
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
                        thumbnail_url: '' 
                    });
                }
            }
        } catch(e) {}
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
                    thumbnail_url: ''
                });
            }
         }
    }
    
    return Array.from(videos.values());
};

const scrapeVideosFromHtml = async (channelId: string): Promise<any[]> => {
    try {
        let html = await fetchTextWithRace(`https://rutube.ru/channel/${channelId}/videos/`);
        let videos = extractVideosFromHtml(html);
        if (videos.length > 0) return videos;

        html = await fetchTextWithRace(`https://rutube.ru/u/${channelId}/videos/`);
        videos = extractVideosFromHtml(html);
        if (videos.length > 0) return videos;
        
        html = await fetchTextWithRace(`https://rutube.ru/channel/${channelId}/`);
        videos = extractVideosFromHtml(html);
        
        return videos;
    } catch(e) {
        return [];
    }
};

export const fetchVideos = async (
  category: CategoryDef, 
  settings: RatingSettings = DEFAULT_RATING_SETTINGS,
  nextPageCursor?: string | null,
  fetchAll: boolean = false
): Promise<{ videos: RutubeVideo[], nextUrl: string | null }> => {
  
  if (nextPageCursor) {
      const { results, next } = await fetchSinglePage(nextPageCursor);
      const videos = results.map(item => mapRutubeItem(item, settings)).filter((item): item is RutubeVideo => item !== null);
      return { videos, nextUrl: next };
  }

  let results: any[] = [];
  let next: string | null = null;
  let attempts = 0;

  // Strategy 1: Standard APIs
  let initialUrls = [];
  if (category.type === 'channel') {
    initialUrls = [
        `${BASE_API}/metainfo/tv/${category.rutubeId}/video/?sort=created_ts&type=all&client=android&format=json`, // TV API often works better
        `${BASE_API}/video/person/${category.rutubeId}/?client=android&format=json`,
        `${BASE_API}/search/video/?author=${category.rutubeId}&client=android&format=json`
    ];
  } else {
    initialUrls = [`${BASE_API}/playlist/custom/${category.rutubeId}/videos/?client=android&format=json`];
  }

  // Iterate through API strategies
  for (const url of initialUrls) {
      if (results.length > 0) break;
      const res = await fetchSinglePage(url);
      if (res.results.length > 0) {
          results = res.results;
          next = res.next;
          break;
      }
      // Small delay between strategies
      await new Promise(r => setTimeout(r, 500));
  }
  
  // Strategy 3: Scraping
  if (results.length === 0 && category.type === 'channel') {
      results = await scrapeVideosFromHtml(category.rutubeId);
      next = null; 
  }
  
  const mapAndFilter = (res: any[]) => res.map(item => mapRutubeItem(item, settings)).filter((item): item is RutubeVideo => item !== null);

  if (!fetchAll) {
      return { videos: mapAndFilter(results), nextUrl: next };
  }

  // Fetch all Logic
  let allVideos = mapAndFilter(results);
  let cursor = next;
  let page = 0;
  const MAX_PAGES = 50;

  while(cursor && page < MAX_PAGES) {
      const { results: nextRes, next: nextNext } = await fetchSinglePage(cursor);
      allVideos = [...allVideos, ...mapAndFilter(nextRes)];
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
        state.playlists?.results
     ];

     for (const list of potentialPaths) {
         if (Array.isArray(list) && list.length > 0) return list;
     }
     
     return [];
};

export const fetchChannelPlaylists = async (rutubeId: string): Promise<CategoryDef[]> => {
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
                  itemCount: count
              });
          }
      });
  };

  const endpoints = [
    `${BASE_API}/metainfo/tv/${rutubeId}/video-albums/?client=android&format=json`,
    `${BASE_API}/playlist/user/${rutubeId}/?client=android&format=json`, 
    `${BASE_API}/profile/user/${rutubeId}/playlists/?client=android&format=json`,
    `${BASE_API}/video/person/${rutubeId}/playlists/?client=android&format=json`,
    `${BASE_API}/channel/${rutubeId}/playlists/?client=android&format=json` 
  ];

  for (const endpoint of endpoints) {
    try {
        let currentUrl: string | null = endpoint;
        let pages = 0;
        const MAX_PLAYLIST_PAGES = 10;
        
        while(currentUrl && pages < MAX_PLAYLIST_PAGES) {
             const { results, next } = await fetchSinglePage(currentUrl);
             if (results && results.length > 0) {
                 addPlaylists(results);
                 currentUrl = next; 
                 pages++;
             } else {
                 break;
             }
        }
        if (uniquePlaylists.size > 20) break; 
    } catch(e) {}
  }
  
  const urlsToCheck = [
      `https://rutube.ru/channel/${rutubeId}/playlists/`,
      `https://rutube.ru/u/${rutubeId}/playlists/`
  ];

  for (const pageUrl of urlsToCheck) {
    try {
        const html = await fetchTextWithRace(pageUrl);
        
        const reduxMatch = html.match(/window\.reduxState\s*=\s*(\{.+?\});/);
        if (reduxMatch && reduxMatch[1]) {
            try {
                const state = JSON.parse(reduxMatch[1]);
                const list = findPlaylistsInRedux(state);
                if (list.length > 0) addPlaylists(list);
            } catch(e) {}
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
                        isSystem: false
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
                    isSystem: false
                });
            }
        }
    } catch(e) {}
  }

  return Array.from(uniquePlaylists.values());
};

export const formatSubscribers = (count: number): string => {
  if (isNaN(count) || count < 0) return '0';
  if (count >= 1000000) return `${(count / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
  if (count >= 1000) return `${(count / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K`;
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
    
    title = title.replace(/&amp;/g, '&')
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>')
                 .replace(/&quot;/g, '"')
                 .replace(/&#39;/g, "'")
                 .replace(/&ndash;/g, '–')
                 .replace(/&mdash;/g, '—') 
                 .replace(/&nbsp;/g, ' ');

    const separators = [
        '•', '—', '–', '|', 
        ' смотреть онлайн', ' на Rutube', ' в Rutube', ' видео онлайн', ' бесплатно',
        ' полная коллекция', ' коллекция видео'
    ];

    for (const sep of separators) {
        if (title.includes(sep)) {
            title = title.split(sep)[0];
        }
    }

    return title.trim();
};

export const fetchChannelInfo = async (rutubeId: string): Promise<ChannelInfo | null> => {
  if (!rutubeId) return null;
  
  const channelUrl = `https://rutube.ru/channel/${rutubeId}/`;
  
  try {
    const html = await fetchTextWithRace(channelUrl);
    
    const result: Partial<ChannelInfo> & { rawSubs?: number, rawVideos?: number } = {};

    let subMatch = html.match(/"followers_count":\s*(\d+)/);
    if (!subMatch) subMatch = html.match(/"subscribers_count":\s*(\d+)/);
    if (!subMatch) subMatch = html.match(/"followers":\s*(\d+)/);
    if (subMatch && subMatch[1]) result.rawSubs = parseInt(subMatch[1], 10);

    let videoCountMatch = html.match(/"video_count":\s*(\d+)/);
    if (videoCountMatch && videoCountMatch[1]) result.rawVideos = parseInt(videoCountMatch[1], 10);

    const imgBannerMatch = html.match(/class="[^"]*wdp-feed-banner-module__section-background-image[^"]*"[^>]*src="([^"]+)"/);
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
          /"feed_banner_url":\s*"([^"]+)"/             
        ];
        for (const regex of patterns) {
          const match = html.match(regex);
          if (match && match[1] && (match[1].includes('rutube') || match[1].includes('http'))) {
              result.bannerUrl = fixRutubeUrl(match[1]);
              break; 
          }
        }
    }

    const imgAvatarMatch = html.match(/class="[^"]*wdp-feed-banner-avatar-module__avatar-image[^"]*"[^>]*src="([^"]+)"/);
    if (imgAvatarMatch && imgAvatarMatch[1]) {
        result.avatarUrl = fixRutubeUrl(imgAvatarMatch[1]);
    }
    
    if (!result.avatarUrl) {
        const avMatch = html.match(/"avatar":\s*\{\s*"url":\s*"([^"]+)"/) || html.match(/"avatar_url":\s*"([^"]+)"/);
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
            if (!candidate.startsWith('data-') && !candidate.includes('_') && candidate.length > 2 && !/^[a-z]+$/.test(candidate)) {
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
            videoCount: result.rawVideos
        };
    }
  } catch (e) {
  }

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
