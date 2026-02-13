import { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { SortOption, RatingSettings } from '../types';

interface UseSortingAndGridProps {
  ratingSettings: RatingSettings;
  setRatingSettings: (settings: RatingSettings) => void;
}

export const useSortingAndGrid = ({
  ratingSettings,
  setRatingSettings,
}: UseSortingAndGridProps) => {
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(() => StorageService.getGridColumns());
  const [sortOption, setSortOption] = useState<SortOption>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle grid columns changes
  useEffect(() => {
    StorageService.setGridColumns(gridColumns);
  }, [gridColumns]);

  // Handle rating settings changes
  useEffect(() => {
    StorageService.setRatingSettings(ratingSettings);
  }, [ratingSettings]);

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

  const sortOptionsList: Array<{ id: SortOption; label: string }> = [
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

  const gridOptionsList: Array<{ count: 2 | 3 | 4; label: string }> = [
    { count: 2, label: '2 колонки' },
    { count: 3, label: '3 колонки' },
    { count: 4, label: '4 колонки' },
  ];

  return {
    gridColumns,
    setGridColumns,
    sortOption,
    setSortOption,
    sortDirection,
    setSortDirection,
    handleSortOptionClick,
    sortOptionsList,
    gridOptionsList,
  };
};
