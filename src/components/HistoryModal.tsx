
import React from 'react';
import { X, Trash2, Play, Calendar, Clock } from 'lucide-react';
import { RutubeVideo } from '../types';
import { formatDuration, formatViews } from '../services/rutubeService';

interface HistoryModalProps {
  history: RutubeVideo[];
  onClose: () => void;
  onClear: () => void;
  onVideoClick: (video: RutubeVideo) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ history, onClose, onClear, onVideoClick }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 z-10">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            История просмотра
          </h2>
          <div className="flex items-center gap-2">
             {history.length > 0 && (
                <button 
                  onClick={onClear}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-red-400"
                  title="Очистить историю"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
             )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500 gap-3">
              <Clock className="w-12 h-12 opacity-50" />
              <p>История просмотров пуста</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((video, index) => (
                <div 
                  key={`${video.id}-${index}`}
                  onClick={() => onVideoClick(video)}
                  className="flex gap-4 p-3 rounded-xl hover:bg-zinc-800/50 cursor-pointer group transition-colors border border-transparent hover:border-zinc-700/50"
                >
                  {/* Thumbnail */}
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                    {/* Hover Play */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full">
                         <Play className="w-4 h-4 text-white fill-white" />
                       </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-white line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        {formatViews(video.views)}
                      </span>
                      <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(video.created_ts).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
