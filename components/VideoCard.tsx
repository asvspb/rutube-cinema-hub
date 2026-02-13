
import React, { useMemo } from 'react';
import { Play, Star, Flame, Check, Heart, Clock, Trophy, TrendingUp, Sparkles, Loader2, Crown, ThumbsDown } from 'lucide-react';
import { RutubeVideo, RatingSettings, MovieRatingData } from '../types';
import { formatDuration, formatViews, formatRelativeTime } from '../services/rutubeService';

interface VideoCardProps {
  video: RutubeVideo;
  onClick: (video: RutubeVideo) => void;
  watchedStatus?: 'watched' | 'watch_later';
  likedStatus?: 'liked' | 'disliked';
  onWatchedToggle?: () => void;
  onLikedToggle?: () => void;
  ratingSettings?: RatingSettings;
  onAnalyze?: (title: string) => Promise<void>;
  externalMetadata?: Record<string, MovieRatingData>; // Global cache
  isLoadingMetadata?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, watchedStatus, likedStatus, onWatchedToggle, onLikedToggle, ratingSettings, onAnalyze, externalMetadata, isLoadingMetadata }) => {
  
  // Resolve external data from the global cache using the video title
  const externalData = useMemo(() => {
    if (!externalMetadata || !video.title) return null;
    return externalMetadata[video.title] || null;
  }, [externalMetadata, video.title]);

  // Determine if video is "Hot" based on Gravity
  const isHot = (video.gravity || 0) > 2.0;

  const handleWatchedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWatchedToggle) onWatchedToggle();
  };

  const handleLikedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLikedToggle) onLikedToggle();
  };

  const handleCheckExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAnalyze) {
      onAnalyze(video.title);
    }
  };

  // Watched Status Icon Logic
  let WatchedIcon = Clock;
  let watchedColorClass = "text-zinc-400 group-hover/btn:text-white";
  let watchedContainerVisibleClass = "opacity-0 group-hover:opacity-100";
  let watchedButtonBgClass = "bg-black/60 hover:bg-zinc-800/80";

  // AI button should only be visible on hover
  const aiContainerVisibleClass = "opacity-0 group-hover:opacity-100";

  if (watchedStatus === 'watched') {
    WatchedIcon = Check;
    watchedColorClass = "text-green-500";
    watchedContainerVisibleClass = "opacity-100";
    watchedButtonBgClass = "bg-green-500/10 hover:bg-green-500/20";
  } else if (watchedStatus === 'watch_later') {
    WatchedIcon = Clock;
    watchedColorClass = "text-blue-400";
    watchedContainerVisibleClass = "opacity-100";
    watchedButtonBgClass = "bg-blue-500/10 hover:bg-blue-500/20";
  }

  // Liked Status Icon Logic
  let LikedIcon = Heart;
  let likedColorClass = "text-zinc-400 group-hover/btn:text-white";
  let likedContainerVisibleClass = "opacity-0 group-hover:opacity-100";
  let likedButtonBgClass = "bg-black/60 hover:bg-zinc-800/80";

  if (likedStatus === 'liked') {
    LikedIcon = Heart;
    likedColorClass = "text-red-500 fill-red-500";
    likedContainerVisibleClass = "opacity-100";
    likedButtonBgClass = "bg-red-500/10 hover:bg-red-500/20";
  } else if (likedStatus === 'disliked') {
    LikedIcon = ThumbsDown;
    likedColorClass = "text-gray-400";
    likedContainerVisibleClass = "opacity-100";
    likedButtonBgClass = "bg-gray-500/10 hover:bg-gray-500/20";
  }

  const getAgeText = () => {
    try {
      const created = new Date(video.created_ts);
      if (isNaN(created.getTime())) return '-';
      const now = new Date();
      const diff = now.getTime() - created.getTime();
      const days = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
      if (days < 1) return 'менее дня';
      return `${days} дн.`;
    } catch(e) { return '-'; }
  };
  
  const getWatchedTooltipText = () => {
    if (watchedStatus === 'watched') return 'Просмотрено';
    if (watchedStatus === 'watch_later') return 'Посмотреть позже';
    return 'Просмотрено';
  };

  const getNextWatchedStatusText = () => {
    if (!watchedStatus) return 'Следующий: Просмотрено';
    if (watchedStatus === 'watched') return 'Следующий: Посмотреть позже';
    if (watchedStatus === 'watch_later') return 'Следующий: Убрать отметку';
    return 'Следующий: Просмотрено';
  };

  const getLikedTooltipText = () => {
    if (likedStatus === 'liked') return 'Нравится';
    if (likedStatus === 'disliked') return 'Не нравится';
    return 'Нравится';
  };

  const getNextLikedStatusText = () => {
    if (!likedStatus) return 'Следующий: Нравится';
    if (likedStatus === 'liked') return 'Следующий: Не нравится';
    if (likedStatus === 'disliked') return 'Следующий: Убрать оценку';
    return 'Следующий: Нравится';
  };

  const isExperimental = ratingSettings?.useExperimentalStrategy;
  const rawRating = typeof video.rating === 'number' && !isNaN(video.rating) ? video.rating : 0;
  
  const imdbRating = externalData?.imdbRating || 0;
  const kpRating = externalData?.kpRating || 0;
  
  // Use the highest available rating for display logic
  const bestExternalRating = Math.max(imdbRating, kpRating);
  const isBoosted = bestExternalRating > rawRating;
  const displayRating = isBoosted ? bestExternalRating : rawRating;

  const getRatingColor = (r: number) => {
    if (r >= 8.0) return 'bg-purple-600 text-white';
    if (r >= 7.0) return 'bg-green-600 text-white';
    if (r >= 5.0) return 'bg-yellow-600 text-white';
    return 'bg-red-600 text-white';
  };

  // External Badges Logic
  const checkAwards = (awards: string[] | undefined, term: string) => {
    if (!awards) return false;
    return awards.some(a => a.toLowerCase().includes(term.toLowerCase()));
  };

  const wonOscar = checkAwards(externalData?.awards, 'Oscar Won') || checkAwards(externalData?.awards, 'Won Oscar');
  const nominatedOscar = !wonOscar && (checkAwards(externalData?.awards, 'Oscar Nominated') || checkAwards(externalData?.awards, 'Nominated to Oscar'));

  return (
    <div 
      className="group cursor-pointer flex flex-col gap-3"
      onClick={() => onClick(video)}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 shadow-lg group-hover:shadow-blue-900/20 transition-all duration-300">
        <img 
          src={video.thumbnail_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiA5IiBmaWxsPSIjMzMzIj48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iOSIvPjwvc3ZnPg=='} 
          alt={video.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

        {/* Rating and Like/Dislike Container (Top Left) */}
        <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
            {/* Internal Rating and Like/Dislike Button in one row */}
            <div className="flex items-center gap-1">
              {/* Internal Rating */}
              <div className="relative group/rating">
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold shadow-sm cursor-help transition-colors duration-300 ${getRatingColor(displayRating)}`}>
                    {isBoosted ? <TrendingUp className="w-3 h-3" /> : <Star className="w-3 h-3 fill-current" />}
                    <span>{displayRating.toFixed(1)}</span>
                </div>

                {/* Rating Tooltip */}
                <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-lg p-3 shadow-2xl opacity-0 group-hover/rating:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover/rating:translate-y-0 text-left z-30">
                    <div className="text-xs font-bold text-white mb-1 flex items-center gap-1">
                      {isBoosted ? <TrendingUp className="w-3 h-3 text-purple-400" /> : <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                      Рейтинг {displayRating.toFixed(1)}
                    </div>

                    {isBoosted ? (
                      <div className="text-[10px] text-purple-300 mb-2 leading-tight">
                          Рейтинг повышен до уровня {imdbRating > kpRating ? 'IMDb' : 'KP'} ({bestExternalRating}), так как внутренний рейтинг ({rawRating.toFixed(1)}) ниже.
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-400 mb-2 leading-tight">
                          {isExperimental
                          ? 'Пороговый рейтинг. Зависит от общего количества просмотров.'
                          : 'Динамический рейтинг. Зависит от скорости набора просмотров.'}
                      </div>
                    )}

                    <div className="bg-zinc-800/50 rounded p-1.5 space-y-1">
                      <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-500">Просмотры:</span>
                          <span className="text-zinc-300 font-mono">{formatViews(video.views)}</span>
                      </div>
                      {!isExperimental && (
                          <div className="flex justify-between text-[10px]">
                              <span className="text-zinc-500">Возраст:</span>
                              <span className="text-zinc-300 font-mono">{getAgeText()}</span>
                          </div>
                      )}
                    </div>
                </div>
              </div>

              {/* Like/Dislike Button with Tooltip */}
              <div className={`flex flex-col items-start group/liked ${likedContainerVisibleClass} transition-opacity duration-200`}>
                <div className="absolute top-full mt-2 left-0 px-2.5 py-1.5 w-56 bg-zinc-900/95 border border-zinc-700 rounded-lg text-xs font-medium text-white shadow-xl backdrop-blur-md whitespace-nowrap opacity-0 group-hover/liked:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="font-bold">{getLikedTooltipText()}</div>
                  <div className="text-[10px] text-zinc-400 font-normal mt-0.5">{getNextLikedStatusText()}</div>
                  <div className="absolute bottom-full left-4 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-zinc-700" />
                </div>

                <button
                  onClick={handleLikedClick}
                  className={`p-1.5 rounded-full ${likedButtonBgClass} backdrop-blur-sm transition-all duration-200 group/btn shadow-sm ring-1 ring-transparent hover:ring-white/20`}
                >
                  <LikedIcon className={`w-4 h-4 ${likedColorClass}`} />
                </button>
              </div>
            </div>

            {/* External Check Button / Badges */}
            <div className="flex flex-col gap-1 items-start">
              {externalData && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col gap-1 items-start">
                    {externalData.imdbRating > 0 && (
                      <div className="relative group/imdb-tooltip">
                        {externalData.imdbUrl ? (
                          <a
                            href={externalData.imdbUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-1.5 py-0.5 rounded-md bg-[#f5c518] text-black text-[10px] font-bold shadow-sm flex items-center gap-1 justify-center w-fit hover:bg-[#e6b800] transition-colors group/imdb relative"
                          >
                            {externalData.dataSource === 'local' && (
                              <>
                                <Crown className="w-3 h-3 text-blue-900 fill-blue-900" />
                              </>
                            )}
                            {externalData.dataSource === 'local' ? 'Top IMDB' : 'IMDB'} {externalData.imdbRating}
                          </a>
                        ) : (
                          <div className="px-1.5 py-0.5 rounded-md bg-[#f5c518] text-black text-[10px] font-bold shadow-sm flex items-center gap-1 justify-center w-fit group/imdb relative">
                            {externalData.dataSource === 'local' && (
                              <>
                                <Crown className="w-3 h-3 text-blue-900 fill-blue-900" />
                              </>
                            )}
                            {externalData.dataSource === 'local' ? 'Top IMDB' : 'IMDB'} {externalData.imdbRating}
                          </div>
                        )}

                        {/* IMDB Tooltip */}
                        <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-lg p-3 shadow-2xl opacity-0 group-hover/imdb-tooltip:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover/imdb-tooltip:translate-y-0 text-left z-30">
                            <div className="text-xs font-bold text-[#f5c518] mb-1 flex items-center gap-1">
                              <span className="inline-block w-3 h-3 rounded-sm bg-[#f5c518] text-black text-[8px] flex items-center justify-center font-bold">IM</span>
                              IMDB
                            </div>
                            <div className="text-[10px] text-zinc-400 mb-2 leading-tight">
                              {externalData.dataSource === 'local' ? 'Рейтинг из коллекции' : 'IMDb Rating'}
                            </div>
                            <div className="bg-zinc-800/50 rounded p-1.5">
                              <div className="flex justify-between text-[10px]">
                                  <span className="text-zinc-500">Рейтинг IMDB:</span>
                                  <span className="text-[#f5c518] font-mono font-bold">{externalData.imdbRating}</span>
                              </div>
                            </div>
                        </div>
                      </div>
                     )}
                     {externalData.kpRating > 0 && (
                      <div className="relative group/kp-tooltip">
                        <div className="px-1.5 py-0.5 rounded-md bg-[#f60] text-white text-[10px] font-bold shadow-sm flex items-center justify-center w-fit">
                          KP {externalData.kpRating}
                        </div>

                        {/* KP Tooltip */}
                        <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-lg p-3 shadow-2xl opacity-0 group-hover/kp-tooltip:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover/kp-tooltip:translate-y-0 text-left z-30">
                            <div className="text-xs font-bold text-[#f60] mb-1 flex items-center gap-1">
                              <span className="inline-block w-3 h-3 rounded-sm bg-[#f60] text-white text-[8px] flex items-center justify-center font-bold">KP</span>
                              КиноПоиск
                            </div>
                            <div className="text-[10px] text-zinc-400 mb-2 leading-tight">
                              Рейтинг КиноПоиск
                            </div>
                            <div className="bg-zinc-800/50 rounded p-1.5">
                              <div className="flex justify-between text-[10px]">
                                  <span className="text-zinc-500">Рейтинг KP:</span>
                                  <span className="text-[#f60] font-mono font-bold">{externalData.kpRating}</span>
                              </div>
                            </div>
                        </div>
                      </div>
                    )}
                    {(wonOscar || nominatedOscar) && (
                      <div className="relative group/oscar-tooltip">
                        <div
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-sm flex items-center justify-center w-fit gap-1 cursor-help relative
                            ${wonOscar
                              ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black border border-yellow-300'
                              : 'bg-zinc-700 text-zinc-300 border border-zinc-600'}
                          `}
                        >
                          <Trophy className={`w-3 h-3 ${wonOscar ? 'fill-black text-black' : 'fill-current'}`} />
                          {wonOscar ? 'Oscar' : 'Nom'}
                        </div>

                        {/* Oscar Tooltip */}
                        <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-lg p-3 shadow-2xl opacity-0 group-hover/oscar-tooltip:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover/oscar-tooltip:translate-y-0 text-left z-30">
                            <div className="text-xs font-bold text-yellow-400 mb-1 flex items-center gap-1">
                              <Trophy className={`w-3 h-3 ${wonOscar ? 'fill-yellow-400 text-yellow-400' : 'fill-current'}`} />
                              {wonOscar ? 'Oscar Победитель' : 'Oscar Номинант'}
                            </div>
                            <div className="text-[10px] text-zinc-400 mb-2 leading-tight">
                              {wonOscar ? "Победитель Оскар (Academy Award Winner)" : "Номинант на Оскар"}
                            </div>
                            <div className="bg-zinc-800/50 rounded p-1.5">
                              <div className="text-[10px] text-zinc-500">
                                {wonOscar ? 'Награда за выдающиеся достижения в кинематографе' : 'Номинация на премию Оскар'}
                              </div>
                            </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

            </div>
        </div>

        {/* Gravity / Hot Badge (Top Right) */}
        {isHot && (
          <div className="absolute top-2 right-2 group/hot z-20">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold shadow-sm bg-orange-600 text-white animate-pulse cursor-help">
              <Flame className="w-3 h-3 fill-current" />
              <span>HOT</span>
            </div>
             
             {/* Hot Tooltip */}
             <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900/95 backdrop-blur-md border border-orange-900/50 rounded-lg p-3 shadow-2xl opacity-0 group-hover/hot:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover/hot:translate-y-0 text-left z-30">
                <div className="text-xs font-bold text-orange-400 mb-1 flex items-center gap-1">
                   <Flame className="w-3 h-3 fill-orange-400" />
                   В тренде!
                </div>
                <div className="text-[10px] text-zinc-400 mb-2 leading-tight">
                   Видео набирает просмотры быстрее, чем обычно для этого канала.
                </div>
                <div className="bg-zinc-800/50 rounded p-1.5 flex justify-between text-[10px]">
                    <span className="text-zinc-500">Gravity Score:</span>
                    <span className="text-orange-300 font-mono font-bold">{(video.gravity || 0).toFixed(2)}</span>
                </div>
            </div>
          </div>
        )}

        {/* Duration Badge (Bottom Right) */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
          {formatDuration(video.duration)}
        </div>

        {/* Status Toggle Buttons with Tooltips (Bottom Left) - Watched/Later and AI Analysis */}
        <div className="absolute bottom-2 left-2 z-10 flex flex-row items-end gap-1 group/status-container">
          {/* Watched/Later Button with Tooltip */}
          <div className={`flex flex-col items-start group/watched ${watchedContainerVisibleClass} transition-opacity duration-200`}>
            <div className="absolute bottom-full mb-2 px-2.5 py-1.5 bg-zinc-900/95 border border-zinc-700 rounded-lg text-xs font-medium text-white shadow-xl backdrop-blur-md whitespace-nowrap opacity-0 group-hover/watched:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="font-bold">{getWatchedTooltipText()}</div>
              <div className="text-[10px] text-zinc-400 font-normal mt-0.5">{getNextWatchedStatusText()}</div>
              <div className="absolute top-full left-4 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-700" />
            </div>

            <button
              onClick={handleWatchedClick}
              className={`p-1.5 rounded-full ${watchedButtonBgClass} backdrop-blur-sm transition-all duration-200 group/btn shadow-sm ring-1 ring-transparent hover:ring-white/20`}
            >
              <WatchedIcon className={`w-4 h-4 ${watchedColorClass}`} />
            </button>
          </div>

          {/* AI Analysis Button with Tooltip */}
          {(!externalData || (externalData.imdbRating === 0 && externalData.kpRating === 0)) && (
            <div className={`flex flex-col items-start group/ai-btn ${aiContainerVisibleClass} transition-opacity duration-200`}>
              <div className="absolute bottom-full mb-2 left-0 px-2.5 py-1.5 w-56 bg-zinc-900/95 border border-zinc-700 rounded-lg text-xs font-medium text-white shadow-xl backdrop-blur-md break-words opacity-0 group-hover/ai-btn:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                <div className="font-bold text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  AI Анализ
                </div>
                <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                  {isLoadingMetadata
                    ? "Загрузка данных..."
                    : (!externalData || externalData.aiAttempts === 0)
                      ? "Поиск в локальной базе данных и через поисковик"
                      : "Запросить через поисковик"}
                </div>
                <div className="absolute top-full left-4 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-700" />
              </div>

              <button
                onClick={handleCheckExternal}
                disabled={isLoadingMetadata}
                className={`
                  p-1.5 rounded-full ${isLoadingMetadata
                    ? 'bg-blue-600/30 text-blue-300 cursor-wait'
                    : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white'
                  } backdrop-blur-sm transition-all duration-200 group/btn shadow-sm ring-1 ring-transparent hover:ring-white/20
                `}
              >
                <Sparkles className={`w-4 h-4 ${isLoadingMetadata ? 'text-blue-300' : 'text-blue-400 group-hover/btn:text-white'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Hover Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 pointer-events-none">
          <div className="bg-blue-600/90 backdrop-blur-sm p-4 rounded-full shadow-xl">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
          {video.title}
        </h3>
        <div className="text-zinc-400 text-xs flex items-center gap-2 flex-wrap font-medium">
          <span>{formatViews(video.views)} просмотров</span>
          <span className="w-0.5 h-0.5 bg-zinc-500 rounded-full" />
          <span>{formatRelativeTime(video.created_ts)}</span>
        </div>
      </div>
    </div>
  );
};
