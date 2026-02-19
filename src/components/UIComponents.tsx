import React, { useCallback, memo } from 'react';
import {
  Tv,
  PlayCircle,
  Info,
  Loader2,
  PlusCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Heart,
  History as HistoryIcon,
  Search,
  X,
  Plus,
  Calculator,
  LayoutGrid,
  MoreVertical,
  Pencil,
  Trash2,
  Save,
  ChevronLeft,
  ListPlus,
  GripVertical,
  ChevronRight,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import {
  CategoryDef,
  RutubeVideo,
  ChannelDef,
  SortOption,
  RatingSettings,
  MovieRatingData,
} from '../types';
import VideoCard from '../components/VideoCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { ChannelHeader } from '../components/ChannelHeader';
import { Pagination } from '../components/Pagination';
import { RecommendedChannelCard } from '../components/RecommendedChannelCard';

interface ChannelListProps {
  channels: ChannelDef[];
  viewMode: 'home' | 'channel';
  activeChannelId: string | null;
  handleChannelSelect: (channelId: string) => void;
  handleChannelMenuTrigger: (e: React.MouseEvent, channel: ChannelDef) => void;
  activeChannelMenuId: string | null;
  setIsAddChannelModalOpen: (open: boolean) => void;
  channelMenuRef: React.RefObject<HTMLDivElement>;
  handleAddChannel: () => void;
  setChannels: React.Dispatch<React.SetStateAction<ChannelDef[]>>;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  viewMode,
  activeChannelId,
  handleChannelSelect,
  handleChannelMenuTrigger,
  activeChannelMenuId,
  setIsAddChannelModalOpen,
  channelMenuRef,
  handleAddChannel,
  setChannels,
}) => {
  return (
    <Reorder.Group
      axis="x"
      values={channels}
      onReorder={setChannels}
      className="flex flex-row flex-nowrap items-center gap-2"
    >
      {channels.map(channel => {
        const isActive = viewMode === 'channel' && channel.id === activeChannelId;
        const isMenuOpen = activeChannelMenuId === channel.id;

        return (
          <Reorder.Item
            key={channel.id}
            value={channel}
            whileDrag={{ scale: 1.05 }}
            className="relative shrink-0"
          >
            <div className="group/channel relative h-full flex items-center">
              <button
                onClick={() => handleChannelSelect(channel.id)}
                className={`
                  relative
                  flex items-center justify-center
                  h-10 rounded-lg text-sm font-bold whitespace-nowrap
                  transition-all duration-300 ease-out select-none
                  cursor-pointer
                  ${
                    isActive
                      ? 'bg-[#cdab8f] text-[#000917] shadow-lg shadow-[#cdab8f]/20 px-4 group-hover/channel:pl-10 group-hover/channel:pr-10'
                      : 'bg-zinc-800 text-zinc-400 px-4 hover:bg-[#cdab8f] hover:text-[#000917] hover:pl-10 hover:pr-10'
                  }
                `}
              >
                {/* --- ЛЕВАЯ ИКОНКА (Drag Handle / 6 точек) --- */}
                <div
                  className={`
                  absolute left-1 top-1/2 -translate-y-1/2
                  w-6 h-6 flex items-center justify-center
                  transition-all duration-200
                  opacity-0 scale-75 group-hover/channel:opacity-60 group-hover/channel:scale-100
                `}
                >
                  <GripVertical
                    className={`w-3.5 h-3.5 ${isActive ? 'text-[#000917]' : 'text-zinc-500'}`}
                  />
                </div>

                {/* --- ТЕКСТ КНОПКИ --- */}
                <span className="z-10 truncate max-w-[120px] px-2">{channel.label}</span>

                {/* --- ПРАВАЯ ИКОНКА (Меню / 3 точки) --- */}
                <div
                  role="button"
                  tabIndex={0}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    handleChannelMenuTrigger(e, channel);
                  }}
                  onKeyDown={e =>
                    e.key === 'Enter' &&
                    handleChannelMenuTrigger(e as unknown as React.MouseEvent, channel)
                  }
                  className={`
                    absolute right-0.5 top-1/2 -translate-y-1/2
                    w-4 h-4 flex items-center justify-center
                    rounded-full hover:bg-black/10 transition-all duration-200
                    cursor-pointer z-20
                    focus:outline-none
                    opacity-0 scale-75 group-hover/channel:opacity-100 group-hover/channel:scale-100
                  `}
                  aria-label="Меню"
                  aria-haspopup="menu"
                >
                  <MoreVertical
                    className={`w-3 h-3 ${isActive ? 'text-[#000917]' : 'text-inherit'}`}
                  />
                </div>
              </button>
            </div>
          </Reorder.Item>
        );
      })}
    </Reorder.Group>
  );
};

interface VideoGridProps {
  displayedVideos: RutubeVideo[];
  handleVideoClick: (video: RutubeVideo) => void;
  videoWatchedStatuses: Record<string, 'watched' | 'watch_later'>;
  videoLikedStatuses: Record<string, 'liked' | 'disliked'>;
  toggleVideoWatchedStatus: (videoId: string) => void;
  toggleVideoLikedStatus: (videoId: string) => void;
  ratingSettings: any; // Using any temporarily
  handleAnalyzeVideo: (title: string) => Promise<void>;
  loadingMetadataFor: Set<string>;
  metadataCache: any; // Using any temporarily
  getGridClass: () => string;
}

export const VideoGrid: React.FC<VideoGridProps> = memo(
  ({
    displayedVideos,
    handleVideoClick,
    videoWatchedStatuses,
    videoLikedStatuses,
    toggleVideoWatchedStatus,
    toggleVideoLikedStatus,
    ratingSettings,
    handleAnalyzeVideo,
    loadingMetadataFor,
    metadataCache,
    getGridClass,
  }) => {
    return (
      <div className={getGridClass()}>
        {displayedVideos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={handleVideoClick}
            watchedStatus={videoWatchedStatuses[video.id]}
            likedStatus={videoLikedStatuses[video.id]}
            onWatchedToggle={() => toggleVideoWatchedStatus(video.id)}
            onLikedToggle={() => toggleVideoLikedStatus(video.id)}
            ratingSettings={ratingSettings}
            onAnalyze={handleAnalyzeVideo}
            isLoadingMetadata={loadingMetadataFor.has(video.title)}
            externalMetadata={metadataCache}
          />
        ))}
      </div>
    );
  }
);

interface EmptyStateProps {
  viewMode: 'home' | 'channel';
  handleRefresh: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ viewMode, handleRefresh }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
        <PlayCircle className="w-8 h-8 opacity-50" />
      </div>
      <h3 className="text-lg font-medium text-white mb-1">Видео не найдены</h3>
      <p className="max-w-xs text-center text-sm">
        В этом плейлисте пока нет видео или они не загрузились.
      </p>
      {viewMode === 'channel' && (
        <button
          onClick={handleRefresh}
          className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Обновить
        </button>
      )}
    </div>
  );
};

interface LoadingStateProps {
  isLoadingMore: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ isLoadingMore }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
      <p>Загрузка видео...</p>
    </div>
  );
};

interface RecommendedChannelsSectionProps {
  handleAddChannel: (name: string, id: string) => void;
}

export const RecommendedChannelsSection: React.FC<RecommendedChannelsSectionProps> = ({
  handleAddChannel,
}) => {
  const RECOMMENDED_CHANNELS = [
    { id: '32869212', label: 'Смотри кино', color: 'bg-gradient-to-br from-orange-500 to-red-600' },
    { id: '32181632', label: 'Фильмач', color: 'bg-gradient-to-br from-purple-600 to-indigo-900' },
    { id: '36921062', label: 'Синемач', color: 'bg-gradient-to-br from-pink-500 to-rose-600' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-8 w-full px-4">
      {RECOMMENDED_CHANNELS.map(channel => (
        <RecommendedChannelCard
          key={channel.id}
          id={channel.id}
          label={channel.label}
          color={channel.color}
          onClick={() => handleAddChannel(channel.label, channel.id)}
        />
      ))}
    </div>
  );
};

interface NoChannelsStateProps {
  setIsAddChannelModalOpen: (open: boolean) => void;
  handleAddChannel: (name: string, id: string) => void;
}

export const NoChannelsState: React.FC<NoChannelsStateProps> = ({
  setIsAddChannelModalOpen,
  handleAddChannel,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <div className="w-full max-w-3xl bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center text-center mb-[10px]">
        <Tv className="w-16 h-16 mb-4 opacity-50 text-blue-500" />
        <h3 className="text-xl font-medium text-white mb-2">Список каналов пуст</h3>
        <p className="max-w-md px-4 mb-8 text-zinc-400">
          Добавьте свой любимый канал Rutube или выберите один из рекомендованных, чтобы начать
          просмотр.
        </p>

        <button
          onClick={() => setIsAddChannelModalOpen(true)}
          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium mb-8 border border-zinc-700"
        >
          <PlusCircle className="w-5 h-5" />
          Добавить по ссылке
        </button>

        <div className="w-full flex items-center gap-4 mb-8">
          <div className="h-px bg-zinc-800 flex-1" />
          <span className="text-sm text-zinc-500 uppercase tracking-wider">Рекомендуемые</span>
          <div className="h-px bg-zinc-800 flex-1" />
        </div>

        <RecommendedChannelsSection handleAddChannel={handleAddChannel} />
      </div>
    </div>
  );
};

interface SortOptionsListProps {
  sortOptionsList: { id: SortOption; label: string }[];
  sortOption: SortOption;
  handleSortOptionClick: (optionId: SortOption) => void;
  sortDirection: 'asc' | 'desc';
}

export const SortOptionsList: React.FC<SortOptionsListProps> = ({
  sortOptionsList,
  sortOption,
  handleSortOptionClick,
  sortDirection,
}) => {
  return (
    <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
      {sortOptionsList.map(opt => (
        <button
          key={opt.id}
          onClick={() => handleSortOptionClick(opt.id)}
          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-zinc-800 transition-colors ${sortOption === opt.id ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-300'}`}
        >
          <span>{opt.label}</span>
          {sortOption === opt.id &&
            (sortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5" />
            ))}
        </button>
      ))}
    </div>
  );
};

interface GridOptionsListProps {
  gridOptionsList: { count: 2 | 3 | 4; label: string }[];
  gridColumns: 2 | 3 | 4;
  setGridColumns: (columns: 2 | 3 | 4) => void;
  setIsGridMenuOpen: (open: boolean) => void;
}

export const GridOptionsList: React.FC<GridOptionsListProps> = ({
  gridOptionsList,
  gridColumns,
  setGridColumns,
  setIsGridMenuOpen,
}) => {
  return (
    <div className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
      {gridOptionsList.map(opt => (
        <button
          key={opt.count}
          onClick={() => {
            setGridColumns(opt.count);
            setIsGridMenuOpen(false);
          }}
          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-zinc-800 transition-colors ${gridColumns === opt.count ? 'text-blue-400 bg-blue-400/10' : 'text-zinc-300'}`}
        >
          <span>{opt.label}</span>
          {gridColumns === opt.count && <Check className="w-3.5 h-3.5" />}
        </button>
      ))}
    </div>
  );
};

interface ChannelMenuContentProps {
  activeMenuChannel: ChannelDef | undefined;
  isEditingChannel: boolean;
  setIsEditingChannel: (editing: boolean) => void;
  isChannelLoading: boolean;
  channelAvailablePlaylists: CategoryDef[];
  setChannelToImport: (channel: ChannelDef | null) => void;
  closeChannelMenu: () => void;
  handleRemoveChannel: (channelId: string) => void;
  channelEditName: string;
  setChannelEditName: (name: string) => void;
  channelInputRef: React.RefObject<HTMLInputElement>;
  handleRenameChannelSave: () => void;
}

export const ChannelMenuContent: React.FC<ChannelMenuContentProps> = ({
  activeMenuChannel,
  isEditingChannel,
  setIsEditingChannel,
  isChannelLoading,
  channelAvailablePlaylists,
  setChannelToImport,
  closeChannelMenu,
  handleRemoveChannel,
  channelEditName,
  setChannelEditName,
  channelInputRef,
  handleRenameChannelSave,
}) => {
  return (
    <div className="p-1.5 bg-zinc-900">
      {!isEditingChannel ? (
        <>
          <button
            onClick={() => {
              if (activeMenuChannel) {
                setChannelToImport(activeMenuChannel);
              }
              closeChannelMenu();
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
          >
            <ListPlus className="w-4 h-4 text-zinc-400" />
            <span>Импорт плейлистов</span>
            <span
              className="ml-auto text-xs font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded"
              title="Загружено плейлистов с Rutube"
            >
              {isChannelLoading ? '...' : channelAvailablePlaylists.length}
            </span>
          </button>

          <button
            onClick={() => setIsEditingChannel(true)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 transition-colors"
          >
            <Pencil className="w-4 h-4 text-zinc-400" />
            <span>Переименовать</span>
          </button>

          <div className="h-px bg-zinc-800 my-1.5 mx-1" />
          <button
            onClick={() => activeMenuChannel && handleRemoveChannel(activeMenuChannel.id)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 flex items-center gap-3 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Удалить канал</span>
          </button>
        </>
      ) : (
        <div className="p-2 flex flex-col gap-2">
          <input
            ref={channelInputRef}
            type="text"
            value={channelEditName}
            onChange={e => setChannelEditName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRenameChannelSave()}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            placeholder="Название"
          />
          <button
            onClick={handleRenameChannelSave}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Сохранить
          </button>
        </div>
      )}
    </div>
  );
};
