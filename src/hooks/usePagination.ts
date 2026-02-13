import { useState, useMemo } from 'react';
import { RutubeVideo } from '../types';

const ITEMS_PER_PAGE = 50;

interface UsePaginationProps {
  sortedVideos: RutubeVideo[];
}

interface UsePaginationResult {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  displayedVideos: RutubeVideo[];
  handlePageChange: (page: number) => void;
  ITEMS_PER_PAGE: number;
}

export const usePagination = ({ sortedVideos }: UsePaginationProps): UsePaginationResult => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => Math.ceil(sortedVideos.length / ITEMS_PER_PAGE), [sortedVideos]);

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

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    displayedVideos,
    handlePageChange,
    ITEMS_PER_PAGE,
  };
};
