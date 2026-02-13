import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Tv,
  PlayCircle,
  Info,
  Loader2,
  PlusCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Heart,
  History as HistoryIcon,
  Search,
  X,
  Plus,
  Calculator,
  LayoutGrid,
  MoreVertical,
  Pencil,
  Trash2,
  Save,
  ChevronLeft,
  ListPlus,
  GripVertical,
  ChevronRight,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Reorder } from 'framer-motion';

import { Navigation } from './components/Navigation';
import { MainContent } from './components/MainContent';
import { VideoModal } from './components/VideoModal';
import { AddCategoryModal } from './components/AddCategoryModal';
import { AddChannelModal } from './components/AddChannelModal';
import { FormulaSettingsModal } from './components/FormulaSettingsModal';
import { ImportPlaylistsModal } from './components/ImportPlaylistsModal';
import { HistoryModal } from './components/HistoryModal';
import { KinoRateModal } from './components/KinoRate/KinoRateModal';
import { ConfirmModal } from './components/ConfirmModal';
import { NotificationModal } from './components/NotificationModal';
import { CategoryFilter } from './components/CategoryFilter';
import { ChannelHeader } from './components/ChannelHeader';
import {
  VideoGrid,
  EmptyState,
  LoadingState,
  NoChannelsState,
  SortOptionsList,
  GridOptionsList,
  ChannelMenuContent,
} from './components/UIComponents';
import { Pagination } from './components/Pagination';
import { RecommendedChannelCard } from './components/RecommendedChannelCard';

import { StorageService } from './services/storageService';
import {
  DEFAULT_CHANNELS,
  DEFAULT_PLAYLISTS_BY_CHANNEL,
  DEFAULT_RATING_SETTINGS,
  fetchChannelInfo,
  fetchChannelPlaylists,
  calculateRating,
  calculateGravity,
  sortVideos,
  getEmbedUrl,
  formatDuration,
  formatViews,
  formatRelativeTime,
  fetchVideos,
} from './services/rutubeService';
import { logger } from './services/loggerService';
import { findBestMovieMatch } from './services/top250Data';

import {
  ChannelDef,
  CategoryDef,
  RutubeVideo,
  SortOption,
  RatingSettings,
  ChannelInfo,
  MovieRatingData,
  CachedPlaylistData,
} from './types';

// Re-export types for consistency
export type {
  ChannelDef,
  CategoryDef,
  RutubeVideo,
  SortOption,
  RatingSettings,
  ChannelInfo,
  MovieRatingData,
  CachedPlaylistData,
};

const App: React.FC = () => {
  // ===== STATE MANAGEMENT =====

  // Channel Management
  const [channels, setChannels] = useState<ChannelDef[]>(() => StorageService.getChannels());
  const [activeChannelId, setActiveChannelId] = useState<string>(() =>
    StorageService.getActiveChannelId()
  );
  const [viewMode, setViewMode] = useState<'home' | 'channel'>('home');
  const [activeCategory, setActiveCategory] = useState<CategoryDef | null>(null);

  // Video Data
  const [videos, setVideos] = useState<RutubeVideo[]>([]);
  const [videoCache, setVideoCache] = useState<Record<string, CategoryDef[]>>(() =>
    StorageService.getAllPlaylists()
  );
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // User Preferences
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => StorageService.getIsLoggedIn());
  const [videoWatchedStatuses, setVideoWatchedStatuses] = useState<
    Record<string, 'watched' | 'watch_later'>
  >(() => {
    const migrated = StorageService.migrateOldStatusStructure(isLoggedIn);
    return migrated.watched;
  });
  const [videoLikedStatuses, setVideoLikedStatuses] = useState<
    Record<string, 'liked' | 'disliked'>
  >(() => {
    const migrated = StorageService.migrateOldStatusStructure(isLoggedIn);
    return migrated.liked;
  });
  const [watchHistory, setWatchHistory] = useState<RutubeVideo[]>(() =>
    StorageService.getWatchHistory(isLoggedIn)
  );

  // Metadata and AI
  const [metadataCache, setMetadataCache] = useState<Record<string, MovieRatingData>>(() =>
    StorageService.getMetadataCache()
  );
  const [loadingMetadataFor, setLoadingMetadataFor] = useState<Set<string>>(new Set());

  // UI State
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(() => StorageService.getGridColumns());
  const [sortOption, setSortOption] = useState<SortOption>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFetchAllMode, setIsFetchAllMode] = useState(false);

  // Modal States
  const [selectedVideo, setSelectedVideo] = useState<RutubeVideo | null>(null);
  const [isAddPlaylistModalOpen, setIsAddPlaylistModalOpen] = useState(false);
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [channelToImport, setChannelToImport] = useState<ChannelDef | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isKinoRateOpen, setIsKinoRateOpen] = useState(false);
  const [kinoRateQuery, setKinoRateQuery] = useState('');
  const [kinoRateContext, setKinoRateContext] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmCallback, setConfirmCallback] = useState<() => void>(() => {});
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('info');

  // Channel Menu State
  const [activeChannelMenuId, setActiveChannelMenuId] = useState<string | null>(null);
  const [channelMenuPosition, setChannelMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [channelEditName, setChannelEditName] = useState('');

  // User Menu State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Sort and Grid Menu States
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);

  // Refs
  const channelMenuRef = useRef<HTMLDivElement>(null);
  const channelInputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const gridMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Channel Info
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [isChannelLoading, setIsChannelLoading] = useState(false);
  const [channelAvailablePlaylists, setChannelAvailablePlaylists] = useState<CategoryDef[]>([]);

  // Rating Settings
  const [ratingSettings, setRatingSettings] = useState<RatingSettings>(() =>
    StorageService.getRatingSettings()
  );

  // ===== COMPUTED VALUES =====

  const activeChannel = useMemo(() => {
    return channels.find(c => c.id === activeChannelId);
  }, [channels, activeChannelId]);

  const currentChannelPlaylists = useMemo(() => {
    const list = videoCache[activeChannelId] || [];
    if (list.length === 0) {
      const channel = channels.find(c => c.id === activeChannelId);
      if (channel && videoCache[channel.rutubeId]) {
        return videoCache[channel.rutubeId];
      }
    }
    return list;
  }, [videoCache, activeChannelId, channels]);

  const sortOptionsList = useMemo(
    () => [
      { id: 'default' as SortOption, label: 'Сортировка rutube' },
      { id: 'trend' as SortOption, label: 'В тренде' },
      { id: 'rating' as SortOption, label: 'По рейтингу' },
      { id: 'views' as SortOption, label: 'По зрителям' },
      { id: 'date' as SortOption, label: 'По дате добавления' },
      { id: 'year' as SortOption, label: 'По году выпуска' },
      { id: 'alphabetical' as SortOption, label: 'В алфавитном порядке' },
      { id: 'watched' as SortOption, label: 'Просмотрено' },
      { id: 'liked' as SortOption, label: 'Понравилось' },
      { id: 'watch_later' as SortOption, label: 'Буду смотреть' },
    ],
    []
  );

  const gridOptionsList = useMemo(
    () => [
      { count: 2 as 2 | 3 | 4, label: '2 колонки' },
      { count: 3 as 2 | 3 | 4, label: '3 колонки' },
      { count: 4 as 2 | 3 | 4, label: '4 колонки' },
    ],
    []
  );

  const filteredVideos = useMemo(() => {
    if (!videos) return [];
    let result = [...videos];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(video => video.title && video.title.toLowerCase().includes(q));
    }

    return result;
  }, [videos, searchQuery]);

  const sortedVideos = useMemo(() => {
    return sortVideos(
      filteredVideos,
      sortOption,
      sortDirection,
      videoWatchedStatuses,
      videoLikedStatuses
    );
  }, [filteredVideos, sortOption, sortDirection, videoWatchedStatuses, videoLikedStatuses]);

  const displayedVideos = useMemo(() => {
    // For now, show all sorted videos. Pagination logic can be added here if needed.
    return sortedVideos;
  }, [sortedVideos]);

  const totalPages = useMemo(() => Math.ceil(sortedVideos.length / 50), [sortedVideos]);
  const currentPage = 1; // Simplified for now

  // ===== EFFECTS =====

  // Save channels to storage when they change
  useEffect(() => {
    StorageService.setChannels(channels);
  }, [channels]);

  // Save active channel ID to storage
  useEffect(() => {
    StorageService.setActiveChannelId(activeChannelId);
  }, [activeChannelId]);

  // Save playlists to storage
  useEffect(() => {
    StorageService.setAllPlaylists(videoCache);
  }, [videoCache]);

  // Save user preferences to storage
  useEffect(() => {
    StorageService.setIsLoggedIn(isLoggedIn);
    StorageService.setVideoWatchedStatuses(videoWatchedStatuses, isLoggedIn);
    StorageService.setVideoLikedStatuses(videoLikedStatuses, isLoggedIn);
    StorageService.setWatchHistory(watchHistory, isLoggedIn);
  }, [isLoggedIn, videoWatchedStatuses, videoLikedStatuses, watchHistory]);

  // Save metadata cache to storage
  useEffect(() => {
    StorageService.setMetadataCache(metadataCache);
  }, [metadataCache]);

  // Save rating settings to storage
  useEffect(() => {
    StorageService.setRatingSettings(ratingSettings);
  }, [ratingSettings]);

  // Save grid columns to storage
  useEffect(() => {
    StorageService.setGridColumns(gridColumns);
  }, [gridColumns]);

  // Update active channel ID when channels change
  useEffect(() => {
    if (channels.length > 0 && !channels.find(c => c.id === activeChannelId)) {
      setActiveChannelId(channels[0].id);
    } else if (channels.length === 0 && activeChannelId !== '') {
      setActiveChannelId('');
    }
  }, [channels, activeChannelId]);

  // Handle category changes
  useEffect(() => {
    if (viewMode === 'home') return;

    const playlists = currentChannelPlaylists;
    if (playlists && playlists.length > 0) {
      if (!activeCategory || !playlists.find(p => p.id === activeCategory.id)) {
        setActiveCategory(playlists[0]);
        setSortOption('rating');
        setIsFetchAllMode(false);
      }
    } else {
      setActiveCategory(null);
    }
  }, [activeChannelId, currentChannelPlaylists, viewMode, activeCategory]);

  // Handle search and category changes
  useEffect(() => {
    setSearchQuery('');
    if (!activeCategory) return;
    setIsFetchAllMode(false);
  }, [activeCategory]);

  // Handle channel data loading
  useEffect(() => {
    const loadChannelData = async () => {
      if (viewMode === 'home') return;

      const channel = channels.find(c => c.id === activeChannelId);
      if (!channel) return;

      setIsChannelLoading(true);

      try {
        const [info, fetchedPlaylists] = await Promise.all([
          fetchChannelInfo(channel.rutubeId),
          fetchChannelPlaylists(channel.rutubeId),
        ]);

        setChannelInfo(
          info || {
            title: channel.label,
            subscribers: '0',
            avatarUrl: '',
            bannerUrl: '',
          }
        );

        setChannelAvailablePlaylists(fetchedPlaylists);

        setVideoCache(prev => {
          const currentList = prev[activeChannelId] || [];
          const listToUpdate =
            currentList.length > 0 ? currentList : videoCache[channel.rutubeId] || [];

          const updatedList = listToUpdate.map(cat => {
            if (cat.isSystem && cat.type === 'channel' && info?.videoCount) {
              return { ...cat, itemCount: info.videoCount };
            }
            if (cat.type === 'playlist') {
              const found = fetchedPlaylists.find(fp => fp.rutubeId === cat.rutubeId);
              if (found && found.itemCount !== undefined) {
                return { ...cat, itemCount: found.itemCount };
              }
            }
            return cat;
          });

          return {
            ...prev,
            [activeChannelId]: updatedList,
          };
        });
      } catch (e) {
        console.error('Failed to fetch channel data', e);
        setChannelInfo({
          title: channel.label,
          subscribers: '0',
          avatarUrl: '',
          bannerUrl: '',
        });
      } finally {
        setIsChannelLoading(false);
      }
    };

    loadChannelData();
  }, [activeChannelId, viewMode, channels]);

  // Handle video loading
  useEffect(() => {
    const loadVideos = async () => {
      if (viewMode === 'home') {
        // Load home feed
        setVideos([]);
        setIsVideoLoading(true);
        setNextPageUrl(null);

        try {
          const promises = channels.map(channel => {
            const tempCategory: CategoryDef = {
              id: `home-temp-${channel.rutubeId}`,
              label: 'All',
              rutubeId: channel.rutubeId,
              type: 'channel',
            };
            return fetchVideos(tempCategory, ratingSettings, null, false);
          });

          const results = await Promise.allSettled(promises);

          let initialVideos: RutubeVideo[] = [];
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
        } catch (e) {
          console.error('Home feed error', e);
        } finally {
          setIsVideoLoading(false);
        }
      } else {
        // Load channel videos
        if (isChannelLoading) {
          return;
        }

        if (!activeCategory) {
          setVideos([]);
          setNextPageUrl(null);
          setIsVideoLoading(false);
          return;
        }

        if (videoCache[activeCategory.id]) {
          const cached = videoCache[activeCategory.id];
          // For CategoryDef[] type, we don't have cached data, so we need to fetch
          // This is a placeholder - the actual caching logic needs to be implemented
          // For now, we'll just fetch fresh data
        }

        setIsVideoLoading(true);

        try {
          if (!activeCategory.rutubeId) throw new Error('Invalid category ID');

          const shouldFetchAll = isFetchAllMode || activeCategory.type === 'playlist';

          const { videos: newVideos, nextUrl } = await fetchVideos(
            activeCategory,
            ratingSettings,
            null,
            shouldFetchAll
          );

          setVideos(newVideos || []);
          setNextPageUrl(nextUrl);
          // For CategoryDef[] type, we don't cache video data, only playlist metadata
          // The video data is fetched fresh each time
        } catch (err) {
          console.error('Fetch videos failed:', err);
          setVideos([]);
          setNextPageUrl(null);
        } finally {
          setIsVideoLoading(false);
        }
      }
    };

    loadVideos();
  }, [
    activeCategory,
    refreshKey,
    isChannelLoading,
    viewMode,
    channels,
    ratingSettings,
    videoCache,
    isFetchAllMode,
  ]);

  // Handle search input focus
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle clicks outside menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (sortMenuRef.current && !sortMenuRef.current.contains(target)) {
        setIsSortMenuOpen(false);
      }
      if (gridMenuRef.current && !gridMenuRef.current.contains(target)) {
        setIsGridMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
      if (channelMenuRef.current && !channelMenuRef.current.contains(target)) {
        closeChannelMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', closeChannelMenu, { capture: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', closeChannelMenu, { capture: true });
    };
  }, []);

  // ===== HANDLERS =====

  // Channel Management
  const handleChannelSelect = (channelId: string) => {
    setActiveChannelId(channelId);
    setViewMode('channel');
  };

  const handleGoHome = () => {
    setViewMode('home');
    setActiveChannelId('');
  };

  const handleAddChannel = (name: string, rutubeId: string) => {
    const newChannelId = `channel-${rutubeId}-${Date.now()}`;
    const newChannel: ChannelDef = {
      id: newChannelId,
      label: name,
      rutubeId,
      isSystem: false,
    };

    const initialPlaylists: CategoryDef[] = [
      {
        id: `all-${newChannelId}`,
        label: 'Все видео',
        rutubeId: rutubeId,
        type: 'channel',
        isSystem: true,
      },
    ];

    setChannels(prev => [...prev, newChannel]);
    setVideoCache(prev => ({
      ...prev,
      [newChannelId]: initialPlaylists,
    }));
    handleChannelSelect(newChannelId);
  };

  const handleAddChannelFromNavigation = () => {
    setIsAddChannelModalOpen(true);
  };

  const handleRenameChannel = (channelId: string, newName: string) => {
    setChannels(prev => prev.map(c => (c.id === channelId ? { ...c, label: newName } : c)));
  };

  const handleRemoveChannel = (channelId: string) => {
    const newChannels = channels.filter(c => c.id !== channelId);
    setChannels(newChannels);

    setVideoCache(prev => {
      const next = { ...prev };
      delete next[channelId];
      return next;
    });

    if (activeChannelId === channelId) {
      setViewMode('home');
      setActiveChannelId('');
    }
  };

  // Video Management
  const handleVideoClick = (video: RutubeVideo) => {
    setSelectedVideo(video);
    updateWatchedStatus(video.id, 'watched');
    addToHistory(video);
  };

  const toggleVideoWatchedStatus = (videoId: string) => {
    setVideoWatchedStatuses(prev => {
      const current = prev[videoId];
      let next: 'watched' | 'watch_later' | undefined;

      if (!current) {
        next = 'watched';
      } else if (current === 'watched') {
        next = 'watch_later';
      } else {
        next = undefined;
      }

      if (next === undefined) {
        const { [videoId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [videoId]: next };
    });
  };

  const toggleVideoLikedStatus = (videoId: string) => {
    setVideoLikedStatuses(prev => {
      const current = prev[videoId];
      let next: 'liked' | 'disliked' | undefined;

      if (!current) {
        next = 'liked';
      } else if (current === 'liked') {
        next = 'disliked';
      } else {
        next = undefined;
      }

      if (next === undefined) {
        const { [videoId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [videoId]: next };
    });
  };

  const updateWatchedStatus = (videoId: string, status: 'watched' | 'watch_later' | undefined) => {
    if (status === undefined) {
      setVideoWatchedStatuses(prev => {
        const { [videoId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setVideoWatchedStatuses(prev => ({ ...prev, [videoId]: status }));
    }
  };

  const updateLikedStatus = (videoId: string, status: 'liked' | 'disliked' | undefined) => {
    if (status === undefined) {
      setVideoLikedStatuses(prev => {
        const { [videoId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setVideoLikedStatuses(prev => ({ ...prev, [videoId]: status }));
    }
  };

  // History Management
  const addToHistory = (video: RutubeVideo) => {
    setWatchHistory(prev => {
      const filtered = prev.filter(v => v.id !== video.id);
      const newHistory = [video, ...filtered];
      return newHistory.slice(0, 100); // Keep only last 100 items
    });
  };

  const removeFromHistory = (videoId: string) => {
    setWatchHistory(prev => prev.filter(v => v.id !== videoId));
  };

  const clearHistory = () => {
    setWatchHistory([]);
  };

  // Metadata Management
  const handleAnalyzeVideo = async (title: string): Promise<void> => {
    // Check if already loading
    if (loadingMetadataFor.has(title)) {
      return;
    }

    // Check if already has valid data with rating
    const existing = metadataCache[title];
    if (existing && (existing.imdbRating > 0 || existing.kpRating > 0)) {
      return;
    }

    // First attempt: check local database
    if (!existing) {
      const localMatch = findBestMovieMatch(title);
      if (localMatch) {
        const metadata: MovieRatingData = {
          title: title,
          originalTitle: localMatch.title,
          year: localMatch.title.match(/\((\d{4})\)/)?.[1] || '',
          kpRating: 0,
          kpVotes: '',
          imdbRating: localMatch.currentRating || 0,
          imdbUrl: localMatch.imdbUrl,
          description: '',
          awards: localMatch.awards?.map(a => `${a.type} ${a.status || ''}`).filter(Boolean),
          dataSource: 'local',
          aiAttempts: 0,
        };
        handleSaveMetadata([metadata], title);
        return;
      }

      const noLocalData: MovieRatingData = {
        title: title,
        originalTitle: '',
        year: '',
        kpRating: 0,
        kpVotes: '',
        imdbRating: 0,
        description: '',
        dataSource: undefined,
        aiAttempts: 0,
      };
      handleSaveMetadata([noLocalData], title);
      return;
    }

    // Subsequent attempts: use AI search
    if (existing && existing.imdbRating === 0 && existing.kpRating === 0) {
      setLoadingMetadataFor(prev => new Set(prev).add(title));

      try {
        const { searchMovieRatings } = await import('./services/llmService');
        const result = await searchMovieRatings(title);

        if (result && (result.imdbRating > 0 || result.kpRating > 0)) {
          result.dataSource = 'ai';
          result.aiAttempts = (existing.aiAttempts || 0) + 1;
          handleSaveMetadata([result], title);
        } else {
          const updatedMetadata = {
            ...existing,
            aiAttempts: (existing.aiAttempts || 0) + 1,
          };
          handleSaveMetadata([updatedMetadata], title);
        }
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
        const updatedMetadata = {
          ...existing,
          aiAttempts: (existing.aiAttempts || 0) + 1,
        };
        handleSaveMetadata([updatedMetadata], title);
      } finally {
        setLoadingMetadataFor(prev => {
          const next = new Set(prev);
          next.delete(title);
          return next;
        });
      }
    }
  };

  const handleSaveMetadata = (newItems: MovieRatingData[], contextKey?: string) => {
    setMetadataCache(prev => {
      const next = { ...prev };

      if (contextKey && newItems.length > 0) {
        next[contextKey] = newItems[0];
      }

      newItems.forEach(item => {
        if (item.title) {
          next[item.title] = item;
        }
      });
      return next;
    });
  };

  const handleClearMetadataCache = () => {
    setMetadataCache({});
  };

  // Modal Handlers
  const openKinoRate = (query: string = '') => {
    setKinoRateQuery(query);
    setKinoRateContext(query);
    setIsKinoRateOpen(true);
  };

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setIsNotificationModalOpen(true);
  };

  // Search Handlers
  const toggleSearch = () => {
    if (isSearchOpen) {
      setSearchQuery('');
      setIsSearchOpen(false);
    } else {
      setIsSearchOpen(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  // Sorting Handlers
  const handleSortOptionClick = (optionId: SortOption) => {
    if (sortOption === optionId) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortOption(optionId);
      if (optionId === 'alphabetical' || optionId === 'default') {
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    }
  };

  // Channel Menu Handlers
  const handleChannelMenuTrigger = (e: React.MouseEvent, channel: ChannelDef) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    const MENU_WIDTH = 256;
    let left = rect.left + rect.width / 2 - MENU_WIDTH / 2;
    const top = rect.bottom + 8;

    const padding = 16;
    if (left < padding) {
      left = padding;
    } else if (left + MENU_WIDTH > window.innerWidth - padding) {
      left = window.innerWidth - MENU_WIDTH - padding;
    }

    setChannelMenuPosition({ top, left });
    setActiveChannelMenuId(channel.id);
    setChannelEditName(channel.label);
    setIsEditingChannel(false);
  };

  const closeChannelMenu = () => {
    setActiveChannelMenuId(null);
    setChannelMenuPosition(null);
    setIsEditingChannel(false);
  };

  const handleRenameChannelSave = () => {
    if (activeChannelMenuId && channelEditName.trim()) {
      handleRenameChannel(activeChannelMenuId, channelEditName);
      closeChannelMenu();
    }
  };

  // Playlist Management
  const handleRemovePlaylist = (categoryToRemove: CategoryDef) => {
    const currentId = activeChannelId!;
    const currentList = videoCache[currentId] || [];
    const newList = currentList.filter(c => c.id !== categoryToRemove.id);

    setVideoCache(prev => ({
      ...prev,
      [currentId]: newList,
    }));

    removeFromCache(categoryToRemove.id);

    if (activeCategory?.id === categoryToRemove.id) {
      setActiveCategory(newList[0] || null);
    }
  };

  const handleRenamePlaylist = (categoryToRename: CategoryDef, newName: string) => {
    const currentId = activeChannelId!;
    const currentList = videoCache[currentId] || [];
    const newList = currentList.map(c =>
      c.id === categoryToRename.id ? { ...c, label: newName } : c
    );

    setVideoCache(prev => ({
      ...prev,
      [currentId]: newList,
    }));

    if (activeCategory?.id === categoryToRename.id) {
      setActiveCategory(prev => (prev ? { ...prev, label: newName } : null));
    }
  };

  const handleReorderPlaylists = (newOrder: CategoryDef[]) => {
    const currentId = activeChannelId!;
    setVideoCache(prev => ({
      ...prev,
      [currentId]: newOrder,
    }));
  };

  const handleAddPlaylist = (name: string, rutubeId: string, type: 'channel' | 'playlist') => {
    const newPlaylistId = `playlist-${rutubeId}-${Date.now()}`;
    const newPlaylist: CategoryDef = {
      id: newPlaylistId,
      label: name,
      rutubeId,
      type,
      isSystem: false,
    };

    const currentId = activeChannelId!;
    const currentList = videoCache[currentId] || [];
    setVideoCache(prev => ({
      ...prev,
      [currentId]: [...currentList, newPlaylist],
    }));

    setActiveCategory(newPlaylist);
    setIsAddPlaylistModalOpen(false);
  };

  // Cache Management
  const addToCache = (categoryId: string, data: CategoryDef[]) => {
    setVideoCache(prev => ({
      ...prev,
      [categoryId]: data,
    }));
  };

  const removeFromCache = (categoryId: string) => {
    setVideoCache(prev => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  };

  const getFromCache = (categoryId: string) => {
    return videoCache[categoryId];
  };

  // Refresh Handler
  const handleRefresh = (fetchAll: boolean = false) => {
    if (!activeCategory && viewMode !== 'home') return;

    if (viewMode === 'home') {
      setRefreshKey(prev => prev + 1);
      return;
    }

    setIsFetchAllMode(fetchAll);

    setVideoCache(prev => {
      const next = { ...prev };
      if (activeCategory) delete next[activeCategory.id];
      return next;
    });
    setRefreshKey(prev => prev + 1);
  };

  // ===== RENDER =====

  const activeMenuChannel = activeChannelMenuId
    ? channels.find(c => c.id === activeChannelMenuId)
    : undefined;

  return (
    <div className="min-h-screen bg-[#000917] text-white">
      <Navigation
        channels={channels}
        viewMode={viewMode}
        activeChannelId={activeChannelId}
        handleChannelSelect={handleChannelSelect}
        handleChannelMenuTrigger={handleChannelMenuTrigger}
        activeChannelMenuId={activeChannelMenuId}
        setIsAddChannelModalOpen={setIsAddChannelModalOpen}
        channelMenuRef={channelMenuRef}
        handleAddChannel={handleAddChannelFromNavigation}
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        toggleSearch={toggleSearch}
        searchInputRef={searchInputRef}
        isLoggedIn={isLoggedIn}
        setIsUserMenuOpen={setIsUserMenuOpen}
        isUserMenuOpen={isUserMenuOpen}
        setIsHistoryModalOpen={setIsHistoryModalOpen}
        openKinoRate={openKinoRate}
        setIsFormulaModalOpen={setIsFormulaModalOpen}
        handleClearMetadataCache={handleClearMetadataCache}
        setIsLoggedIn={setIsLoggedIn}
        sortOptionsList={sortOptionsList}
        sortOption={sortOption}
        handleSortOptionClick={handleSortOptionClick}
        sortDirection={sortDirection}
        isSortMenuOpen={isSortMenuOpen}
        setIsSortMenuOpen={setIsSortMenuOpen}
        sortMenuRef={sortMenuRef}
        gridOptionsList={gridOptionsList}
        gridColumns={gridColumns}
        setGridColumns={setGridColumns}
        setIsGridMenuOpen={setIsGridMenuOpen}
        isGridMenuOpen={isGridMenuOpen}
        gridMenuRef={gridMenuRef}
        userMenuRef={userMenuRef}
        handleGoHome={handleGoHome}
      />

      <MainContent
        channels={channels}
        viewMode={viewMode}
        activeChannelId={activeChannelId}
        handleAddChannel={handleAddChannel}
        setIsAddChannelModalOpen={setIsAddChannelModalOpen}
        activeChannel={activeChannel}
        handleGoHome={handleGoHome}
        channelInfo={channelInfo}
        isChannelLoading={isChannelLoading}
        currentChannelPlaylists={currentChannelPlaylists}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        videos={videos}
        handleRemovePlaylist={handleRemovePlaylist}
        handleRenamePlaylist={handleRenamePlaylist}
        handleRefresh={handleRefresh}
        handleReorderPlaylists={handleReorderPlaylists}
        setIsAddPlaylistModalOpen={setIsAddPlaylistModalOpen}
        channelToImport={channelToImport}
        setChannelToImport={setChannelToImport}
        displayedVideos={displayedVideos}
        handleVideoClick={handleVideoClick}
        videoWatchedStatuses={videoWatchedStatuses}
        videoLikedStatuses={videoLikedStatuses}
        toggleVideoWatchedStatus={toggleVideoWatchedStatus}
        toggleVideoLikedStatus={toggleVideoLikedStatus}
        ratingSettings={ratingSettings}
        handleAnalyzeVideo={handleAnalyzeVideo}
        loadingMetadataFor={loadingMetadataFor}
        metadataCache={metadataCache}
        getGridClass={() => {
          switch (gridColumns) {
            case 2:
              return 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8';
            case 3:
              return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8';
            case 4:
            default:
              return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8';
          }
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={() => {}}
        isVideoLoading={isVideoLoading}
        isLoadingMore={isLoadingMore}
        nextPageUrl={nextPageUrl}
        isFetchAllMode={isFetchAllMode}
        handleLoadMore={() => {}}
        sortOptionsList={sortOptionsList}
        sortOption={sortOption}
        handleSortOptionClick={handleSortOptionClick}
        sortDirection={sortDirection}
        isSortMenuOpen={isSortMenuOpen}
        setIsSortMenuOpen={setIsSortMenuOpen}
        sortMenuRef={sortMenuRef}
        gridOptionsList={gridOptionsList}
        gridColumns={gridColumns}
        setGridColumns={setGridColumns}
        setIsGridMenuOpen={setIsGridMenuOpen}
        isGridMenuOpen={isGridMenuOpen}
        gridMenuRef={gridMenuRef}
        selectedVideo={selectedVideo}
        setSelectedVideo={setSelectedVideo}
        isAddPlaylistModalOpen={isAddPlaylistModalOpen}
        setIsAddPlaylistModalOpenForMain={setIsAddPlaylistModalOpen}
        handleAddPlaylist={handleAddPlaylist}
        isAddChannelModalOpen={isAddChannelModalOpen}
        setIsAddChannelModalOpenForMain={setIsAddChannelModalOpen}
        isFormulaModalOpen={isFormulaModalOpen}
        setIsFormulaModalOpen={setIsFormulaModalOpen}
        isHistoryModalOpen={isHistoryModalOpen}
        setIsHistoryModalOpen={setIsHistoryModalOpen}
        isKinoRateOpen={isKinoRateOpen}
        setIsKinoRateOpen={setIsKinoRateOpen}
        kinoRateQuery={kinoRateQuery}
        setKinoRateQuery={setKinoRateQuery}
        kinoRateContext={kinoRateContext}
        setKinoRateContext={setKinoRateContext}
        isConfirmModalOpen={isConfirmModalOpen}
        setIsConfirmModalOpen={setIsConfirmModalOpen}
        confirmMessage={confirmMessage}
        setConfirmMessage={setConfirmMessage}
        confirmCallback={confirmCallback}
        setConfirmCallback={setConfirmCallback}
        isNotificationModalOpen={isNotificationModalOpen}
        setIsNotificationModalOpen={setIsNotificationModalOpen}
        notificationMessage={notificationMessage}
        setNotificationMessage={setNotificationMessage}
        notificationType={notificationType}
        setNotificationType={setNotificationType}
        ratingSettingsForModal={ratingSettings}
        handleSettingsSave={setRatingSettings}
        allPlaylists={videoCache}
        channelAvailablePlaylists={channelAvailablePlaylists}
        handleImportPlaylists={newPlaylists => {
          const currentId = activeChannelId!;
          const currentList = videoCache[currentId] || [];
          setVideoCache(prev => ({
            ...prev,
            [currentId]: [...currentList, ...newPlaylists],
          }));
        }}
        channelToImportForModal={channelToImport}
        watchHistory={watchHistory}
        handleClearHistory={clearHistory}
        handleVideoClickForHistory={handleVideoClick}
        handleSaveMetadata={handleSaveMetadata}
        openKinoRate={openKinoRate}
        handleClearMetadataCache={handleClearMetadataCache}
        showNotification={showNotification}
        setChannelToImportForModal={setChannelToImport}
        setIsAddChannelModalOpenForModal={setIsAddChannelModalOpen}
        setIsAddPlaylistModalOpenForModal={setIsAddPlaylistModalOpen}
        activeChannelMenuId={activeChannelMenuId}
        activeMenuChannel={activeMenuChannel}
        channelMenuPosition={channelMenuPosition}
        isEditingChannel={isEditingChannel}
        setIsEditingChannel={setIsEditingChannel}
        closeChannelMenu={closeChannelMenu}
        handleRemoveChannel={handleRemoveChannel}
        channelEditName={channelEditName}
        setChannelEditName={setChannelEditName}
        channelInputRef={channelInputRef}
        handleRenameChannelSave={handleRenameChannelSave}
        channelMenuRef={channelMenuRef}
      />

      {/* Modals */}
      {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}

      {isAddPlaylistModalOpen && (
        <AddCategoryModal
          onClose={() => setIsAddPlaylistModalOpen(false)}
          onAdd={handleAddPlaylist}
        />
      )}

      {isAddChannelModalOpen && (
        <AddChannelModal onClose={() => setIsAddChannelModalOpen(false)} onAdd={handleAddChannel} />
      )}

      {isFormulaModalOpen && (
        <FormulaSettingsModal
          settings={ratingSettings}
          videos={videos}
          onClose={() => setIsFormulaModalOpen(false)}
          onSave={setRatingSettings}
        />
      )}

      {channelToImport && (
        <ImportPlaylistsModal
          channelId={channelToImport.rutubeId}
          existingPlaylists={videoCache[channelToImport.id] || []}
          preloadedPlaylists={
            channelToImport.id === activeChannelId ? channelAvailablePlaylists : undefined
          }
          onClose={() => setChannelToImport(null)}
          onImport={newPlaylists => {
            const currentId = activeChannelId!;
            const currentList = videoCache[currentId] || [];
            setVideoCache(prev => ({
              ...prev,
              [currentId]: [...currentList, ...newPlaylists],
            }));
            setChannelToImport(null);
          }}
          onManualAdd={() => {
            setChannelToImport(null);
            setIsAddPlaylistModalOpen(true);
          }}
        />
      )}

      {isHistoryModalOpen && (
        <HistoryModal
          history={watchHistory}
          onClose={() => setIsHistoryModalOpen(false)}
          onClear={clearHistory}
          onVideoClick={handleVideoClick}
        />
      )}

      {isKinoRateOpen && (
        <KinoRateModal
          initialQuery={kinoRateQuery}
          contextKey={kinoRateContext}
          onClose={() => setIsKinoRateOpen(false)}
          onSaveMetadata={handleSaveMetadata}
        />
      )}

      {isConfirmModalOpen && (
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          message={confirmMessage}
          onConfirm={() => {
            confirmCallback();
            setIsConfirmModalOpen(false);
          }}
          onCancel={() => setIsConfirmModalOpen(false)}
        />
      )}

      {isNotificationModalOpen && (
        <NotificationModal
          isOpen={isNotificationModalOpen}
          message={notificationMessage}
          type={notificationType}
          onClose={() => setIsNotificationModalOpen(false)}
        />
      )}

      {/* Channel Menu Portal */}
      {activeChannelMenuId &&
        activeMenuChannel &&
        channelMenuPosition &&
        createPortal(
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div
              ref={channelMenuRef}
              className="absolute bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150 w-64 origin-top"
              style={{ top: channelMenuPosition.top, left: channelMenuPosition.left }}
            >
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  {isEditingChannel && (
                    <button
                      onClick={() => setIsEditingChannel(false)}
                      className="mr-1 text-zinc-400 hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <h2 className="text-white font-medium truncate text-xs uppercase tracking-wider text-zinc-500">
                    {isEditingChannel ? 'Переименовать канал' : 'Действия с каналом'}
                  </h2>
                </div>
              </div>
              <ChannelMenuContent
                activeMenuChannel={activeMenuChannel}
                isEditingChannel={isEditingChannel}
                setIsEditingChannel={setIsEditingChannel}
                isChannelLoading={isChannelLoading}
                channelAvailablePlaylists={channelAvailablePlaylists}
                setChannelToImport={setChannelToImport}
                closeChannelMenu={closeChannelMenu}
                handleRemoveChannel={handleRemoveChannel}
                channelEditName={channelEditName}
                setChannelEditName={setChannelEditName}
                channelInputRef={channelInputRef}
                handleRenameChannelSave={handleRenameChannelSave}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default App;
