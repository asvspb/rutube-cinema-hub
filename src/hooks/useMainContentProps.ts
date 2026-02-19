import { useMemo } from 'react';
import {
  CategoryDef,
  RutubeVideo,
  ChannelDef,
  SortOption,
  RatingSettings,
  ChannelInfo,
  MovieRatingData,
} from '../types';
import { calculateRating, calculateGravity } from '../services/rutubeService';

interface UseMainContentProps {
  channels: ChannelDef[];
  viewMode: 'home' | 'channel';
  activeChannelId: string | null;
  handleAddChannel: (name: string, rutubeId: string) => void;
  setIsAddChannelModalOpen: (open: boolean) => void;
  activeChannel: ChannelDef | undefined;
  handleGoHome: () => void;
  channelInfo: ChannelInfo | null;
  isChannelLoading: boolean;
  currentChannelPlaylists: CategoryDef[] | undefined;
  activeCategory: CategoryDef | null;
  setActiveCategory: (category: CategoryDef | null) => void;
  videos: RutubeVideo[];
  allPlaylists: Record<string, CategoryDef[]>;
  setAllPlaylists: (playlists: Record<string, CategoryDef[]>) => void;
  removeFromCache: (key: string) => void;
  displayedVideos: RutubeVideo[];
  selectedVideo: RutubeVideo | null;
  setSelectedVideo: (video: RutubeVideo | null) => void;
  updateWatchedStatus: (id: string, status: 'watched' | 'watch_later') => void;
  addToHistory: (video: RutubeVideo) => void;
  videoWatchedStatuses: Record<string, 'watched' | 'watch_later'>;
  videoLikedStatuses: Record<string, 'liked' | 'disliked'>;
  toggleVideoWatchedStatus: (videoId: string) => void;
  toggleVideoLikedStatus: (videoId: string) => void;
  ratingSettings: RatingSettings;
  handleAnalyzeVideo: (title: string) => Promise<void>;
  loadingMetadataFor: Set<string>;
  metadataCache: Record<string, MovieRatingData>;
  gridColumns: 2 | 3 | 4;
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
  isVideoLoading: boolean;
  isLoadingMore: boolean;
  nextPageUrl: string | null;
  isFetchAllMode: boolean;
  handleLoadMore: () => void;
  sortOptionsList: Array<{ id: SortOption; label: string }>;
  sortOption: SortOption;
  handleSortOptionClick: (optionId: SortOption) => void;
  sortDirection: 'asc' | 'desc';
  isSortMenuOpen: boolean;
  setIsSortMenuOpen: (open: boolean) => void;
  sortMenuRef: React.RefObject<HTMLDivElement>;
  gridOptionsList: Array<{ count: 2 | 3 | 4; label: string }>;
  setGridColumns: (cols: 2 | 3 | 4) => void;
  setIsGridMenuOpen: (open: boolean) => void;
  isGridMenuOpen: boolean;
  gridMenuRef: React.RefObject<HTMLDivElement>;
  isAddPlaylistModalOpen: boolean;
  setIsAddPlaylistModalOpen: (open: boolean) => void;
  handleAddPlaylist: (name: string, rutubeId: string, type: 'channel' | 'playlist') => void;
  isAddChannelModalOpen: boolean;
  isFormulaModalOpen: boolean;
  setIsFormulaModalOpen: (open: boolean) => void;
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;
  isKinoRateOpen: boolean;
  setIsKinoRateOpen: (open: boolean) => void;
  kinoRateQuery: string;
  setKinoRateQuery: (query: string) => void;
  kinoRateContext: any;
  setKinoRateContext: (context: any) => void;
  isConfirmModalOpen: boolean;
  setIsConfirmModalOpen: (open: boolean) => void;
  confirmMessage: string;
  setConfirmMessage: React.Dispatch<React.SetStateAction<string>>;
  confirmCallback: (() => void) | null;
  setConfirmCallback: React.Dispatch<React.SetStateAction<(() => void) | null>>;
  isNotificationModalOpen: boolean;
  setIsNotificationModalOpen: (open: boolean) => void;
  notificationMessage: string;
  setNotificationMessage: React.Dispatch<React.SetStateAction<string>>;
  notificationType: 'info' | 'success' | 'warning' | 'error';
  setNotificationType: React.Dispatch<
    React.SetStateAction<'info' | 'success' | 'warning' | 'error'>
  >;
  handleSettingsSave: (newSettings: RatingSettings) => void;
  channelAvailablePlaylists: CategoryDef[];
  handleImportPlaylists: (newPlaylists: CategoryDef[]) => void;
  channelToImport: ChannelDef | null;
  watchHistory: RutubeVideo[];
  handleClearHistory: () => void;
  handleVideoClickForHistory: (video: RutubeVideo) => void;
  handleSaveMetadata: (newItems: MovieRatingData[], contextKey?: string) => void;
  openKinoRate: () => void;
  handleClearMetadataCache: () => void;
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  setChannelToImport: React.Dispatch<React.SetStateAction<ChannelDef | null>>;
  setIsAddPlaylistModalOpenForMain: (open: boolean) => void;
  setIsAddChannelModalOpenForMain: (open: boolean) => void;
  ratingSettingsForModal: RatingSettings;
  handleRefresh: (fetchAll?: boolean) => void;
  activeChannelMenuId: string | null;
  activeMenuChannel: ChannelDef | undefined;
  channelMenuPosition: { top: number; left: number } | null;
  isEditingChannel: boolean;
  setIsEditingChannel: (editing: boolean) => void;
  closeChannelMenu: () => void;
  handleRemoveChannel: (id: string) => void;
  channelEditName: string;
  setChannelEditName: React.Dispatch<React.SetStateAction<string>>;
  channelInputRef: React.RefObject<HTMLInputElement>;
  handleRenameChannelSave: () => void;
  channelMenuRef: React.RefObject<HTMLDivElement>;
  // New: per-channel available playlists
  availablePlaylistsByChannel: Record<string, CategoryDef[]>;
  loadAvailablePlaylistsForChannel: (rutubeId: string) => Promise<CategoryDef[]>;
  loadingPlaylistsForChannel: Record<string, boolean>;
}

export const useMainContentProps = ({
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
  handleSettingsSave,
  channelAvailablePlaylists,
  handleImportPlaylists,
  channelToImport,
  watchHistory,
  handleClearHistory,
  handleVideoClickForHistory,
  handleSaveMetadata,
  openKinoRate,
  handleClearMetadataCache,
  showNotification,
  setChannelToImport,
  setIsAddPlaylistModalOpenForMain,
  setIsAddChannelModalOpenForMain,
  ratingSettingsForModal,
  handleRefresh,
  activeChannelMenuId,
  activeMenuChannel,
  channelMenuPosition,
  isEditingChannel,
  setIsEditingChannel,
  closeChannelMenu,
  handleRemoveChannel,
  channelEditName,
  setChannelEditName,
  channelInputRef,
  handleRenameChannelSave,
  channelMenuRef,
  availablePlaylistsByChannel,
  loadAvailablePlaylistsForChannel,
  loadingPlaylistsForChannel,
}: UseMainContentProps) => {
  const mainContentProps = useMemo(() => {
    return {
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
      handleRemovePlaylist: (categoryToRemove: CategoryDef) => {
        const currentId = activeChannelId!;
        const currentList = allPlaylists[currentId] || [];
        const newList = currentList.filter(c => c.id !== categoryToRemove.id);

        setAllPlaylists({
          ...allPlaylists,
          [currentId]: newList,
        });

        removeFromCache(categoryToRemove.id);

        if (activeCategory?.id === categoryToRemove.id) {
          setActiveCategory(newList[0] || null);
        }
      },
      handleRenamePlaylist: (categoryToRename: CategoryDef, newName: string) => {
        const currentId = activeChannelId!;
        const currentList = allPlaylists[currentId] || [];
        const newList = currentList.map(c =>
          c.id === categoryToRename.id ? { ...c, label: newName } : c
        );

        setAllPlaylists({
          ...allPlaylists,
          [currentId]: newList,
        });

        if (activeCategory?.id === categoryToRename.id) {
          setActiveCategory(activeCategory ? { ...activeCategory, label: newName } : null);
        }
      },
      handleReorderPlaylists: (newOrder: CategoryDef[]) => {
        const currentId = activeChannelId!;
        setAllPlaylists({
          ...allPlaylists,
          [currentId]: newOrder,
        });
      },
      handleRefresh,
      setIsAddPlaylistModalOpen,
      channelToImport,
      setChannelToImport,
      displayedVideos,
      selectedVideo,
      setSelectedVideo,
      handleVideoClick: (video: RutubeVideo) => {
        setSelectedVideo(video);
        updateWatchedStatus(video.id, 'watched');
        addToHistory(video);
      },
      videoWatchedStatuses,
      videoLikedStatuses,
      toggleVideoWatchedStatus,
      toggleVideoLikedStatus,
      ratingSettings,
      handleAnalyzeVideo,
      loadingMetadataFor,
      metadataCache,
      getGridClass: () => {
        switch (gridColumns) {
          case 2:
            return 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8';
          case 3:
            return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8';
          case 4:
          default:
            return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8';
        }
      },
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
      gridColumns,
      setGridColumns,
      setIsGridMenuOpen,
      isGridMenuOpen,
      gridMenuRef,
      isAddPlaylistModalOpen,
      setIsAddPlaylistModalOpenForMain,
      handleAddPlaylist,
      isAddChannelModalOpen,
      setIsAddChannelModalOpenForMain,
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
      ratingSettingsForModal,
      handleSettingsSave,
      allPlaylists,
      channelAvailablePlaylists,
      handleImportPlaylists,
      channelToImportForModal: channelToImport,
      watchHistory,
      handleClearHistory,
      handleVideoClickForHistory,
      handleSaveMetadata,
      openKinoRate,
      handleClearMetadataCache,
      showNotification,
      setChannelToImportForModal: setChannelToImport,
      setIsAddChannelModalOpenForModal: setIsAddChannelModalOpen,
      setIsAddPlaylistModalOpenForModal: setIsAddPlaylistModalOpen,
      activeChannelMenuId,
      activeMenuChannel,
      channelMenuPosition,
      isEditingChannel,
      setIsEditingChannel,
      closeChannelMenu,
      handleRemoveChannel,
      channelEditName,
      setChannelEditName,
      channelInputRef,
      handleRenameChannelSave,
      channelMenuRef,
      availablePlaylistsByChannel,
      loadAvailablePlaylistsForChannel,
      loadingPlaylistsForChannel,
    };
  }, [
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
    gridOptionsList,
    setGridColumns,
    setIsGridMenuOpen,
    isGridMenuOpen,
    isAddPlaylistModalOpen,
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
    handleSettingsSave,
    channelAvailablePlaylists,
    handleImportPlaylists,
    channelToImport,
    watchHistory,
    handleClearHistory,
    handleVideoClickForHistory,
    handleSaveMetadata,
    openKinoRate,
    handleClearMetadataCache,
    showNotification,
    setChannelToImport,
    setIsAddPlaylistModalOpenForMain,
    setIsAddChannelModalOpenForMain,
    ratingSettingsForModal,
    handleRefresh,
    activeChannelMenuId,
    activeMenuChannel,
    channelMenuPosition,
    isEditingChannel,
    setIsEditingChannel,
    closeChannelMenu,
    handleRemoveChannel,
    channelEditName,
    setChannelEditName,
    channelInputRef,
    handleRenameChannelSave,
    channelMenuRef,
    availablePlaylistsByChannel,
    loadAvailablePlaylistsForChannel,
    loadingPlaylistsForChannel,
  ]);

  return mainContentProps;
};
