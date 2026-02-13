import { useMemo } from 'react';
import { ChannelDef, SortOption } from '../types';

interface UseNavigationProps {
  channels: ChannelDef[];
  viewMode: 'home' | 'channel';
  activeChannelId: string | null;
  handleChannelSelect: (id: string) => void;
  handleChannelMenuTrigger: (e: React.MouseEvent, channel: ChannelDef) => void;
  activeChannelMenuId: string | null;
  setIsAddChannelModalOpen: (open: boolean) => void;
  channelMenuRef: React.RefObject<HTMLDivElement>;
  isSearchOpen: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  isLoggedIn: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  isUserMenuOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;
  openKinoRate: () => void;
  setIsFormulaModalOpen: (open: boolean) => void;
  handleClearMetadataCache: () => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
  sortOptionsList: Array<{ id: SortOption; label: string }>;
  sortOption: SortOption;
  handleSortOptionClick: (optionId: SortOption) => void;
  sortDirection: 'asc' | 'desc';
  isSortMenuOpen: boolean;
  setIsSortMenuOpen: (open: boolean) => void;
  sortMenuRef: React.RefObject<HTMLDivElement>;
  gridOptionsList: Array<{ count: 2 | 3 | 4; label: string }>;
  gridColumns: 2 | 3 | 4;
  setGridColumns: (cols: 2 | 3 | 4) => void;
  setIsGridMenuOpen: (open: boolean) => void;
  isGridMenuOpen: boolean;
  gridMenuRef: React.RefObject<HTMLDivElement>;
  userMenuRef: React.RefObject<HTMLDivElement>;
  handleGoHome: () => void;
  handleAddChannel: () => void;
}

export const useNavigationProps = ({
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
  handleAddChannel,
}: UseNavigationProps) => {
  const navigationProps = useMemo(() => {
    return {
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
    };
  }, [
    channels,
    viewMode,
    activeChannelId,
    handleChannelSelect,
    handleChannelMenuTrigger,
    activeChannelMenuId,
    setIsAddChannelModalOpen,
    isSearchOpen,
    searchQuery,
    setSearchQuery,
    toggleSearch,
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
    gridOptionsList,
    gridColumns,
    setGridColumns,
    setIsGridMenuOpen,
    isGridMenuOpen,
    handleGoHome,
  ]);

  return navigationProps;
};
