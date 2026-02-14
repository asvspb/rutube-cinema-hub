import { useState, useEffect, useCallback } from 'react';
import { CategoryDef, RutubeVideo, RatingSettings, CachedPlaylistData } from '../types';
import { fetchVideos } from '../services/rutubeService';
import { ChannelDef } from '../types';

interface UseVideoLogicProps {
  activeCategory: CategoryDef | null;
  refreshKey: number;
  isChannelLoading: boolean;
  viewMode: 'home' | 'channel';
  channels: ChannelDef[];
  ratingSettings: RatingSettings;
  getFromCache: (categoryId: string) => CachedPlaylistData | undefined;
  addToCache: (categoryId: string, data: CachedPlaylistData) => void;
  setVideos: React.Dispatch<React.SetStateAction<RutubeVideo[]>>;
  setIsVideoLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setNextPageUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseVideoLogicResult {
  isLoadingMore: boolean;
  setIsLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  isFetchAllMode: boolean;
  setIsFetchAllMode: React.Dispatch<React.SetStateAction<boolean>>;
  handleLoadMore: () => Promise<void>;
  handleRefresh: (fetchAll?: boolean) => void;
}

export const useVideoLogic = ({
  activeCategory,
  refreshKey,
  isChannelLoading,
  viewMode,
  channels,
  ratingSettings,
  getFromCache,
  addToCache,
  setVideos,
  setIsVideoLoading,
  setNextPageUrl,
}: UseVideoLogicProps): UseVideoLogicResult => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetchAllMode, setIsFetchAllMode] = useState(false);

  // Main effect for loading videos
  useEffect(() => {
    const abortController = new AbortController();

    const loadHomeFeed = async () => {
      if (abortController.signal.aborted) return;

      setVideos([]);
      setIsVideoLoading(true);
      setNextPageUrl(null);

      try {
        const results: PromiseSettledResult<Awaited<ReturnType<typeof fetchVideos>>>[] = [];

        for (const channel of channels) {
          if (abortController.signal.aborted) break;
          const tempCategory: CategoryDef = {
            id: `home-temp-${channel.rutubeId}`,
            label: 'All',
            rutubeId: channel.rutubeId,
            type: 'channel',
          };
          try {
            const value = await fetchVideos(tempCategory, ratingSettings, null, false, {
              signal: abortController.signal,
            });
            results.push({ status: 'fulfilled', value });
          } catch (reason) {
            results.push({ status: 'rejected', reason });
          }
        }

        let initialVideos: RutubeVideo[] = [];
        if (!abortController.signal.aborted) {
          const byId = new Map<string, RutubeVideo>();
          results.forEach(result => {
            if (
              result.status === 'fulfilled' &&
              result.value.videos &&
              result.value.videos.length > 0
            ) {
              result.value.videos.forEach(v => {
                if (!byId.has(v.id)) {
                  byId.set(v.id, v);
                }
              });
            }
          });

          initialVideos = Array.from(byId.values());
          initialVideos.sort(
            (a, b) => new Date(b.created_ts).getTime() - new Date(a.created_ts).getTime()
          );
          setVideos(initialVideos);
          setIsVideoLoading(false);
        }

        // Background: fetch full lists and merge (sequential to avoid rate limits)
        const fullResults: PromiseSettledResult<Awaited<ReturnType<typeof fetchVideos>>>[] = [];
        for (const channel of channels) {
          if (abortController.signal.aborted) break;
          const tempCategory: CategoryDef = {
            id: `home-temp-full-${channel.rutubeId}`,
            label: 'All',
            rutubeId: channel.rutubeId,
            type: 'channel',
          };
          try {
            const value = await fetchVideos(tempCategory, ratingSettings, null, true, {
              signal: abortController.signal,
            });
            fullResults.push({ status: 'fulfilled', value });
          } catch (reason) {
            fullResults.push({ status: 'rejected', reason });
          }
        }
        if (!abortController.signal.aborted) {
          const mergedById = new Map<string, RutubeVideo>();
          initialVideos.forEach(v => mergedById.set(v.id, v));
          fullResults.forEach(result => {
            if (
              result.status === 'fulfilled' &&
              result.value.videos &&
              result.value.videos.length > 0
            ) {
              result.value.videos.forEach(v => {
                if (!mergedById.has(v.id)) {
                  mergedById.set(v.id, v);
                }
              });
            }
          });

          const merged = Array.from(mergedById.values());
          merged.sort(
            (a, b) => new Date(b.created_ts).getTime() - new Date(a.created_ts).getTime()
          );
          setVideos(merged);
        }
      } catch (e) {
        if (!abortController.signal.aborted) {
          console.error('Home feed error', e);
        }
      } finally {
        if (!abortController.signal.aborted) setIsVideoLoading(false);
      }
    };

    const loadChannelVideos = async () => {
      if (isChannelLoading) {
        return;
      }

      if (!activeCategory) {
        if (!abortController.signal.aborted) {
          setVideos([]);
          setNextPageUrl(null);
          setIsVideoLoading(false);
        }
        return;
      }

      if (getFromCache(activeCategory.id)) {
        const cached = getFromCache(activeCategory.id);
        if (!abortController.signal.aborted && cached) {
          setVideos(cached.data);
          setNextPageUrl(cached.nextUrl);
          setIsVideoLoading(false);
        }
        return;
      }

      if (!abortController.signal.aborted) setIsVideoLoading(true);

      try {
        if (!activeCategory.rutubeId) throw new Error('Invalid category ID');

        const shouldFetchAll = isFetchAllMode || activeCategory.type === 'playlist';

        if (shouldFetchAll && activeCategory.type === 'channel') {
          const firstPage = await fetchVideos(activeCategory, ratingSettings, null, false, {
            signal: abortController.signal,
          });
          if (abortController.signal.aborted) return;

          setVideos(firstPage.videos || []);
          setNextPageUrl(firstPage.nextUrl);
          addToCache(activeCategory.id, {
            data: firstPage.videos || [],
            nextUrl: firstPage.nextUrl,
          });
          setIsVideoLoading(false);

          if (firstPage.nextUrl) {
            setIsLoadingMore(true);
            let cursor: string | null = firstPage.nextUrl;
            let aggregated: RutubeVideo[] = [...(firstPage.videos || [])];
            let page = 0;
            const MAX_PAGES = 200;
            const seenCursors = new Set<string>();

            try {
              while (
                cursor &&
                !abortController.signal.aborted &&
                page < MAX_PAGES &&
                !seenCursors.has(cursor)
              ) {
                seenCursors.add(cursor);
                const { videos: moreVideos, nextUrl } = await fetchVideos(
                  activeCategory,
                  ratingSettings,
                  cursor,
                  undefined,
                  { signal: abortController.signal }
                );
                if (abortController.signal.aborted) return;
                if (moreVideos && moreVideos.length > 0) {
                  aggregated = [...aggregated, ...moreVideos];
                  setVideos(aggregated);
                  addToCache(activeCategory.id, { data: aggregated, nextUrl });
                  if (activeCategory.itemCount && aggregated.length >= activeCategory.itemCount) {
                    cursor = null;
                    break;
                  }
                }
                cursor = nextUrl;
                page++;
              }
            } catch (err) {
              if (!abortController.signal.aborted) {
                console.error('Background fetch failed:', err);
              }
            } finally {
              if (!abortController.signal.aborted) {
                setNextPageUrl(null);
                addToCache(activeCategory.id, { data: aggregated, nextUrl: null });
                setIsLoadingMore(false);
              }
            }
          }
          return;
        }

        const { videos: newVideos, nextUrl } = await fetchVideos(
          activeCategory,
          ratingSettings,
          null,
          shouldFetchAll,
          { signal: abortController.signal }
        );

        if (!abortController.signal.aborted) {
          setVideos(newVideos || []);
          setNextPageUrl(nextUrl);

          addToCache(activeCategory.id, { data: newVideos || [], nextUrl: nextUrl });
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('Fetch videos failed:', err);
          setVideos([]);
          setNextPageUrl(null);
        }
      } finally {
        if (!abortController.signal.aborted) setIsVideoLoading(false);
      }
    };

    if (viewMode === 'home') {
      loadHomeFeed();
    } else {
      loadChannelVideos();
    }

    return () => {
      abortController.abort();
    };
  }, [
    activeCategory,
    refreshKey,
    isChannelLoading,
    viewMode,
    channels,
    ratingSettings,
    getFromCache,
    addToCache,
    setVideos,
    setIsVideoLoading,
    setNextPageUrl,
    isFetchAllMode,
  ]);

  const handleLoadMore = async () => {
    if (viewMode === 'home') return;
    if (!activeCategory || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const { videos: newVideos, nextUrl } = await fetchVideos(
        activeCategory,
        ratingSettings,
        null,
        undefined,
        { signal: AbortSignal.timeout(10000) } // Add timeout for load more
      );

      setVideos(prev => {
        const updated = [...prev, ...newVideos];
        addToCache(activeCategory.id, { data: updated, nextUrl: nextUrl });
        return updated;
      });
    } catch (e) {
      console.error('Failed to load more', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(
    (fetchAll: boolean = false) => {
      if (!activeCategory && viewMode !== 'home') return;

      if (viewMode === 'home') {
        // Refresh home feed by updating refreshKey
        return;
      }

      setIsFetchAllMode(fetchAll);

      if (activeCategory) {
        addToCache(activeCategory.id, { data: [], nextUrl: null });
      }
    },
    [activeCategory, viewMode, addToCache]
  );

  return {
    isLoadingMore,
    setIsLoadingMore,
    isFetchAllMode,
    setIsFetchAllMode,
    handleLoadMore,
    handleRefresh,
  };
};
