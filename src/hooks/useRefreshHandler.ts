import { useState, useCallback } from 'react';
import { CategoryDef } from '../types';
import { useVideoLogic } from './useVideoLogic';

interface UseRefreshHandlerProps {
  viewMode: 'home' | 'channel';
  activeCategory: CategoryDef | null;
  handleVideoRefresh: (fetchAll: boolean) => void;
  setCurrentPage: (page: number) => void;
  removeFromCache: (key: string) => void;
}

export const useRefreshHandler = ({
  viewMode,
  activeCategory,
  handleVideoRefresh,
  setCurrentPage,
  removeFromCache,
}: UseRefreshHandlerProps) => {
  const [refreshKey, setRefreshKey] = useState(0);

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

  return {
    refreshKey,
    handleRefresh,
  };
};
