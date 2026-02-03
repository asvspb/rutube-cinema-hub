
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Tv, PlayCircle, Info, Loader2, PlusCircle, ArrowUpDown, ArrowUp, ArrowDown, Check, ChevronDown, User, Settings, LogOut, Heart, History as HistoryIcon, Search, X, Plus, Calculator, LayoutGrid, MoreVertical, Pencil, Trash2, Save, ChevronLeft, ListPlus, GripVertical, ChevronRight, LogIn, Sparkles } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { DEFAULT_CHANNELS, DEFAULT_PLAYLISTS_BY_CHANNEL, fetchVideos, sortVideos, DEFAULT_RATING_SETTINGS, calculateRating, calculateGravity, fetchChannelInfo, fetchChannelPlaylists } from './services/rutubeService';
import { CategoryDef, RutubeVideo, ChannelDef, SortOption, RatingSettings, ChannelInfo, MovieRatingData } from './types';
import { VideoCard } from './components/VideoCard';
import { VideoModal } from './components/VideoModal';
import { CategoryFilter } from './components/CategoryFilter';
import { AddCategoryModal } from './components/AddCategoryModal';
import { AddChannelModal } from './components/AddChannelModal';
import { FormulaSettingsModal } from './components/FormulaSettingsModal';
import { ImportPlaylistsModal } from './components/ImportPlaylistsModal';
import { ChannelHeader } from './components/ChannelHeader';
import { HistoryModal } from './components/HistoryModal';
import { KinoRateModal } from './components/KinoRate/KinoRateModal';
import { findMovieInTop250, TOP_250_MOVIES } from './services/top250Data';

const RECOMMENDED_CHANNELS = [
  { id: '32869212', label: 'Смотри кино', color: 'bg-gradient-to-br from-orange-500 to-red-600' },
  { id: '32181632', label: 'Фильмач', color: 'bg-gradient-to-br from-purple-600 to-indigo-900' },
  { id: '36921062', label: 'Синемач', color: 'bg-gradient-to-br from-pink-500 to-rose-600' }
];

const ITEMS_PER_PAGE = 50;

const getStorageKeys = (isLoggedIn: boolean) => ({
  history: isLoggedIn ? 'rutube_cinema_v2_history_user' : 'rutube_cinema_v2_history_guest',
  statuses: isLoggedIn ? 'rutube_cinema_v2_statuses_user' : 'rutube_cinema_v2_statuses_guest',
  metadata: 'rutube_cinema_v2_metadata_cache' 
});

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}> = ({ currentPage, totalPages, onPageChange, className }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex justify-center items-center gap-2 pb-4 ${className || 'mt-8'}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, idx) => (
          <React.Fragment key={idx}>
            {page === '...' ? (
              <span className="px-2 text-zinc-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(Number(page))}
                className={`
                  min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors
                  ${currentPage === page 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }
                `}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

const RecommendedChannelCard: React.FC<{
  id: string;
  label: string;
  color: string;
  onClick: () => void;
}> = ({ id, label, color, onClick }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAvatar = async () => {
      try {
        const info = await fetchChannelInfo(id);
        if (isMounted && info && info.avatarUrl) {
          setAvatarUrl(info.avatarUrl);
        }
      } catch (e) { }
    };
    loadAvatar();
    return () => { isMounted = false; };
  }, [id]);

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-3 transition-transform duration-300 hover:scale-105 active:scale-95"
    >
      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-xl flex items-center justify-center ${!avatarUrl ? color : 'bg-zinc-800'} relative overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500/50 transition-all`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <>
             <Plus className="w-8 h-8 text-white drop-shadow-md" />
             <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
          </>
        )}
      </div>
      <span className="text-zinc-300 font-medium text-sm sm:text-base group-hover:text-white transition-colors">
        {label}
      </span>
    </button>
  );
};

interface CachedPlaylistData {
  data: RutubeVideo[];
  nextUrl: string | null;
}

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'home' | 'channel'>('home');

  const [channels, setChannels] = useState<ChannelDef[]>(() => {
    try {
      const saved = localStorage.getItem('rutube_cinema_v2_channels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(c => c && c.id && c.label)) {
          // Filter out removed system channels from saved state
          const filteredSaved = parsed.filter(savedChannel => 
            !savedChannel.isSystem || DEFAULT_CHANNELS.some(def => def.rutubeId === savedChannel.rutubeId)
          );
          
          const missingDefaults = DEFAULT_CHANNELS.filter(def => 
            !filteredSaved.some(savedChannel => savedChannel.rutubeId === def.rutubeId)
          );
          
          if (missingDefaults.length > 0 || filteredSaved.length !== parsed.length) {
             const result = [...filteredSaved, ...missingDefaults];
             // Update localStorage immediately to prevent re-loading on next refresh
             localStorage.setItem('rutube_cinema_v2_channels', JSON.stringify(result));
             return result;
          }
          return filteredSaved;
        }
      }
    } catch (e) { console.error('Failed to load channels', e); }
    return DEFAULT_CHANNELS;
  });

  const [activeChannelId, setActiveChannelId] = useState<string>(() => {
     try {
       const saved = localStorage.getItem('rutube_cinema_v2_active_channel');
       if (saved) return saved;
     } catch(e) {}
     
     const firstId = channels[0]?.id || ''; 
     return firstId;
  });

  useEffect(() => {
     if (channels.length > 0 && !channels.find(c => c.id === activeChannelId)) {
         setActiveChannelId(channels[0].id);
     } else if (channels.length === 0 && activeChannelId !== '') {
         setActiveChannelId('');
     }
  }, [channels, activeChannelId]);

  useEffect(() => {
     if (activeChannelId) {
       localStorage.setItem('rutube_cinema_v2_active_channel', activeChannelId);
     }
  }, [activeChannelId]);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rutube_cinema_v2_is_logged_in') === 'true';
    } catch { return false; }
  });

  const [watchHistory, setWatchHistory] = useState<RutubeVideo[]>(() => {
    try {
      const keys = getStorageKeys(isLoggedIn); 
      const saved = localStorage.getItem(keys.history);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [videoStatuses, setVideoStatuses] = useState<Record<string, 'watched' | 'liked' | 'watch_later'>>(() => {
    try {
      const keys = getStorageKeys(isLoggedIn); 
      const saved = localStorage.getItem(keys.statuses);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // --- STATE: Metadata Cache (Ratings, Oscars) ---
  const [metadataCache, setMetadataCache] = useState<Record<string, MovieRatingData>>(() => {
    try {
      const saved = localStorage.getItem('rutube_cinema_v2_metadata_cache');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem('rutube_cinema_v2_metadata_cache', JSON.stringify(metadataCache));
  }, [metadataCache]);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [isChannelLoading, setIsChannelLoading] = useState(false);

  const [activeChannelMenuId, setActiveChannelMenuId] = useState<string | null>(null);
  const [channelMenuPosition, setChannelMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [channelEditName, setChannelEditName] = useState('');
  
  const [channelToImport, setChannelToImport] = useState<ChannelDef | null>(null);
  const [channelAvailablePlaylists, setChannelAvailablePlaylists] = useState<CategoryDef[]>([]);

  const channelMenuRef = useRef<HTMLDivElement>(null);
  const channelInputRef = useRef<HTMLInputElement>(null);

  const [allPlaylists, setAllPlaylists] = useState<Record<string, CategoryDef[]>>(() => {
    try {
      const saved = localStorage.getItem('rutube_cinema_v2_playlists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
           return { ...DEFAULT_PLAYLISTS_BY_CHANNEL, ...parsed };
        }
      }
    } catch (e) { console.error('Failed to load playlists', e); }
    return DEFAULT_PLAYLISTS_BY_CHANNEL;
  });

  const currentChannelPlaylists = useMemo(() => {
      const list = allPlaylists[activeChannelId] || [];
      if (list.length === 0) {
         const channel = channels.find(c => c.id === activeChannelId);
         if (channel && DEFAULT_PLAYLISTS_BY_CHANNEL[channel.rutubeId]) {
            return DEFAULT_PLAYLISTS_BY_CHANNEL[channel.rutubeId];
         }
      }
      return list;
  }, [allPlaylists, activeChannelId, channels]);

  const [activeCategory, setActiveCategory] = useState<CategoryDef | null>(null);
  const [videos, setVideos] = useState<RutubeVideo[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  
  const [videoCache, setVideoCache] = useState<Record<string, CachedPlaylistData>>({});
  
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetchAllMode, setIsFetchAllMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedVideo, setSelectedVideo] = useState<RutubeVideo | null>(null);
  const [isAddPlaylistModalOpen, setIsAddPlaylistModalOpen] = useState(false);
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  
  const [isKinoRateOpen, setIsKinoRateOpen] = useState(false);
  const [kinoRateQuery, setKinoRateQuery] = useState('');
  const [kinoRateContext, setKinoRateContext] = useState<string | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [sortOption, setSortOption] = useState<SortOption>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(() => {
    try {
      const saved = localStorage.getItem('rutube_cinema_v2_grid_columns');
      return saved ? JSON.parse(saved) : 3;
    } catch(e) { return 3; }
  });
  
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const gridMenuRef = useRef<HTMLDivElement>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [ratingSettings, setRatingSettings] = useState<RatingSettings>(() => {
    try {
      const saved = localStorage.getItem('rutube_cinema_v2_rating_settings');
      return saved ? JSON.parse(saved) : DEFAULT_RATING_SETTINGS;
    } catch(e) { return DEFAULT_RATING_SETTINGS; }
  });
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('rutube_cinema_v2_is_logged_in', String(isLoggedIn));
    
    const keys = getStorageKeys(isLoggedIn);
    
    try {
      const savedHist = localStorage.getItem(keys.history);
      setWatchHistory(savedHist ? JSON.parse(savedHist) : []);
    } catch { setWatchHistory([]); }

    try {
      const savedStatus = localStorage.getItem(keys.statuses);
      setVideoStatuses(savedStatus ? JSON.parse(savedStatus) : {});
    } catch { setVideoStatuses({}); }
    
  }, [isLoggedIn]);

  useEffect(() => {
    const keys = getStorageKeys(isLoggedIn);
    localStorage.setItem(keys.history, JSON.stringify(watchHistory));
  }, [watchHistory, isLoggedIn]);

  useEffect(() => {
    const keys = getStorageKeys(isLoggedIn);
    localStorage.setItem(keys.statuses, JSON.stringify(videoStatuses));
  }, [videoStatuses, isLoggedIn]);


  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (isEditingChannel && channelInputRef.current) {
        channelInputRef.current.focus();
    }
  }, [isEditingChannel]);

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
  }, [activeChannelMenuId]);

  useEffect(() => {
    if (viewMode === 'home') return;

    const playlists = currentChannelPlaylists;
    if (playlists && playlists.length > 0) {
      if (!activeCategory || !playlists.find(p => p.id === activeCategory.id)) {
        setActiveCategory(playlists[0]);
        setSortOption('rating');
        setIsFetchAllMode(false);
        setCurrentPage(1); 
      }
    } else {
      setActiveCategory(null);
    }
  }, [activeChannelId, currentChannelPlaylists, viewMode]);

  useEffect(() => {
    if (viewMode === 'home') return;

    let isMounted = true;
    
    const fetchChannelData = async () => {
      const channel = channels.find(c => c.id === activeChannelId);
      if (!channel) return;

      if(isMounted) {
        setIsChannelLoading(true);
        setVideos([]);
        setIsVideoLoading(false);
        setCurrentPage(1);
        setChannelAvailablePlaylists([]); 
      }
      
      try {
        const [info, fetchedPlaylists] = await Promise.all([
            fetchChannelInfo(channel.rutubeId),
            fetchChannelPlaylists(channel.rutubeId)
        ]);

        if (isMounted) {
            if (info) {
              setChannelInfo(info);
            } else {
              setChannelInfo({
                  title: channel.label,
                  subscribers: '0',
                  avatarUrl: '',
                  bannerUrl: ''
              });
            }

            setChannelAvailablePlaylists(fetchedPlaylists);

            setAllPlaylists(prev => {
                const currentList = prev[activeChannelId] || [];
                const listToUpdate = currentList.length > 0 ? currentList : (DEFAULT_PLAYLISTS_BY_CHANNEL[channel.rutubeId] || []);
                
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
                    [activeChannelId]: updatedList
                };
            });
        }
      } catch (e) {
        console.error("Failed to fetch channel data", e);
        if (isMounted) {
           setChannelInfo({
              title: channel.label,
              subscribers: '0',
              avatarUrl: '',
              bannerUrl: ''
           });
        }
      } finally {
        if(isMounted) setIsChannelLoading(false);
      }
    };

    fetchChannelData();
    return () => { isMounted = false; };
  }, [activeChannelId, channels, viewMode]);


  useEffect(() => {
    setSearchQuery('');
    setCurrentPage(1); 
    if (!activeCategory) return;
    setIsFetchAllMode(false);
  }, [activeCategory, activeChannelId]);

  useEffect(() => {
    localStorage.setItem('rutube_cinema_v2_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('rutube_cinema_v2_playlists', JSON.stringify(allPlaylists));
  }, [allPlaylists]);

  useEffect(() => {
    localStorage.setItem('rutube_cinema_v2_rating_settings', JSON.stringify(ratingSettings));
  }, [ratingSettings]);

  useEffect(() => {
    localStorage.setItem('rutube_cinema_v2_grid_columns', JSON.stringify(gridColumns));
  }, [gridColumns]);

  useEffect(() => {
    if (activeCategory && videos.length > (activeCategory.itemCount || 0) && viewMode === 'channel') {
       if (activeCategory.itemCount !== videos.length) {
            setAllPlaylists(prev => {
                const channelLists = prev[activeChannelId] || [];
                const updatedLists = channelLists.map(cat => 
                cat.id === activeCategory.id ? { ...cat, itemCount: videos.length } : cat
                );
                return { ...prev, [activeChannelId]: updatedLists };
            });
            setActiveCategory(prev => prev ? { ...prev, itemCount: videos.length } : null);
       }
    }
  }, [videos.length, activeChannelId, viewMode]);


  useEffect(() => {
    let isMounted = true;

    if (viewMode === 'home') {
        const loadHomeFeed = async () => {
            if (isMounted) {
                setVideos([]);
                setIsVideoLoading(true);
                setNextPageUrl(null);
                setChannelInfo(null); 
            }

            try {
                const promises = channels.map(channel => {
                    const tempCategory: CategoryDef = {
                        id: `home-temp-${channel.rutubeId}`,
                        label: 'All',
                        rutubeId: channel.rutubeId,
                        type: 'channel'
                    };
                    // Fetch more videos for home feed to ensure we have enough content
                    return fetchVideos(tempCategory, ratingSettings, null, false);
                });

                const results = await Promise.all(promises);
                
                let initialVideos: RutubeVideo[] = [];
                if (isMounted) {
                    const byId = new Map<string, RutubeVideo>();
                    results.forEach(res => {
                        if (res.videos && res.videos.length > 0) {
                            res.videos.forEach(v => {
                                if (!byId.has(v.id)) {
                                    byId.set(v.id, v);
                                }
                            });
                        }
                    });

                    initialVideos = Array.from(byId.values());
                    initialVideos.sort((a, b) => new Date(b.created_ts).getTime() - new Date(a.created_ts).getTime());
                    setVideos(initialVideos);
                    setIsVideoLoading(false);
                }

                // Background: fetch full lists and merge
                const fullPromises = channels.map(channel => {
                    const tempCategory: CategoryDef = {
                        id: `home-temp-full-${channel.rutubeId}`,
                        label: 'All',
                        rutubeId: channel.rutubeId,
                        type: 'channel'
                    };
                    return fetchVideos(tempCategory, ratingSettings, null, true);
                });

                const fullResults = await Promise.all(fullPromises);
                if (isMounted) {
                    const mergedById = new Map<string, RutubeVideo>();
                    initialVideos.forEach(v => mergedById.set(v.id, v));
                    fullResults.forEach(res => {
                        if (res.videos && res.videos.length > 0) {
                            res.videos.forEach(v => {
                                if (!mergedById.has(v.id)) {
                                    mergedById.set(v.id, v);
                                }
                            });
                        }
                    });
                    const merged = Array.from(mergedById.values());
                    merged.sort((a, b) => new Date(b.created_ts).getTime() - new Date(a.created_ts).getTime());
                    setVideos(merged);
                }
            } catch (e) {
                console.error("Home feed error", e);
            } finally {
                if (isMounted) setIsVideoLoading(false);
            }
        };
        
        loadHomeFeed();
        return () => { isMounted = false; };
    }

    const loadChannelVideos = async () => {
      if (isChannelLoading) {
        return;
      }

      if (!activeCategory) {
        if (isMounted) {
          setVideos([]);
          setNextPageUrl(null);
          setIsVideoLoading(false);
        }
        return;
      }

      if (videoCache[activeCategory.id]) {
        if (isMounted) {
            setVideos(videoCache[activeCategory.id].data);
            setNextPageUrl(videoCache[activeCategory.id].nextUrl);
            setIsVideoLoading(false);
        }
        return;
      }

      if (isMounted) setIsVideoLoading(true);
      
      try {
        if (!activeCategory.rutubeId) throw new Error("Invalid category ID");

        const shouldFetchAll = isFetchAllMode || activeCategory.type === 'playlist';

        if (shouldFetchAll && activeCategory.type === 'channel') {
            const firstPage = await fetchVideos(activeCategory, ratingSettings, null, false);
            if (!isMounted) return;

            setVideos(firstPage.videos || []);
            setNextPageUrl(firstPage.nextUrl);
            setVideoCache(prev => ({
                ...prev,
                [activeCategory.id]: { data: firstPage.videos || [], nextUrl: firstPage.nextUrl }
            }));
            setIsVideoLoading(false);

            if (firstPage.nextUrl) {
                setIsLoadingMore(true);
                let cursor: string | null = firstPage.nextUrl;
                let aggregated: RutubeVideo[] = [...(firstPage.videos || [])];
                let page = 0;
                const MAX_PAGES = 200;
                const seenCursors = new Set<string>();

                try {
                    while (cursor && isMounted && page < MAX_PAGES && !seenCursors.has(cursor)) {
                        seenCursors.add(cursor);
                        const { videos: moreVideos, nextUrl } = await fetchVideos(activeCategory, ratingSettings, cursor);
                        if (!isMounted) return;
                        if (moreVideos && moreVideos.length > 0) {
                            aggregated = [...aggregated, ...moreVideos];
                            setVideos(aggregated);
                            setVideoCache(prev => ({
                                ...prev,
                                [activeCategory.id]: { data: aggregated, nextUrl }
                            }));
                            if (activeCategory.itemCount && aggregated.length >= activeCategory.itemCount) {
                                cursor = null;
                                break;
                            }
                        }
                        cursor = nextUrl;
                        page++;
                    }
                } catch (err) {
                    console.error("Background fetch failed:", err);
                } finally {
                    if (isMounted) {
                        setNextPageUrl(null);
                        setVideoCache(prev => ({
                            ...prev,
                            [activeCategory.id]: { data: aggregated, nextUrl: null }
                        }));
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
          shouldFetchAll
        );
        
        if (isMounted) {
            setVideos(newVideos || []);
            setNextPageUrl(nextUrl);
            
            setVideoCache(prev => ({
                ...prev,
                [activeCategory.id]: { data: newVideos || [], nextUrl: nextUrl }
            }));
        }
      } catch (err) {
        console.error("Fetch videos failed:", err);
        if (isMounted) {
            setVideos([]);
            setNextPageUrl(null);
        }
      } finally {
        if (isMounted) setIsVideoLoading(false);
      }
    };

    loadChannelVideos();
    return () => { isMounted = false; };
  }, [activeCategory, refreshKey, isChannelLoading, viewMode, channels]); 

  const handleLoadMore = async () => {
    if (viewMode === 'home') return; 
    if (!activeCategory || !nextPageUrl || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
        const { videos: newVideos, nextUrl } = await fetchVideos(activeCategory, ratingSettings, nextPageUrl);
        
        const updatedVideos = [...videos, ...newVideos];
        setVideos(updatedVideos);
        setNextPageUrl(nextUrl);

        setVideoCache(prev => ({
            ...prev,
            [activeCategory.id]: { data: updatedVideos, nextUrl: nextUrl }
        }));

    } catch (e) {
        console.error("Failed to load more", e);
    } finally {
        setIsLoadingMore(false);
    }
  };

  const sortedVideos = useMemo(() => {
    if (!videos) return [];
    let result = [...videos];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(video => video.title && video.title.toLowerCase().includes(q));
    }

    return sortVideos(result, sortOption, sortDirection, videoStatuses);
  }, [videos, sortOption, sortDirection, searchQuery, videoStatuses]);

  const totalPages = Math.ceil(sortedVideos.length / ITEMS_PER_PAGE);
  const displayedVideos = useMemo(() => {
     if (sortedVideos.length > ITEMS_PER_PAGE) {
       return sortedVideos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
     }
     return sortedVideos;
  }, [sortedVideos, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChannelMenuTrigger = (e: React.MouseEvent, channel: ChannelDef) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    const MENU_WIDTH = 256; 
    let left = rect.left + (rect.width / 2) - (MENU_WIDTH / 2);
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
        const newChannels = channels.map(c => 
            c.id === activeChannelMenuId ? { ...c, label: channelEditName.trim() } : c
        );
        setChannels(newChannels);
        closeChannelMenu();
    }
  };

  const handleRemoveChannel = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;

    const newChannels = channels.filter(c => c.id !== channelId);
    setChannels(newChannels);

    setAllPlaylists(prev => {
        const next = { ...prev };
        delete next[channelId];
        return next;
    });

    if (activeChannelId === channelId) {
        setViewMode('home');
        setActiveChannelId(''); 
    }
    
    closeChannelMenu();
  };

  const activeMenuChannel = channels.find(c => c.id === activeChannelMenuId);

  const handleRefresh = (fetchAll: boolean = false) => {
    if (!activeCategory && viewMode !== 'home') return;
    
    if (viewMode === 'home') {
        setRefreshKey(prev => prev + 1);
        return;
    }

    setIsFetchAllMode(fetchAll);
    setCurrentPage(1);

    setVideoCache(prev => {
        const next = { ...prev };
        // @ts-ignore
        if (activeCategory) delete next[activeCategory.id];
        return next;
    });
    setRefreshKey(prev => prev + 1);
  };

  const handleGoHome = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setViewMode('home');
    setActiveChannelId(''); 
  };

  const handleChannelSelect = (channelId: string) => {
      setActiveChannelId(channelId);
      setViewMode('channel');
  };

  const toggleSearch = () => {
    if (isSearchOpen) {
      setSearchQuery('');
      setIsSearchOpen(false);
    } else {
      setIsSearchOpen(true);
    }
  };

  const handleAddPlaylist = (name: string, rutubeId: string, type: 'channel' | 'playlist') => {
    const newCategory: CategoryDef = {
      id: `${type}-${rutubeId}-${Date.now()}`,
      label: name,
      rutubeId,
      type,
      isSystem: false
    };
    
    setAllPlaylists(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newCategory]
    }));
    
    setActiveCategory(newCategory);
  };

  const handleImportPlaylists = (newPlaylists: CategoryDef[]) => {
    if (!channelToImport) return;

    setAllPlaylists(prev => {
      const current = prev[channelToImport.id] || [];
      const existingIds = new Set(current.map(c => c.rutubeId));
      const uniqueNew = newPlaylists.filter(p => !existingIds.has(p.rutubeId));

      return {
        ...prev,
        [channelToImport.id]: [...current, ...uniqueNew]
      };
    });
    setChannelToImport(null);
  };

  const handleRenamePlaylist = (categoryToRename: CategoryDef, newName: string) => {
    const currentList = allPlaylists[activeChannelId] || [];
    const newList = currentList.map(c => 
      c.id === categoryToRename.id ? { ...c, label: newName } : c
    );

    setAllPlaylists(prev => ({
      ...prev,
      [activeChannelId]: newList
    }));

    if (activeCategory?.id === categoryToRename.id) {
      setActiveCategory(prev => prev ? { ...prev, label: newName } : null);
    }
  };

  const handleRemovePlaylist = (categoryToRemove: CategoryDef) => {
    const currentList = allPlaylists[activeChannelId] || [];
    const newList = currentList.filter(c => c.id !== categoryToRemove.id);
    
    setAllPlaylists(prev => ({
      ...prev,
      [activeChannelId]: newList
    }));
    
    setVideoCache(prev => {
        const next = { ...prev };
        delete next[categoryToRemove.id];
        return next;
    });

    if (activeCategory?.id === categoryToRemove.id) {
      setActiveCategory(newList[0] || null);
    }
  };

  const handleReorderPlaylists = (newOrder: CategoryDef[]) => {
    setAllPlaylists(prev => ({
      ...prev,
      [activeChannelId]: newOrder
    }));
  };

  const handleAddChannel = (name: string, rutubeId: string) => {
    const newChannelId = `channel-${rutubeId}-${Date.now()}`;
    const newChannel: ChannelDef = {
      id: newChannelId,
      label: name,
      rutubeId,
      isSystem: false
    };

    const initialPlaylists: CategoryDef[] = [{
      id: `all-${newChannelId}`,
      label: 'Все видео',
      rutubeId: rutubeId,
      type: 'channel',
      isSystem: true
    }];

    setChannels([...channels, newChannel]);
    setAllPlaylists(prev => ({
      ...prev,
      [newChannelId]: initialPlaylists
    }));
    handleChannelSelect(newChannelId);
  };

  const handleSortOptionClick = (optionId: SortOption) => {
    if (sortOption === optionId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOption(optionId);
      if (optionId === 'alphabetical' || optionId === 'default') {
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    }
    setIsSortMenuOpen(false);
  };

  const handleSettingsSave = (newSettings: RatingSettings) => {
    setRatingSettings(newSettings);
    
    const updatedVideos = videos.map(video => ({
      ...video,
      rating: calculateRating(video.views, video.created_ts, newSettings),
      gravity: calculateGravity(video.views, video.created_ts, newSettings)
    }));
    
    setVideos(updatedVideos);

    if (activeCategory) {
        setVideoCache(prev => ({
            ...prev,
            [activeCategory.id]: { data: updatedVideos, nextUrl: nextPageUrl }
        }));
    }
  };

  const handleToggleVideoStatus = (videoId: string) => {
    setVideoStatuses(prev => {
      const current = prev[videoId];
      let next: 'watched' | 'liked' | 'watch_later' | undefined;
      
      if (!current) {
        next = 'liked';
      } else if (current === 'liked') {
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

  const handleVideoClick = (video: RutubeVideo) => {
    setSelectedVideo(video);
    
    setVideoStatuses(prev => {
      const current = prev[video.id];
      if (!current || current === 'watch_later') {
        return { ...prev, [video.id]: 'watched' };
      }
      return prev;
    });

    setWatchHistory(prev => {
      const filtered = prev.filter(v => v.id !== video.id);
      const newHistory = [video, ...filtered];
      return newHistory.slice(0, 100);
    });
  };

  const handleClearHistory = () => {
    setVideoStatuses(prev => {
      const next = { ...prev };
      let hasChanges = false;
      
      watchHistory.forEach(video => {
         if (next[video.id] === 'watched') {
             delete next[video.id];
             hasChanges = true;
         }
      });
      
      return hasChanges ? next : prev;
    });

    setWatchHistory([]);
  };

  const getGridClass = () => {
    switch (gridColumns) {
      case 2:
        return 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8';
      case 3:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8';
      case 4:
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8';
    }
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);

  const sortOptionsList: { id: SortOption; label: string }[] = [
    { id: 'default', label: 'Сортировка rutube' },
    { id: 'trend', label: 'В тренде' },
    { id: 'rating', label: 'По рейтингу' },
    { id: 'views', label: 'По зрителям' },
    { id: 'date', label: 'По дате добавления' },
    { id: 'year', label: 'По году выпуска' },
    { id: 'alphabetical', label: 'В алфавитном порядке' },
    { id: 'watched', label: 'Просмотрено' },
    { id: 'liked', label: 'Понравилось' },
    { id: 'watch_later', label: 'Буду смотреть' },
  ];

  const gridOptionsList: { count: 2 | 3 | 4; label: string }[] = [
    { count: 2, label: '2 колонки' },
    { count: 3, label: '3 колонки' },
    { count: 4, label: '4 колонки' },
  ];

  const openKinoRate = (query: string = '') => {
    setKinoRateQuery(query);
    setKinoRateContext(query); // Set the full title as context context
    setIsKinoRateOpen(true);
    setIsUserMenuOpen(false);
  };

  // --- NEW: Save Metadata Logic ---
  const handleSaveMetadata = (newItems: MovieRatingData[], contextKey?: string) => {
    setMetadataCache(prev => {
      const next = { ...prev };
      
      // If a specific context key is provided (the rutube title), save the FIRST result to that key
      if (contextKey && newItems.length > 0) {
          next[contextKey] = newItems[0];
      }

      // Also save by the clean title for general lookups
      newItems.forEach(item => {
        if (item.title) {
          next[item.title] = item;
        }
      });
      return next;
    });
  };

  // --- NEW: Refine Playlist Logic (Local DB) ---
  const handleRefinePlaylist = () => {
    if (!videos.length) return;
    
    // Iterate visible videos and match against TOP_250_MOVIES
    const newMetadata: MovieRatingData[] = [];
    
    videos.forEach(video => {
        // Skip if already has detailed metadata
        if (metadataCache[video.title]) return;

        const found = findMovieInTop250(video.title);
        if (found) {
            newMetadata.push({
                title: video.title, // Map directly to Rutube title here
                originalTitle: found.title,
                year: found.title.match(/\((\d{4})\)/)?.[1] || '',
                kpRating: 0, 
                kpVotes: '',
                imdbRating: found.currentRating || 0,
                description: '', // We don't have this in simple DB
                awards: found.awards.map(a => `${a.type} ${a.status}`)
            });
        }
    });

    if (newMetadata.length > 0) {
        // Here we are doing a "batch" update where the item.title is ALREADY the Rutube title
        // so we don't pass a single contextKey
        handleSaveMetadata(newMetadata);
    }
  };

  return (
    <div className="min-h-screen bg-[#000917] text-white">
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#000917]/95 backdrop-blur z-40 border-b border-zinc-800">
        
        <div className="absolute left-0 top-0 h-full flex items-center pl-4 md:pl-8 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <button 
              onClick={handleGoHome}
              className="flex items-center gap-1 transition-opacity hover:opacity-80 group relative shrink-0 select-none"
              title="На главную"
            >
              <span className="text-3xl font-bold tracking-tighter text-white">Rutube</span>
              <span className="text-3xl font-bold tracking-tighter text-[#000917] bg-[#cdab8f] px-2.5 pt-1 pb-1.5 rounded-md leading-none flex items-center ml-0.5">kino</span>
            </button>
          </div>
        </div>

        <div className="w-full h-full max-w-7xl mx-auto flex items-center relative z-40 pointer-events-none px-4 md:px-8">
           <div className="pointer-events-auto w-full overflow-hidden flex justify-start pl-52 xl:pl-0 transition-[padding] duration-300">
             <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-full group">
                <Reorder.Group 
                  axis="x" 
                  values={channels} 
                  onReorder={setChannels}
                  className="flex flex-row flex-nowrap items-center gap-2"
                >
                  {channels.map(channel => {
                    const isActive = viewMode === 'channel' && channel.id === activeChannelId;
                    const isMenuOpen = activeChannelMenuId === channel.id;
                    
                    return (
                      <Reorder.Item 
                        key={channel.id} 
                        value={channel}
                        whileDrag={{ scale: 1.05 }}
                        className="relative shrink-0"
                      >
                        <div className="group/channel relative">
                          <button
                            onClick={() => handleChannelSelect(channel.id)}
                            className={`
                              relative
                              px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-200
                              flex items-center justify-center cursor-grab active:cursor-grabbing select-none
                              ${isActive 
                                ? 'bg-[#cdab8f] text-[#000917] shadow-lg shadow-[#cdab8f]/20 pr-9' 
                                : 'bg-zinc-800 text-zinc-400 hover:bg-[#cdab8f] hover:text-[#000917]'
                              }
                            `}
                          >
                            <div className="overflow-hidden w-0 group-hover/channel:w-5 transition-[width] duration-200 ease-out flex items-center">
                               <GripVertical className={`w-3.5 h-3.5 ${isActive ? 'text-[#000917]' : 'text-zinc-600 group-hover:text-[#000917]'}`} />
                            </div>
                            {channel.label}
                            
                            {isActive && (
                              <div
                                role="button"
                                onPointerDown={(e) => e.stopPropagation()} 
                                onClick={(e) => handleChannelMenuTrigger(e, channel)}
                                className={`
                                  absolute right-1 top-1/2 -translate-y-1/2 p-1
                                  hover:bg-white/20 rounded-full transition-all duration-200 cursor-pointer
                                  ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover/channel:opacity-100'}
                                `}
                              >
                                <MoreVertical className="w-3.5 h-3.5 text-[#000917]" />
                              </div>
                            )}
                          </button>
                        </div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>

                <button
                  onClick={() => setIsAddChannelModalOpen(true)}
                  className={`
                    flex items-center justify-center shrink-0
                    px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
                    bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 border-dashed
                    hover:bg-zinc-700 hover:text-white hover:border-zinc-600
                    ${channels.length === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  `}
                  title="Добавить канал"
                >
                  <Plus className="w-4 h-4" />
                </button>
             </div>
           </div>
        </div>

        <div className="absolute right-0 top-0 h-full flex items-center pr-4 md:pr-8 gap-1 md:gap-3 z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1 md:gap-3">
              <div className="flex items-center">
                <div 
                  className={`
                    flex items-center overflow-hidden transition-all duration-300 ease-in-out
                    ${isSearchOpen ? 'w-40 sm:w-64 opacity-100 mr-2' : 'w-0 opacity-0 mr-0'}
                  `}
                >
                  <div className="relative w-full">
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-1.5 pl-4 pr-8 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all"
                      onKeyDown={(e) => { 
                        if(e.key === 'Escape') { toggleSearch(); } 
                        if(e.key === 'Enter') { e.currentTarget.blur(); }
                      }}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <button 
                  onClick={toggleSearch}
                  className={`
                    flex items-center justify-center w-9 h-9 rounded-full transition-colors
                    ${isSearchOpen 
                      ? 'bg-zinc-800 text-white' 
                      : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                    }
                  `}
                  title={isSearchOpen ? "Закрыть поиск" : "Поиск"}
                >
                  {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative shrink-0" ref={userMenuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                  title="Меню пользователя"
                >
                  {isLoggedIn ? <User className="w-5 h-5 text-white fill-white" /> : <User className="w-5 h-5" />}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                              {isLoggedIn ? <User className="w-5 h-5 text-white fill-white" /> : <User className="w-5 h-5 text-zinc-400" />}
                          </div>
                          <div className="overflow-hidden">
                              <p className="text-sm font-semibold text-white truncate">
                                {isLoggedIn ? 'Пользователь' : 'Гость'}
                              </p>
                              <p className="text-xs text-zinc-500 truncate">
                                {isLoggedIn ? 'Аккаунт' : 'Локальный профиль'}
                              </p>
                          </div>
                        </div>
                    </div>

                    <div className="p-2">
                        <button 
                          onClick={() => {
                             setIsHistoryModalOpen(true);
                             setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
                        >
                          <HistoryIcon className="w-4 h-4" />
                          <span>История просмотра</span>
                        </button>
                        
                        <button 
                          onClick={() => openKinoRate()}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span>KinoRate AI</span>
                        </button>

                        <button 
                          onClick={() => {
                            setIsFormulaModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
                        >
                          <Calculator className="w-4 h-4" />
                          <span>Формула рейтинга</span>
                        </button>

                        <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors">
                          <Settings className="w-4 h-4" />
                          <span>Настройки</span>
                        </button>
                        
                        <div className="h-px bg-zinc-800 my-2 mx-1" />
                        
                        {isLoggedIn ? (
                           <button 
                             onClick={() => {
                               setIsLoggedIn(false);
                               setIsUserMenuOpen(false);
                             }}
                             className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 flex items-center gap-3 transition-colors"
                           >
                             <LogOut className="w-4 h-4" />
                             <span>Выйти</span>
                           </button>
                        ) : (
                           <button 
                             onClick={() => {
                               setIsLoggedIn(true);
                               setIsUserMenuOpen(false);
                             }}
                             className="w-full text-left px-3 py-2 rounded-lg text-sm text-blue-400 hover:bg-zinc-800 hover:text-blue-300 flex items-center gap-3 transition-colors"
                           >
                             <LogIn className="w-4 h-4" />
                             <span>Войти</span>
                           </button>
                        )}
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>
      </nav>

      <main className="pt-[74px] px-4 md:px-8 pb-12 max-w-7xl mx-auto">
        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <div className="w-full max-w-3xl bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center text-center mb-[10px]">
              <Tv className="w-16 h-16 mb-4 opacity-50 text-blue-500" />
              <h3 className="text-xl font-medium text-white mb-2">Список каналов пуст</h3>
              <p className="max-w-md px-4 mb-8 text-zinc-400">
                Добавьте свой любимый канал Rutube или выберите один из рекомендованных, чтобы начать просмотр.
              </p>
              
              <button 
                onClick={() => setIsAddChannelModalOpen(true)}
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium mb-8 border border-zinc-700"
              >
                <PlusCircle className="w-5 h-5" />
                Добавить по ссылке
              </button>

              <div className="w-full flex items-center gap-4 mb-8">
                <div className="h-px bg-zinc-800 flex-1" />
                <span className="text-sm text-zinc-500 uppercase tracking-wider">Рекомендуемые</span>
                <div className="h-px bg-zinc-800 flex-1" />
              </div>

              <div className="flex flex-wrap justify-center gap-8 w-full px-4">
                {RECOMMENDED_CHANNELS.map((channel) => (
                  <RecommendedChannelCard 
                    key={channel.id}
                    id={channel.id}
                    label={channel.label}
                    color={channel.color}
                    onClick={() => handleAddChannel(channel.label, channel.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'home' && (
               <div className="mb-6">
                 <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Лента</h1>
                 <p className="text-zinc-400">Последние видео с ваших каналов</p>
               </div>
            )}

            {viewMode === 'channel' && (channelInfo || isChannelLoading) && (
              <ChannelHeader 
                channelInfo={channelInfo} 
                isLoading={isChannelLoading}
              />
            )}

            {(!channelInfo && !isChannelLoading && viewMode === 'channel') && (
               <div className="mb-[10px]">
                 <h1 className="text-3xl md:text-4xl font-bold mb-4">{activeChannel?.label || 'Видео'}</h1>
               </div>
            )}

            {viewMode === 'channel' && activeCategory && (
                <div className="mb-6">
                  <CategoryFilter 
                    categories={currentChannelPlaylists}
                    activeCategory={activeCategory}
                    currentLoadedCount={videos.length}
                    onSelect={setActiveCategory}
                    onAddClick={() => {
                        const channel = channels.find(c => c.id === activeChannelId);
                        if (channel) {
                            setChannelToImport(channel);
                        } else {
                            setIsAddPlaylistModalOpen(true);
                        }
                    }}
                    onRemove={handleRemovePlaylist}
                    onRename={handleRenamePlaylist}
                    onRefresh={handleRefresh}
                    onReorder={handleReorderPlaylists}
                    onRefine={handleRefinePlaylist}
                  />
                </div>
            )}

            {(viewMode === 'home' || (viewMode === 'channel' && activeCategory)) && (
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sticky top-16 z-30 bg-[#000917]/95 py-2 backdrop-blur-sm -mx-4 px-4 md:-mx-8 md:px-8 border-b border-zinc-800/50">
                <div className="text-zinc-400 text-sm font-medium">
                  {videos.length} видео
                </div>

                <div className="flex items-center gap-3">
                   <div className="relative" ref={sortMenuRef}>
                      <button
                        onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                      >
                         <ArrowUpDown className="w-4 h-4" />
                         <span className="hidden sm:inline">
                           {sortOptionsList.find(o => o.id === sortOption)?.label}
                         </span>
                      </button>
                      {isSortMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                           {sortOptionsList.map(opt => (
                             <button
                                key={opt.id}
                                onClick={() => handleSortOptionClick(opt.id)}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-zinc-800 transition-colors ${sortOption === opt.id ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-300'}`}
                             >
                               <span>{opt.label}</span>
                               {sortOption === opt.id && (
                                  sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                               )}
                             </button>
                           ))}
                        </div>
                      )}
                   </div>

                   <div className="relative hidden sm:block" ref={gridMenuRef}>
                      <button
                        onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                      >
                         <LayoutGrid className="w-4 h-4" />
                      </button>
                       {isGridMenuOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                           {gridOptionsList.map(opt => (
                             <button
                                key={opt.count}
                                onClick={() => { setGridColumns(opt.count); setIsGridMenuOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-zinc-800 transition-colors ${gridColumns === opt.count ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-300'}`}
                             >
                               <span>{opt.label}</span>
                               {gridColumns === opt.count && <Check className="w-3.5 h-3.5" />}
                             </button>
                           ))}
                        </div>
                      )}
                   </div>
                </div>
              </div>
            )}

            {isVideoLoading && !isLoadingMore ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                <p>Загрузка видео...</p>
              </div>
            ) : displayedVideos.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                 <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <PlayCircle className="w-8 h-8 opacity-50" />
                 </div>
                 <h3 className="text-lg font-medium text-white mb-1">Видео не найдены</h3>
                 <p className="max-w-xs text-center text-sm">
                   В этом плейлисте пока нет видео или они не загрузились.
                 </p>
                 {viewMode === 'channel' && (
                    <button 
                      onClick={handleRefresh}
                      className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Обновить
                    </button>
                 )}
               </div>
            ) : (
               <>
                 <Pagination 
                   currentPage={currentPage}
                   totalPages={totalPages}
                   onPageChange={handlePageChange}
                   className="mb-6"
                 />

                 <div className={getGridClass()}>
                   {displayedVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onClick={handleVideoClick}
                        status={videoStatuses[video.id]}
                        onStatusToggle={() => handleToggleVideoStatus(video.id)}
                        ratingSettings={ratingSettings}
                        onAnalyze={openKinoRate}
                        externalMetadata={metadataCache} // Pass metadata cache
                      />
                   ))}
                 </div>
                 
                 <Pagination 
                   currentPage={currentPage}
                   totalPages={totalPages}
                   onPageChange={handlePageChange}
                 />

                 {nextPageUrl && !isFetchAllMode && viewMode === 'channel' && (
                    <div className="flex justify-center mt-8">
                       <button
                         onClick={handleLoadMore}
                         disabled={isLoadingMore}
                         className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                       >
                         {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                         {isLoadingMore ? 'Загрузка...' : 'Загрузить еще'}
                       </button>
                    </div>
                 )}
               </>
            )}

          </>
        )}
      </main>

      {activeChannelMenuId && activeMenuChannel && channelMenuPosition && createPortal(
         <div className="fixed inset-0 z-50 pointer-events-none">
           <div 
             ref={channelMenuRef}
             className="absolute bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150 w-64 origin-top"
             style={{ top: channelMenuPosition.top, left: channelMenuPosition.left }}
           >
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                 <div className="flex items-center gap-2">
                    {isEditingChannel && (
                      <button onClick={() => setIsEditingChannel(false)} className="mr-1 text-zinc-400 hover:text-white">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    <h2 className="text-white font-medium truncate text-xs uppercase tracking-wider text-zinc-500">
                      {isEditingChannel ? 'Переименовать канал' : 'Действия с каналом'}
                    </h2>
                 </div>
              </div>
              <div className="p-1.5 bg-zinc-900">
                {!isEditingChannel ? (
                  <>
                     <button
                        onClick={() => {
                          setChannelToImport(activeMenuChannel);
                          closeChannelMenu();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
                      >
                        <ListPlus className="w-4 h-4 text-zinc-400" />
                        <span>Импорт плейлистов</span>
                      </button>

                      <button
                        onClick={() => setIsEditingChannel(true)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-zinc-400" />
                        <span>Переименовать</span>
                      </button>

                      <div className="h-px bg-zinc-800 my-1.5 mx-1" />
                      <button
                        onClick={() => handleRemoveChannel(activeMenuChannel.id)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 flex items-center gap-3 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Удалить канал</span>
                      </button>
                  </>
                ) : (
                  <div className="p-2 flex flex-col gap-2">
                    <input
                      ref={channelInputRef}
                      type="text"
                      value={channelEditName}
                      onChange={(e) => setChannelEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameChannelSave()}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="Название"
                    />
                    <button
                      onClick={handleRenameChannelSave}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Сохранить
                    </button>
                  </div>
                )}
              </div>
           </div>
         </div>,
         document.body
      )}

      {selectedVideo && (
        <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
      
      {isAddPlaylistModalOpen && (
        <AddCategoryModal 
          onClose={() => setIsAddPlaylistModalOpen(false)}
          onAdd={handleAddPlaylist}
        />
      )}

      {isAddChannelModalOpen && (
        <AddChannelModal
          onClose={() => setIsAddChannelModalOpen(false)}
          onAdd={handleAddChannel}
        />
      )}

      {isFormulaModalOpen && (
        <FormulaSettingsModal
          settings={ratingSettings}
          videos={videos}
          onClose={() => setIsFormulaModalOpen(false)}
          onSave={handleSettingsSave}
        />
      )}

      {channelToImport && (
        <ImportPlaylistsModal
          channelId={channelToImport.rutubeId}
          existingPlaylists={allPlaylists[channelToImport.id] || []}
          preloadedPlaylists={channelToImport.id === activeChannelId ? channelAvailablePlaylists : undefined}
          onClose={() => setChannelToImport(null)}
          onImport={handleImportPlaylists}
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
           onClear={handleClearHistory}
           onVideoClick={(video) => {
              handleVideoClick(video);
              setIsHistoryModalOpen(false);
           }}
        />
      )}

      {isKinoRateOpen && (
        <KinoRateModal
           initialQuery={kinoRateQuery}
           contextKey={kinoRateContext}
           onClose={() => setIsKinoRateOpen(false)}
           onSaveMetadata={handleSaveMetadata} // Pass save callback
        />
      )}

    </div>
  );
};

export default App;
