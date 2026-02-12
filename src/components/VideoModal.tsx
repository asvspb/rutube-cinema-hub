import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { RutubeVideo } from '../types';
import { getEmbedUrl } from '../services/rutubeService';

interface VideoModalProps {
  video: RutubeVideo | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ video, onClose }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (video) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [video]);

  if (!video) return null;

  const embedUrl = getEmbedUrl(video.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="text-white font-semibold truncate pr-4">{video.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Player Container */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="clipboard-write; autoplay"
            allowFullScreen
          ></iframe>
        </div>

        {/* Description / Details */}
        <div className="p-6 overflow-y-auto bg-zinc-900 text-zinc-300">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {video.description || 'Описание отсутствует'}
          </p>
        </div>
      </div>

      {/* Click outside to close area */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
