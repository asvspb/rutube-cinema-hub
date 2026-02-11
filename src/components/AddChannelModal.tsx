
import React, { useState } from 'react';
import { X, Tv, AlertCircle, Loader2 } from 'lucide-react';
import { parseRutubeUrl, resolveRutubeId, fetchChannelInfo } from '../services/rutubeService';

interface AddChannelModalProps {
  onClose: () => void;
  onAdd: (name: string, rutubeId: string) => void;
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const parsed = parseRutubeUrl(url);
      if (!parsed || parsed.type !== 'channel') {
        throw new Error('Пожалуйста, введите корректную ссылку на канал (rutube.ru/channel/... или rutube.ru/u/...)');
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
        throw new Error('Не удалось определить название канала автоматически. Пожалуйста, введите его вручную.');
      }

      onAdd(channelName, resolvedId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при добавлении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Tv className="w-5 h-5 text-blue-500" />
            Добавить канал в меню
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <p className="text-sm text-zinc-400 mb-2">
            Вы можете добавить другой канал Rutube в верхнее меню для быстрого переключения.
          </p>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Ссылка на канал Rutube</label>
            <div className="relative">
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="rutube.ru/channel/ID или rutube.ru/u/SLUG"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-3 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                autoFocus
                disabled={loading}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">
              Поддерживаются ссылки /channel/ID и /u/username
            </p>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Название в меню (необязательно)</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Оставьте пустым для автоопределения"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Отмена
            </button>
            <button 
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Поиск...' : 'Добавить'}
            </button>
          </div>
        </form>

      </div>
      
      <div className="absolute inset-0 -z-10" onClick={!loading ? onClose : undefined} />
    </div>
  );
};
