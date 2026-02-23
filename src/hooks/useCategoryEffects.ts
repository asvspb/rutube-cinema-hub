import { useEffect } from 'react';
import { CategoryDef, SortOption } from '../types';

interface UseCategoryEffectsProps {
  viewMode: 'home' | 'channel';
  currentChannelPlaylists: CategoryDef[] | undefined;
  activeCategory: CategoryDef | null;
  setActiveCategory: (category: CategoryDef | null) => void;
  setSortOption: (option: SortOption) => void;
  setIsFetchAllMode: (mode: boolean) => void;
  setCurrentPage: (page: number) => void;
  activeChannelId: string | null;
  setSearchQuery: (query: string) => void;
  setIsSearchOpen: (open: boolean) => void;
}

export const useCategoryEffects = ({
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
}: UseCategoryEffectsProps) => {
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
};
