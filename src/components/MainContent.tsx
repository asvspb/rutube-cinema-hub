import React from 'react';
import { createPortal } from 'react-dom';
import {
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
  Tv,
} from 'lucide-react';
import {
  CategoryDef,
  RutubeVideo,
  ChannelDef,
  SortOption,
  RatingSettings,
  ChannelInfo,
  MovieRatingData,
  CachedPlaylistData,
} from '../types';
import { VideoModal } from '../components/VideoModal';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { AddChannelModal } from '../components/AddChannelModal';
import { FormulaSettingsModal } from '../components/FormulaSettingsModal';
import { ImportPlaylistsModal } from '../components/ImportPlaylistsModal';
import { HistoryModal } from '../components/HistoryModal';
import { KinoRateModal } from '../components/KinoRate/KinoRateModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { NotificationModal } from '../components/NotificationModal';
import { CategoryFilter } from '../components/CategoryFilter';
import { ChannelHeader } from '../components/ChannelHeader';
import {
  VideoGrid,
  EmptyState,
  LoadingState,
  NoChannelsState,
  SortOptionsList,
  GridOptionsList,
  ChannelMenuContent,
  VideoGridSkeleton,
} from '../components/UIComponents';
import { Pagination } from '../components/Pagination';

interface MainContentProps {
  channels: ChannelDef[];
  viewMode: 'home' | 'channel';
  activeChannelId: string | null;
  handleAddChannel: (name: string, id: string) => void;
  setIsAddChannelModalOpen: (open: boolean) => void;
  activeChannel: ChannelDef | undefined;
  handleGoHome: () => void;
  channelInfo: ChannelInfo | null;
  isChannelLoading: boolean;
  currentChannelPlaylists: CategoryDef[] | undefined;
  activeCategory: CategoryDef | null;
  setActiveCategory: (category: CategoryDef | null) => void;
  videos: RutubeVideo[];
  handleRemovePlaylist: (categoryToRemove: CategoryDef) => void;
  handleRenamePlaylist: (categoryToRename: CategoryDef, newName: string) => void;
  handleRefresh: (fetchAll?: boolean) => void;
  handleReorderPlaylists: (newOrder: CategoryDef[]) => void;
  setIsAddPlaylistModalOpen: (open: boolean) => void;
  channelToImport: ChannelDef | null;
  setChannelToImport: React.Dispatch<React.SetStateAction<ChannelDef | null>>;
  displayedVideos: RutubeVideo[];
  handleVideoClick: (video: RutubeVideo) => void;
  videoWatchedStatuses: Record<string, 'watched' | 'watch_later'>;
  videoLikedStatuses: Record<string, 'liked' | 'disliked'>;
  toggleVideoWatchedStatus: (videoId: string) => void;
  toggleVideoLikedStatus: (videoId: string) => void;
  ratingSettings: RatingSettings;
  handleAnalyzeVideo: (title: string) => Promise<void>;
  loadingMetadataFor: Set<string>;
  metadataCache: Record<string, MovieRatingData>;
  getGridClass: () => string;
  currentPage: number;
  totalPages: number;
  handlePageChange: (page: number) => void;
  isVideoLoading: boolean;
  isLoadingMore: boolean;
  nextPageUrl: string | null;
  isFetchAllMode: boolean;
  handleLoadMore: () => void;
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
  selectedVideo: RutubeVideo | null;
  setSelectedVideo: (video: RutubeVideo | null) => void;
  isAddPlaylistModalOpen: boolean;
  setIsAddPlaylistModalOpenForMain: (open: boolean) => void;
  handleAddPlaylist: (name: string, rutubeId: string, type: 'channel' | 'playlist') => void;
  isAddChannelModalOpen: boolean;
  setIsAddChannelModalOpenForMain: (open: boolean) => void;
  isFormulaModalOpen: boolean;
  setIsFormulaModalOpen: (open: boolean) => void;
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;
  isKinoRateOpen: boolean;
  setIsKinoRateOpen: (open: boolean) => void;
  kinoRateQuery: string;
  setKinoRateQuery: (query: string) => void;
  kinoRateContext: string | null;
  setKinoRateContext: React.Dispatch<React.SetStateAction<string | null>>;
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
  notificationType: 'success' | 'error' | 'warning' | 'info';
  setNotificationType: React.Dispatch<
    React.SetStateAction<'success' | 'error' | 'warning' | 'info'>
  >;
  ratingSettingsForModal: RatingSettings;
  handleSettingsSave: (newSettings: RatingSettings) => void;
  allPlaylists: Record<string, CategoryDef[]>;
  channelAvailablePlaylists: CategoryDef[];
  handleImportPlaylists: (newPlaylists: CategoryDef[]) => void;
  channelToImportForModal: ChannelDef | null;
  watchHistory: RutubeVideo[];
  handleClearHistory: () => void;
  handleVideoClickForHistory: (video: RutubeVideo) => void;
  handleSaveMetadata: (newItems: MovieRatingData[], contextKey?: string) => void;
  openKinoRate: () => void;
  handleClearMetadataCache: () => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  setChannelToImportForModal: React.Dispatch<React.SetStateAction<ChannelDef | null>>;
  setIsAddChannelModalOpenForModal: (open: boolean) => void;
  setIsAddPlaylistModalOpenForModal: (open: boolean) => void;
  activeChannelMenuId: string | null;
  activeMenuChannel: ChannelDef | undefined;
  channelMenuPosition: { top: number; left: number } | null;
  isEditingChannel: boolean;
  setIsEditingChannel: (editing: boolean) => void;
  closeChannelMenu: () => void;
  handleRemoveChannel: (channelId: string) => void;
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

export const MainContent: React.FC<MainContentProps> = ({
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
  handleRemovePlaylist,
  handleRenamePlaylist,
  handleRefresh,
  handleReorderPlaylists,
  setIsAddPlaylistModalOpen,
  channelToImport,
  setChannelToImport,
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
  selectedVideo,
  setSelectedVideo,
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
  channelToImportForModal,
  watchHistory,
  handleClearHistory,
  handleVideoClickForHistory,
  handleSaveMetadata,
  openKinoRate,
  handleClearMetadataCache,
  showNotification,
  setChannelToImportForModal,
  setIsAddChannelModalOpenForModal,
  setIsAddPlaylistModalOpenForModal,
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
}) => {
  return (
    <>
      <main
        id="main-content"
        className="pt-[74px] px-4 md:px-8 pb-12 max-w-7xl mx-auto"
        role="main"
      >
        {channels.length === 0 ? (
          <NoChannelsState
            setIsAddChannelModalOpen={setIsAddChannelModalOpen}
            handleAddChannel={handleAddChannel}
          />
        ) : (
          <>
            {viewMode === 'home' && (
              <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Лента</h1>
                <p className="text-zinc-400">Последние видео с ваших каналов</p>
              </div>
            )}

            {viewMode === 'channel' && (
              <ChannelHeader
                channelInfo={channelInfo}
                isLoading={isChannelLoading}
                fallbackTitle={activeChannel?.label}
              />
            )}

            {viewMode === 'channel' && activeCategory && (
              <div className="mb-6">
                <CategoryFilter
                  categories={currentChannelPlaylists || []}
                  activeCategory={activeCategory}
                  currentLoadedCount={videos.length}
                  onSelect={setActiveCategory}
                  onAddClick={() => {
                    const channel = channels.find(c => c.id === activeChannelId);
                    if (channel) {
                      setChannelToImport(channel);
                    } else {
                      setIsAddPlaylistModalOpen(true);
                    }
                  }}
                  onRemove={handleRemovePlaylist}
                  onRename={handleRenamePlaylist}
                  onRefresh={handleRefresh}
                  onReorder={handleReorderPlaylists}
                />
              </div>
            )}

            {(viewMode === 'home' || (viewMode === 'channel' && activeCategory)) && (
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sticky top-16 z-30 bg-[#000917]/95 py-2 backdrop-blur-sm -mx-4 px-4 md:-mx-8 md:px-8 border-b border-zinc-800/50">
                <div className="text-zinc-400 text-sm font-medium">{videos.length} видео</div>

                <div className="flex items-center gap-3">
                  <div className="relative" ref={sortMenuRef}>
                    <button
                      onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {sortOptionsList.find(o => o.id === sortOption)?.label}
                      </span>
                    </button>
                    {isSortMenuOpen && (
                      <SortOptionsList
                        sortOptionsList={sortOptionsList}
                        sortOption={sortOption}
                        handleSortOptionClick={handleSortOptionClick}
                        sortDirection={sortDirection}
                      />
                    )}
                  </div>

                  <div className="relative hidden sm:block" ref={gridMenuRef}>
                    <button
                      onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
                      className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    {isGridMenuOpen && (
                      <GridOptionsList
                        gridOptionsList={gridOptionsList}
                        gridColumns={gridColumns}
                        setGridColumns={setGridColumns}
                        setIsGridMenuOpen={setIsGridMenuOpen}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {(isVideoLoading || isChannelLoading) && !isLoadingMore ? (
              <VideoGridSkeleton gridColumns={gridColumns} />
            ) : displayedVideos.length === 0 ? (
              <EmptyState viewMode={viewMode} handleRefresh={handleRefresh} />
            ) : (
              <>
                <VideoGrid
                  displayedVideos={displayedVideos}
                  handleVideoClick={handleVideoClick}
                  videoWatchedStatuses={videoWatchedStatuses}
                  videoLikedStatuses={videoLikedStatuses}
                  toggleVideoWatchedStatus={toggleVideoWatchedStatus}
                  toggleVideoLikedStatus={toggleVideoLikedStatus}
                  ratingSettings={ratingSettings}
                  handleAnalyzeVideo={handleAnalyzeVideo}
                  loadingMetadataFor={loadingMetadataFor}
                  metadataCache={metadataCache}
                  getGridClass={getGridClass}
                />

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />

                {nextPageUrl && !isFetchAllMode && viewMode === 'channel' && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isLoadingMore ? 'Загрузка...' : 'Загрузить еще'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {activeChannelMenuId &&
        activeMenuChannel &&
        channelMenuPosition &&
        createPortal(
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div
              ref={channelMenuRef}
              className="absolute bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-150 w-64 origin-top"
              style={{ top: channelMenuPosition.top, left: channelMenuPosition.left }}
            >
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  {isEditingChannel && (
                    <button
                      onClick={() => setIsEditingChannel(false)}
                      className="mr-1 text-zinc-400 hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <h2 className="text-white font-medium truncate text-xs uppercase tracking-wider text-zinc-500">
                    {isEditingChannel ? 'Переименовать канал' : 'Действия с каналом'}
                  </h2>
                </div>
              </div>
              <ChannelMenuContent
                activeMenuChannel={activeMenuChannel}
                isEditingChannel={isEditingChannel}
                setIsEditingChannel={setIsEditingChannel}
                isChannelLoading={isChannelLoading}
                channelAvailablePlaylists={channelAvailablePlaylists}
                setChannelToImport={setChannelToImportForModal}
                closeChannelMenu={closeChannelMenu}
                handleRemoveChannel={handleRemoveChannel}
                channelEditName={channelEditName}
                setChannelEditName={setChannelEditName}
                channelInputRef={channelInputRef}
                handleRenameChannelSave={handleRenameChannelSave}
                availablePlaylistsByChannel={availablePlaylistsByChannel}
                loadAvailablePlaylistsForChannel={loadAvailablePlaylistsForChannel}
                loadingPlaylistsForChannel={loadingPlaylistsForChannel}
              />
            </div>
          </div>,
          document.body
        )}

      {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}

      {isAddPlaylistModalOpen && (
        <AddCategoryModal
          onClose={() => setIsAddPlaylistModalOpenForMain(false)}
          onAdd={handleAddPlaylist}
        />
      )}

      {isAddChannelModalOpen && (
        <AddChannelModal
          onClose={() => setIsAddChannelModalOpenForMain(false)}
          onAdd={handleAddChannel}
        />
      )}

      {isFormulaModalOpen && (
        <FormulaSettingsModal
          settings={ratingSettingsForModal}
          videos={videos}
          onClose={() => setIsFormulaModalOpen(false)}
          onSave={handleSettingsSave}
        />
      )}

      {channelToImportForModal && (
        <ImportPlaylistsModal
          channelId={channelToImportForModal.rutubeId}
          existingPlaylists={allPlaylists[channelToImportForModal.id] || []}
          preloadedPlaylists={
            channelToImportForModal.id === activeChannelId ? channelAvailablePlaylists : undefined
          }
          onClose={() => setChannelToImportForModal(null)}
          onImport={handleImportPlaylists}
          onManualAdd={() => {
            setChannelToImportForModal(null);
            setIsAddPlaylistModalOpenForModal(true);
          }}
        />
      )}

      {isHistoryModalOpen && (
        <HistoryModal
          history={watchHistory}
          onClose={() => setIsHistoryModalOpen(false)}
          onClear={handleClearHistory}
          onVideoClick={handleVideoClickForHistory}
        />
      )}

      {isKinoRateOpen && (
        <KinoRateModal
          initialQuery={kinoRateQuery}
          contextKey={kinoRateContext}
          onClose={() => setIsKinoRateOpen(false)}
          onSaveMetadata={handleSaveMetadata} // Pass save callback
        />
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          message={confirmMessage}
          onConfirm={() => {
            if (confirmCallback) confirmCallback();
            setIsConfirmModalOpen(false);
          }}
          onCancel={() => setIsConfirmModalOpen(false)}
        />
      )}

      {/* Notification Modal */}
      {isNotificationModalOpen && (
        <NotificationModal
          isOpen={isNotificationModalOpen}
          message={notificationMessage}
          type={notificationType}
          onClose={() => setIsNotificationModalOpen(false)}
        />
      )}
    </>
  );
};
