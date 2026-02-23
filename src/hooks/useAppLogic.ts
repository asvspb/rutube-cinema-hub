import { useState, useEffect } from 'react';
import { CategoryDef, SortOption, ChannelDef, RatingSettings, RutubeVideo } from '../types';
import { StorageService } from '../services/storageService';

interface UseAppLogicProps {
  viewMode: 'home' | 'channel';
  currentChannelPlaylists: CategoryDef[];
  activeChannelId: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setIsFetchAllMode: React.Dispatch<React.SetStateAction<boolean>>;
  setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
  setGridColumns: React.Dispatch<React.SetStateAction<2 | 3 | 4>>;
  setRatingSettings: React.Dispatch<React.SetStateAction<RatingSettings>>;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  removeFromCache: (categoryId: string) => void;
  activeCategory: CategoryDef | null;
  channels: ChannelDef[];
  addToCache: (categoryId: string, data: RutubeVideo[]) => void;
  handleVideoRefresh: (fetchAll: boolean) => void;
  setActiveCategory: React.Dispatch<React.SetStateAction<CategoryDef | null>>;
  setIsVideoLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setNextPageUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setVideos: React.Dispatch<React.SetStateAction<RutubeVideo[]>>;
}

interface UseAppLogicResult {
  handleCategoryChange: () => void;
  handleSearchAndCategoryChange: () => void;
  handleGridColumnsChange: () => void;
  handleRatingSettingsChange: () => void;
  handleRefresh: (fetchAll: boolean) => void;
}

export const useAppLogic = ({
  viewMode,
  currentChannelPlaylists,
  activeChannelId,
  setSearchQuery,
  setCurrentPage,
  setIsFetchAllMode,
  setSortOption,
  setGridColumns,
  setRatingSettings,
  setRefreshKey,
  removeFromCache,
  activeCategory,
  channels,
  addToCache,
  handleVideoRefresh,
  setActiveCategory,
  setIsVideoLoading,
  setNextPageUrl,
  setVideos,
}: UseAppLogicProps): UseAppLogicResult => {
  // Handle category changes
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
  }, [
    activeChannelId,
    currentChannelPlaylists,
    viewMode,
    activeCategory,
    setActiveCategory,
    setSortOption,
    setIsFetchAllMode,
    setCurrentPage,
  ]);

  // Handle search and category changes
  useEffect(() => {
    setSearchQuery('');
    setCurrentPage(1);
    if (!activeCategory) return;
    setIsFetchAllMode(false);
  }, [activeCategory, setSearchQuery, setCurrentPage, setIsFetchAllMode]);

  // Handle grid columns changes - sync setter reference for external storage access
  useEffect(() => {
    StorageService.setGridColumns(setGridColumns as unknown as 2 | 3 | 4);
  }, [setGridColumns]);

  // Handle rating settings changes - sync setter reference for external storage access
  useEffect(() => {
    StorageService.setRatingSettings(setRatingSettings as unknown as RatingSettings);
  }, [setRatingSettings]);

  const handleCategoryChange = () => {
    // This logic is handled by the useEffect above
  };

  const handleSearchAndCategoryChange = () => {
    // This logic is handled by the useEffect above
  };

  const handleGridColumnsChange = () => {
    // This logic is handled by the useEffect above
  };

  const handleRatingSettingsChange = () => {
    // This logic is handled by the useEffect above
  };

  const handleRefresh = (fetchAll: boolean = false) => {
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
  };

  return {
    handleCategoryChange,
    handleSearchAndCategoryChange,
    handleGridColumnsChange,
    handleRatingSettingsChange,
    handleRefresh,
  };
};
