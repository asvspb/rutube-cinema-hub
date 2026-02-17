import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Loader2,
  ListPlus,
  AlertCircle,
  Check,
  CheckSquare,
  Square,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { CategoryDef } from '../types';
import { fetchChannelPlaylists } from '../services/rutubeService';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ImportPlaylistsModalProps {
  onClose: () => void;
  onImport: (playlists: CategoryDef[]) => void;
  onManualAdd: () => void;
  channelId: string;
  existingPlaylists: CategoryDef[];
  preloadedPlaylists?: CategoryDef[]; // Optional prop for pre-fetched data
}

export const ImportPlaylistsModal: React.FC<ImportPlaylistsModalProps> = ({
  onClose,
  onImport,
  onManualAdd,
  channelId,
  existingPlaylists,
  preloadedPlaylists,
}) => {
  const [loading, setLoading] = useState(!preloadedPlaylists);
  const [error, setError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<CategoryDef[]>(preloadedPlaylists || []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [retryKey, setRetryKey] = useState(0);

  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isActive: true,
    onEscape: onClose,
    initialFocusSelector: '[data-close-button]',
  });

  const loadPlaylists = useCallback(async () => {
    // If we have preloaded data and haven't retried manually, use it.
    if (preloadedPlaylists && retryKey === 0) {
      setPlaylists(preloadedPlaylists);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetched = await fetchChannelPlaylists(channelId);
      setPlaylists(fetched);
    } catch (err) {
      console.error(err);
      setError(
        'Не удалось загрузить список плейлистов. Возможно, канал скрыл плейлисты или возникла ошибка API.'
      );
    } finally {
      setLoading(false);
    }
  }, [channelId, preloadedPlaylists, retryKey]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const handleRefresh = () => {
    setRetryKey(prev => prev + 1);
  };

  const toggleSelection = (rutubeId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(rutubeId)) {
      newSelected.delete(rutubeId);
    } else {
      newSelected.add(rutubeId);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (playlists.length === 0) return;

    // Filter out already existing ones from bulk selection
    const availablePlaylists = playlists.filter(p => !isAlreadyAdded(p.rutubeId));

    if (selectedIds.size === availablePlaylists.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(availablePlaylists.map(p => p.rutubeId));
      setSelectedIds(allIds);
    }
  };

  const handleImport = () => {
    const selected = playlists.filter(p => selectedIds.has(p.rutubeId));
    onImport(selected);
  };

  const isAlreadyAdded = (rutubeId: string) => {
    return existingPlaylists.some(p => p.rutubeId === rutubeId);
  };

  const availableCount = playlists.filter(p => !isAlreadyAdded(p.rutubeId)).length;
  const isAllSelected = availableCount > 0 && selectedIds.size === availableCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-playlists-modal-title"
    >
      <div
        ref={focusTrapRef}
        className="relative w-full max-w-lg bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col max-h-[85vh]"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 z-10">
          <div className="flex items-center gap-2">
            <h2
              id="import-playlists-modal-title"
              className="text-white font-semibold flex items-center gap-2"
            >
              <ListPlus className="w-5 h-5 text-blue-500" aria-hidden="true" />
              Импорт плейлистов
            </h2>
            <span
              className="text-xs font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded"
              title="Загружено плейлистов"
              aria-label={`Загружено плейлистов: ${loading ? 'загрузка...' : playlists.length}`}
            >
              {loading ? '...' : playlists.length}
            </span>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Обновить список"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <button
            data-close-button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto p-4 min-h-[200px]"
          role="list"
          aria-label="Список плейлистов"
        >
          {loading ? (
            <div
              className="flex flex-col items-center justify-center h-full py-12 text-zinc-500 gap-3"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" aria-hidden="true" />
              <p>Загрузка списка плейлистов...</p>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center h-full py-8 text-red-400 text-center gap-2 px-4"
            >
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
              <p>{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-sm text-blue-400 hover:underline flex items-center gap-1 mx-auto focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                <RefreshCw className="w-3 h-3" aria-hidden="true" />
                Попробовать снова
              </button>
            </div>
          ) : playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500">
              <p>Плейлисты не найдены на этом канале.</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Обновить
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {playlists.map(playlist => {
                const added = isAlreadyAdded(playlist.rutubeId);
                const selected = selectedIds.has(playlist.rutubeId);

                return (
                  <div
                    key={playlist.rutubeId}
                    onClick={() => !added && toggleSelection(playlist.rutubeId)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border border-transparent transition-all
                      ${
                        added
                          ? 'opacity-50 cursor-not-allowed bg-zinc-800/20'
                          : 'cursor-pointer hover:bg-zinc-800 hover:border-zinc-700'
                      }
                      ${selected ? 'bg-zinc-800 border-zinc-700' : ''}
                    `}
                    role="listitem"
                    tabIndex={added ? -1 : 0}
                    onKeyDown={e => {
                      if ((e.key === 'Enter' || e.key === ' ') && !added) {
                        e.preventDefault();
                        toggleSelection(playlist.rutubeId);
                      }
                    }}
                    aria-selected={selected}
                    aria-disabled={added}
                    aria-label={`${playlist.label}${added ? ' (уже добавлено)' : ''}`}
                  >
                    <div
                      className={`
                      w-5 h-5 rounded border flex items-center justify-center transition-colors
                      ${
                        added
                          ? 'bg-zinc-700 border-zinc-600 text-zinc-400'
                          : selected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-zinc-600 hover:border-zinc-400'
                      }
                    `}
                      aria-hidden="true"
                    >
                      {added ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        selected && <Check className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {playlist.label}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        {added && <span>Уже добавлено</span>}
                        {playlist.itemCount !== undefined && (
                          <span>{playlist.itemCount} видео</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 z-10 flex flex-col gap-3">
          {!loading && !error && playlists.length > 0 && (
            <div className="flex justify-between items-center gap-4 mb-1">
              <button
                onClick={toggleAll}
                className="text-sm text-zinc-400 hover:text-white flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Square className="w-4 h-4" aria-hidden="true" />
                )}
                {isAllSelected ? 'Снять выделение' : 'Выбрать все доступные'}
              </button>

              <button
                onClick={handleImport}
                disabled={selectedIds.size === 0}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              >
                Импортировать ({selectedIds.size})
              </button>
            </div>
          )}

          <button
            onClick={onManualAdd}
            className="w-full py-2.5 rounded-lg border border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Добавить плейлист вручную (ссылка)
          </button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />
    </div>
  );
};
