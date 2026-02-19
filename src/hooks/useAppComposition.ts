import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { sortVideos } from '../services/rutubeService';
import { CategoryDef, ChannelDef, RatingSettings, RutubeVideo } from '../types';
import { useChannels } from './useChannels';
import { useVideoCache } from './useVideoCache';
import { useVideoLogic } from './useVideoLogic';
import { useChannelMenu } from './useChannelMenu';
import { useVideoStatuses } from './useVideoStatuses';
import { useHistory } from './useHistory';
import { useMetadata } from './useMetadata';
import { useModals } from './useModals';
import { useSearch } from './useSearch';
import { useSortingAndGrid } from './useSortingAndGrid';
import { usePagination } from './usePagination';
import { useMainContentProps } from './useMainContentProps';
import { useNavigationProps } from './useNavigationProps';
import { useCategoryEffects } from './useCategoryEffects';

interface UseAppCompositionResult {
  navigationProps: ReturnType<typeof useNavigationProps>;
  mainContentProps: ReturnType<typeof useMainContentProps>;
}

export const useAppComposition = (): UseAppCompositionResult => {
  const {
    channels,
    activeChannelId,
    viewMode,
    activeChannel,
    handleChannelSelect,
    handleGoHome,
    handleAddChannel,
    handleRenameChannel,
    handleRemoveChannel,
    channelInfo,
    isChannelLoading,
    currentChannelPlaylists,
    allPlaylists,
    setAllPlaylists,
    channelAvailablePlaylists,
    refreshChannelData,
  } = useChannels();

  const [activeCategory, setActiveCategory] = useState<CategoryDef | null>(null);

  const { videoCache, setVideoCache, addToCache, removeFromCache, getFromCache } = useVideoCache();

  const { watchHistory, isLoggedIn, setIsLoggedIn, addToHistory, clearHistory } = useHistory();

  const {
    videoWatchedStatuses,
    videoLikedStatuses,
    toggleVideoWatchedStatus,
    toggleVideoLikedStatus,
    updateWatchedStatus,
  } = useVideoStatuses(isLoggedIn);

  const {
    metadataCache,
    handleAnalyzeVideo,
    handleSaveMetadata,
    loadingMetadataFor,
    handleClearMetadataCache,
  } = useMetadata();

  const {
    selectedVideo,
    setSelectedVideo,
    isAddPlaylistModalOpen,
    setIsAddPlaylistModalOpen,
    isAddChannelModalOpen,
    setIsAddChannelModalOpen,
    isFormulaModalOpen,
    setIsFormulaModalOpen,
    channelToImport,
    setChannelToImport,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isKinoRateOpen,
    setIsKinoRateOpen,
    kinoRateQuery,
    setKinoRateQuery,
    kinoRateContext,
    setKinoRateContext,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    confirmMessage,
    setConfirmMessage,
    confirmCallback,
    setConfirmCallback,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    notificationMessage,
    setNotificationMessage,
    notificationType,
    setNotificationType,
    openKinoRate,
    showNotification,
  } = useModals();

  const {
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    toggleSearch,
  } = useSearch();

  const [ratingSettings, setRatingSettings] = useState<RatingSettings>(() =>
    StorageService.getRatingSettings()
  );

  const {
    gridColumns,
    setGridColumns,
    sortOption,
    setSortOption,
    sortDirection,
    setSortDirection,
    handleSortOptionClick,
    sortOptionsList,
    gridOptionsList,
  } = useSortingAndGrid({ ratingSettings, setRatingSettings });

  const [videos, setVideos] = useState<RutubeVideo[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    isLoadingMore,
    isFetchAllMode,
    setIsFetchAllMode,
    handleLoadMore,
    handleRefresh: handleVideoRefresh,
  } = useVideoLogic({
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
  });

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

  const { currentPage, setCurrentPage, totalPages, displayedVideos, handlePageChange } =
    usePagination({ sortedVideos });

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const gridMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshChannelData();
  }, [activeChannelId, viewMode, refreshChannelData]);

  useCategoryEffects({
    viewMode,
    currentChannelPlaylists,
    activeCategory,
    setActiveCategory,
    setSortOption,
    setIsFetchAllMode,
    setCurrentPage,
    activeChannelId,
    setSearchQuery,
    setIsSearchOpen,
  });

  const {
    activeChannelMenuId,
    channelMenuPosition,
    isEditingChannel,
    channelEditName,
    setIsEditingChannel,
    setChannelEditName,
    channelMenuRef,
    channelInputRef,
    handleChannelMenuTrigger,
    closeChannelMenu,
    handleRenameChannelSave,
    handleRemoveChannel: handleRemoveChannelFromMenu,
  } = useChannelMenu({
    channels,
    activeChannelId,
    viewMode,
    currentChannelPlaylists,
    setActiveCategory,
    setIsFetchAllMode,
    setCurrentPage,
    setRefreshKey,
    setVideoCache,
    activeCategory,
    handleRenameChannel,
    handleRemoveChannel,
  });

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
      // Safe check: channelMenuRef might be undefined in some render cycles
      if (
        channelMenuRef &&
        'current' in channelMenuRef &&
        channelMenuRef.current &&
        !channelMenuRef.current.contains(target)
      ) {
        closeChannelMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', closeChannelMenu, { capture: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', closeChannelMenu, { capture: true });
    };
  }, [closeChannelMenu, channelMenuRef]);

  const handleRefresh = useCallback(
    (fetchAll: boolean = false) => {
      if (!activeCategory && viewMode !== 'home') return;

      if (viewMode === 'home') {
        setRefreshKey(prev => prev + 1);
        return;
      }

      handleVideoRefresh(fetchAll);
      setCurrentPage(1);

      if (activeCategory) {
        removeFromCache(activeCategory.id);
      }
    },
    [activeCategory, viewMode, handleVideoRefresh, setCurrentPage, removeFromCache]
  );

  const handleAddPlaylist = useCallback(
    (name: string, rutubeId: string, type: 'channel' | 'playlist') => {
      const newPlaylistId = `playlist-${rutubeId}-${Date.now()}`;
      const newPlaylist: CategoryDef = {
        id: newPlaylistId,
        label: name,
        rutubeId,
        type,
        isSystem: false,
      };

      const currentId = activeChannelId;
      if (!currentId) return;
      const currentList = allPlaylists[currentId] || [];
      setAllPlaylists(prev => ({
        ...prev,
        [currentId]: [...currentList, newPlaylist],
      }));

      setActiveCategory(newPlaylist);
      setIsAddPlaylistModalOpen(false);
    },
    [activeChannelId, allPlaylists, setAllPlaylists, setActiveCategory, setIsAddPlaylistModalOpen]
  );

  const handleRemovePlaylist = useCallback(
    (categoryToRemove: CategoryDef) => {
      const currentId = activeChannelId;
      if (!currentId) return;
      const currentList = allPlaylists[currentId] || [];
      const newList = currentList.filter(c => c.id !== categoryToRemove.id);

      setAllPlaylists(prev => ({
        ...prev,
        [currentId]: newList,
      }));

      removeFromCache(categoryToRemove.id);

      if (activeCategory?.id === categoryToRemove.id) {
        setActiveCategory(newList[0] || null);
      }
    },
    [activeChannelId, allPlaylists, setAllPlaylists, removeFromCache, activeCategory]
  );

  const handleRenamePlaylist = useCallback(
    (categoryToRename: CategoryDef, newName: string) => {
      const currentId = activeChannelId;
      if (!currentId) return;
      const currentList = allPlaylists[currentId] || [];
      const newList = currentList.map(c =>
        c.id === categoryToRename.id ? { ...c, label: newName } : c
      );

      setAllPlaylists(prev => ({
        ...prev,
        [currentId]: newList,
      }));

      if (activeCategory?.id === categoryToRename.id) {
        setActiveCategory(prev => (prev ? { ...prev, label: newName } : null));
      }
    },
    [activeChannelId, allPlaylists, setAllPlaylists, activeCategory]
  );

  const handleReorderPlaylists = useCallback(
    (newOrder: CategoryDef[]) => {
      const currentId = activeChannelId;
      if (!currentId) return;
      setAllPlaylists(prev => ({
        ...prev,
        [currentId]: newOrder,
      }));
    },
    [activeChannelId, setAllPlaylists]
  );

  const handleImportPlaylists = useCallback(
    (newPlaylists: CategoryDef[]) => {
      const currentId = activeChannelId;
      if (!currentId) return;
      const currentList = allPlaylists[currentId] || [];
      setAllPlaylists(prev => ({
        ...prev,
        [currentId]: [...currentList, ...newPlaylists],
      }));
    },
    [activeChannelId, allPlaylists, setAllPlaylists]
  );

  const handleVideoClick = useCallback(
    (video: RutubeVideo) => {
      setSelectedVideo(video);
      updateWatchedStatus(video.id, 'watched');
      addToHistory(video);
    },
    [setSelectedVideo, updateWatchedStatus, addToHistory]
  );

  const navigationProps = useNavigationProps({
    channels,
    viewMode,
    activeChannelId,
    handleChannelSelect,
    handleChannelMenuTrigger,
    activeChannelMenuId,
    setIsAddChannelModalOpen,
    channelMenuRef,
    isSearchOpen,
    searchQuery,
    setSearchQuery,
    toggleSearch,
    searchInputRef,
    isLoggedIn,
    setIsUserMenuOpen,
    isUserMenuOpen,
    setIsHistoryModalOpen,
    openKinoRate,
    setIsFormulaModalOpen,
    handleClearMetadataCache,
    setIsLoggedIn,
    sortOptionsList,
    sortOption,
    handleSortOptionClick,
    sortDirection,
    isSortMenuOpen,
    setIsSortMenuOpen,
    sortMenuRef,
    gridOptionsList,
    gridColumns,
    setGridColumns,
    setIsGridMenuOpen,
    isGridMenuOpen,
    gridMenuRef,
    userMenuRef,
    handleGoHome,
    handleAddChannel: () => setIsAddChannelModalOpen(true),
  });

  const mainContentProps = useMainContentProps({
    channels,
    viewMode,
    activeChannelId,
    handleAddChannel,
    setIsAddChannelModalOpen,
    activeChannel,
    handleGoHome,
    channelInfo,
    isChannelLoading,
    currentChannelPlaylists,
    activeCategory,
    setActiveCategory,
    videos,
    allPlaylists,
    setAllPlaylists,
    removeFromCache,
    displayedVideos,
    selectedVideo,
    setSelectedVideo,
    updateWatchedStatus,
    addToHistory,
    videoWatchedStatuses,
    videoLikedStatuses,
    toggleVideoWatchedStatus,
    toggleVideoLikedStatus,
    ratingSettings,
    handleAnalyzeVideo,
    loadingMetadataFor,
    metadataCache,
    gridColumns,
    currentPage,
    totalPages,
    handlePageChange,
    isVideoLoading,
    isLoadingMore,
    nextPageUrl,
    isFetchAllMode,
    handleLoadMore,
    sortOptionsList,
    sortOption,
    handleSortOptionClick,
    sortDirection,
    isSortMenuOpen,
    setIsSortMenuOpen,
    sortMenuRef,
    gridOptionsList,
    setGridColumns,
    setIsGridMenuOpen,
    isGridMenuOpen,
    gridMenuRef,
    isAddPlaylistModalOpen,
    setIsAddPlaylistModalOpen,
    handleAddPlaylist,
    isAddChannelModalOpen,
    isFormulaModalOpen,
    setIsFormulaModalOpen,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isKinoRateOpen,
    setIsKinoRateOpen,
    kinoRateQuery,
    setKinoRateQuery,
    kinoRateContext,
    setKinoRateContext,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    confirmMessage,
    setConfirmMessage,
    confirmCallback,
    setConfirmCallback,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    notificationMessage,
    setNotificationMessage,
    notificationType,
    setNotificationType,
    handleSettingsSave: setRatingSettings,
    channelAvailablePlaylists,
    handleImportPlaylists,
    channelToImport,
    watchHistory,
    handleClearHistory: clearHistory,
    handleVideoClickForHistory: handleVideoClick,
    handleSaveMetadata,
    openKinoRate,
    handleClearMetadataCache,
    showNotification,
    setChannelToImport,
    setIsAddPlaylistModalOpenForMain: setIsAddPlaylistModalOpen,
    setIsAddChannelModalOpenForMain: setIsAddChannelModalOpen,
    ratingSettingsForModal: ratingSettings,
    handleRefresh,
    activeChannelMenuId,
    activeMenuChannel: activeChannelMenuId
      ? channels.find(channel => channel.id === activeChannelMenuId)
      : undefined,
    channelMenuPosition,
    isEditingChannel,
    setIsEditingChannel,
    closeChannelMenu,
    handleRemoveChannel: handleRemoveChannelFromMenu,
    channelEditName,
    setChannelEditName,
    channelInputRef,
    handleRenameChannelSave,
    channelMenuRef,
  });

  return {
    navigationProps,
    mainContentProps,
  };
};
