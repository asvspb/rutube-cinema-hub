import React from 'react';
import {
  User,
  History as HistoryIcon,
  Sparkles,
  Calculator,
  Settings,
  LogOut,
  Trash2,
  LogIn,
  Search,
  X,
  Plus,
  ChevronDown,
  MoreVertical,
  Pencil,
  Trash2 as Trash2Icon,
  Save,
  ChevronLeft,
  ListPlus,
  GripVertical,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  LayoutGrid,
} from 'lucide-react';
import { ChannelDef, SortOption } from '../types';
import { ChannelList } from './UIComponents';

interface NavigationProps {
  channels: ChannelDef[];
  viewMode: 'home' | 'channel';
  activeChannelId: string | null;
  handleChannelSelect: (channelId: string) => void;
  handleChannelMenuTrigger: (e: React.MouseEvent, channel: ChannelDef) => void;
  activeChannelMenuId: string | null;
  setIsAddChannelModalOpen: (open: boolean) => void;
  channelMenuRef: React.RefObject<HTMLDivElement>;
  handleAddChannel: () => void;
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
  sortOptionsList: { id: SortOption; label: string }[];
  sortOption: SortOption;
  handleSortOptionClick: (optionId: SortOption) => void;
  sortDirection: 'asc' | 'desc';
  isSortMenuOpen: boolean;
  setIsSortMenuOpen: (open: boolean) => void;
  sortMenuRef: React.RefObject<HTMLDivElement>;
  gridOptionsList: { count: 2 | 3 | 4; label: string }[];
  gridColumns: 2 | 3 | 4;
  setGridColumns: (columns: 2 | 3 | 4) => void;
  setIsGridMenuOpen: (open: boolean) => void;
  isGridMenuOpen: boolean;
  gridMenuRef: React.RefObject<HTMLDivElement>;
  userMenuRef: React.RefObject<HTMLDivElement>;
  handleGoHome: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  channels,
  viewMode,
  activeChannelId,
  handleChannelSelect,
  handleChannelMenuTrigger,
  activeChannelMenuId,
  setIsAddChannelModalOpen,
  channelMenuRef,
  handleAddChannel,
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
}) => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#000917]/95 backdrop-blur z-40 border-b border-zinc-800">
      <div className="absolute left-0 top-0 h-full flex items-center pl-4 md:pl-8 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-1 transition-opacity hover:opacity-80 group relative shrink-0 select-none"
            title="На главную"
          >
            <span className="text-3xl font-bold tracking-tighter text-white">Rutube</span>
            <span className="text-3xl font-bold tracking-tighter text-[#000917] bg-[#cdab8f] px-2.5 pt-1 pb-1.5 rounded-md leading-none flex items-center ml-0.5">
              kino
            </span>
          </button>
        </div>
      </div>

      <div className="w-full h-full max-w-7xl mx-auto flex items-center px-4 md:px-8">
        <div className="flex-1 min-w-0 overflow-hidden pl-52 2xl:pl-0 transition-[padding] duration-300">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-full group">
            <ChannelList
              channels={channels}
              viewMode={viewMode}
              activeChannelId={activeChannelId}
              handleChannelSelect={handleChannelSelect}
              handleChannelMenuTrigger={handleChannelMenuTrigger}
              activeChannelMenuId={activeChannelMenuId}
              setIsAddChannelModalOpen={setIsAddChannelModalOpen}
              channelMenuRef={channelMenuRef}
              handleAddChannel={handleAddChannel}
            />

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
                  flex items-center w-0 overflow-hidden transition-all duration-300
                  ${isSearchOpen ? 'w-40 sm:w-64 opacity-100 mr-2' : 'w-0 opacity-0 mr-0'}
                `}
            >
              <div className="relative w-full">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-full py-1.5 pl-4 pr-8 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-all"
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      toggleSearch();
                    }
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
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
                  ${
                    isSearchOpen
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }
                `}
              title={isSearchOpen ? 'Закрыть поиск' : 'Поиск'}
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
              {isLoggedIn ? (
                <User className="w-5 h-5 text-white fill-white" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      {isLoggedIn ? (
                        <User className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <User className="w-5 h-5 text-zinc-400" />
                      )}
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

                  <button
                    onClick={handleClearMetadataCache}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-orange-500" />
                    <span>Очистить кеш рейтингов</span>
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
  );
};
