import { useState, useMemo } from 'react';
import { RutubeVideo, SortOption } from '../types';
import { sortVideos } from '../services/rutubeService';

interface UseFiltersProps {
  videos: RutubeVideo[];
  videoWatchedStatuses: Record<string, 'watched' | 'watch_later'>;
  videoLikedStatuses: Record<string, 'liked' | 'disliked'>;
}

interface UseFiltersResult {
  sortOption: SortOption;
  setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
  sortDirection: 'asc' | 'desc';
  setSortDirection: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  sortedVideos: RutubeVideo[];
  filteredVideos: RutubeVideo[];
  handleSortOptionClick: (optionId: SortOption) => void;
  clearSearch: () => void;
}

export const useFilters = ({
  videos,
  videoWatchedStatuses,
  videoLikedStatuses,
}: UseFiltersProps): UseFiltersResult => {
  const [sortOption, setSortOption] = useState<SortOption>('rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

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

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    sortOption,
    setSortOption,
    sortDirection,
    setSortDirection,
    searchQuery,
    setSearchQuery,
    sortedVideos,
    filteredVideos,
    handleSortOptionClick,
    clearSearch,
  };
};
