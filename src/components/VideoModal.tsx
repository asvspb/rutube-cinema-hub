import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { RutubeVideo } from '../types';
import { getEmbedUrl } from '../services/rutubeService';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface VideoModalProps {
  video: RutubeVideo | null;
  onClose: () => void;
}

// Timeout to detect if iframe fails to load (in ms)
const IFRAME_LOAD_TIMEOUT = 15000;

export const VideoModal: React.FC<VideoModalProps> = ({ video, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const focusTrapRef = useFocusTrap<HTMLDivElement>({
    isActive: !!video,
    onEscape: onClose,
    initialFocusSelector: '[data-close-button]',
  });

  const clearLoadTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    clearLoadTimeout();
    setIsLoading(false);
    setHasError(false);
  }, [clearLoadTimeout]);

  const handleIframeError = useCallback(() => {
    clearLoadTimeout();
    setIsLoading(false);
    setHasError(true);
  }, [clearLoadTimeout]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setRetryKey(prev => prev + 1);
  }, []);

  // Setup timeout to detect loading failures
  useEffect(() => {
    if (video) {
      setIsLoading(true);
      setHasError(false);

      timeoutRef.current = setTimeout(() => {
        // If still loading after timeout, show error
        setIsLoading(prev => {
          if (prev) {
            setHasError(true);
          }
          return false;
        });
      }, IFRAME_LOAD_TIMEOUT);
    }

    return () => {
      clearLoadTimeout();
    };
  }, [video, retryKey, handleIframeError, clearLoadTimeout]);

  // Reset state when video changes
  useEffect(() => {
    if (video) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [video?.id]);

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

  // Listen for postMessage errors from Rutube player (if available)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Rutube may send error messages via postMessage
      if (event.data?.type === 'error' || event.data?.error) {
        handleIframeError();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleIframeError]);

  if (!video) return null;

  const embedUrl = getEmbedUrl(video.id);
  const rutubeDirectUrl = `https://rutube.ru/video/${video.id}/`;

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
          {/* Loading Spinner */}
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-zinc-400 text-sm">Загрузка плеера...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
              <div className="flex flex-col items-center gap-4 p-6 text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <h3 className="text-white font-medium text-lg">Не удалось загрузить видео</h3>
                <p className="text-zinc-400 text-sm">
                  Возможно, видео недоступно, требует авторизации на Rutube или временно не
                  воспроизводится.
                </p>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Повторить
                  </button>
                  <a
                    href={rutubeDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Открыть на Rutube
                  </a>
                </div>
              </div>
            </div>
          )}

          <iframe
            key={retryKey}
            ref={iframeRef}
            src={embedUrl}
            title={video.title}
            className={`absolute inset-0 w-full h-full ${hasError ? 'hidden' : ''}`}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
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
