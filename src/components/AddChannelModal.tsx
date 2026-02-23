import React, { useState } from 'react';
import { X, Tv, AlertCircle, Loader2 } from 'lucide-react';
import { parseRutubeUrl, resolveRutubeId, fetchChannelInfo } from '../services/rutubeService';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface AddChannelModalProps {
  onClose: () => void;
  onAdd: (name: string, rutubeId: string) => void;
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isActive: true,
    onEscape: () => !loading && onClose(),
    initialFocusSelector: '[data-url-input]',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parsed = parseRutubeUrl(url);
      if (!parsed || parsed.type !== 'channel') {
        throw new Error(
          'Пожалуйста, введите корректную ссылку на канал (rutube.ru/channel/... или rutube.ru/u/...)'
        );
      }

      const resolvedId = await resolveRutubeId(parsed.id, parsed.type);
      if (!resolvedId) {
        throw new Error('Не удалось найти канал. Возможно, неверная ссылка или канал недоступен.');
      }

      let channelName = name.trim();

      // Если имя не введено, пробуем получить его автоматически
      if (!channelName) {
        try {
          const info = await fetchChannelInfo(resolvedId);
          if (info && info.title) {
            channelName = info.title;
          }
        } catch (e) {
          console.warn('Failed to auto-fetch channel name', e);
        }
      }

      if (!channelName) {
        throw new Error(
          'Не удалось определить название канала автоматически. Пожалуйста, введите его вручную.'
        );
      }

      onAdd(channelName, resolvedId);
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при добавлении';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-channel-modal-title"
    >
      <div
        ref={focusTrapRef}
        className="relative w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2
            id="add-channel-modal-title"
            className="text-white font-semibold flex items-center gap-2"
          >
            <Tv className="w-5 h-5 text-blue-500" aria-hidden="true" />
            Добавить канал в меню
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
            disabled={loading}
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <p className="text-sm text-zinc-400 mb-2">
            Вы можете добавить другой канал Rutube в верхнее меню для быстрого переключения.
          </p>

          <div>
            <label htmlFor="channel-url" className="block text-sm text-zinc-400 mb-1.5">
              Ссылка на канал Rutube
            </label>
            <div className="relative">
              <input
                id="channel-url"
                data-url-input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="rutube.ru/channel/ID или rutube.ru/u/SLUG"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-3 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                autoFocus
                disabled={loading}
                aria-describedby="channel-url-hint"
              />
            </div>
            <p id="channel-url-hint" className="text-xs text-zinc-500 mt-1.5">
              Поддерживаются ссылки /channel/ID и /u/username
            </p>
          </div>

          <div>
            <label htmlFor="channel-name" className="block text-sm text-zinc-400 mb-1.5">
              Название в меню (необязательно)
            </label>
            <input
              id="channel-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Оставьте пустым для автоопределения"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {loading ? 'Поиск...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>

      <div
        className="absolute inset-0 -z-10"
        onClick={!loading ? onClose : undefined}
        aria-hidden="true"
      />
    </div>
  );
};
