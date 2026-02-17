import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { RutubeVideo } from '../types';
import { getEmbedUrl } from '../services/rutubeService';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface VideoModalProps {
  video: RutubeVideo | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ video, onClose }) => {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isActive: !!video,
    onEscape: onClose,
    initialFocusSelector: '[data-close-button]',
  });

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      aria-describedby="video-modal-description"
    >
      <div
        ref={focusTrapRef}
        className="relative w-full max-w-5xl bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
          <h2 id="video-modal-title" className="text-white font-semibold truncate pr-4">
            {video.title}
          </h2>
          <button
            data-close-button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
            aria-label="Закрыть видео"
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
        <div id="video-modal-description" className="p-6 overflow-y-auto bg-zinc-900 text-zinc-300">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {video.description || 'Описание отсутствует'}
          </p>
        </div>
      </div>

      {/* Click outside to close area */}
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />
    </div>
  );
};
