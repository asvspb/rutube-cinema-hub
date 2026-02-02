
import React, { useMemo } from 'react';
import { Play, Star, Flame, Check, Heart, Clock, Trophy, TrendingUp, Sparkles } from 'lucide-react';
import { RutubeVideo, RatingSettings, MovieRatingData } from '../types';
import { formatDuration, formatViews, formatRelativeTime } from '../services/rutubeService';

interface VideoCardProps {
  video: RutubeVideo;
  onClick: (video: RutubeVideo) => void;
  status?: 'watched' | 'liked' | 'watch_later';
  onStatusToggle?: () => void;
  ratingSettings?: RatingSettings;
  onAnalyze?: (title: string) => void;
  externalMetadata?: Record<string, MovieRatingData>; // Global cache
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, status, onStatusToggle, ratingSettings, onAnalyze, externalMetadata }) => {
  
  // Resolve external data from the global cache using the video title
  const externalData = useMemo(() => {
    if (!externalMetadata || !video.title) return null;
    return externalMetadata[video.title] || null;
  }, [externalMetadata, video.title]);

  // Determine if video is "Hot" based on Gravity
  const isHot = (video.gravity || 0) > 2.0;

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusToggle) onStatusToggle();
  };

  const handleCheckExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAnalyze) {
      onAnalyze(video.title);
    }
  };

  // Status Icon Logic
  let StatusIcon = Heart;
  let statusColorClass = "text-zinc-400 group-hover/btn:text-white";
  let containerVisibleClass = "opacity-0 group-hover:opacity-100"; 
  let buttonBgClass = "bg-black/60 hover:bg-zinc-800/80";

  if (status === 'liked') {
    StatusIcon = Heart;
    statusColorClass = "text-red-500 fill-red-500";
    containerVisibleClass = "opacity-100"; 
    buttonBgClass = "bg-red-500/10 hover:bg-red-500/20";
  } else if (status === 'watched') {
    StatusIcon = Check;
    statusColorClass = "text-green-500";
    containerVisibleClass = "opacity-100";
    buttonBgClass = "bg-green-500/10 hover:bg-green-500/20";
  } else if (status === 'watch_later') {
    StatusIcon = Clock;
    statusColorClass = "text-blue-400";
    containerVisibleClass = "opacity-100";
    buttonBgClass = "bg-blue-500/10 hover:bg-blue-500/20";
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
  
  const getStatusTooltipText = () => {
    if (status === 'liked') return 'Понравилось';
    if (status === 'watched') return 'Просмотрено';
    if (status === 'watch_later') return 'Посмотреть позже';
    return 'Нравится';
  };

  const getNextStatusText = () => {
    if (!status) return 'Следующий: Понравилось';
    if (status === 'liked') return 'Следующий: Просмотрено';
    if (status === 'watched') return 'Следующий: Посмотреть позже';
    if (status === 'watch_later') return 'Следующий: Убрать отметку';
    return '';
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

        {/* Rating Badge (Top Left) */}
        <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
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

            {/* External Check Button / Badges */}
            <div className="flex flex-col gap-1 items-start">
              {externalData && (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col gap-1 items-start">
                    {externalData.imdbRating > 0 && (
                      <div className="px-1.5 py-0.5 rounded-md bg-[#f5c518] text-black text-[10px] font-bold shadow-sm flex items-center justify-center w-fit" title="IMDb Rating">
                        IMDb {externalData.imdbRating}
                      </div>
                    )}
                    {externalData.kpRating > 0 && (
                      <div className="px-1.5 py-0.5 rounded-md bg-[#f60] text-white text-[10px] font-bold shadow-sm flex items-center justify-center w-fit" title="Kinopoisk Rating">
                        KP {externalData.kpRating}
                      </div>
                    )}
                    {(wonOscar || nominatedOscar) && (
                      <div 
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-sm flex items-center justify-center w-fit gap-1 cursor-help relative group/oscar
                          ${wonOscar 
                            ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black border border-yellow-300' 
                            : 'bg-zinc-700 text-zinc-300 border border-zinc-600'}
                        `}
                        title={wonOscar ? "Победитель Оскар (Academy Award Winner)" : "Номинант на Оскар"}
                      >
                        <Trophy className={`w-3 h-3 ${wonOscar ? 'fill-black text-black' : 'fill-current'}`} />
                        {wonOscar ? 'Oscar' : 'Nom'}
                      </div>
                    )}
                </div>
              )}
              
               {!externalData && (
                 <button 
                   onClick={handleCheckExternal}
                   className={`
                      px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-sm flex items-center justify-center w-fit transition-all duration-200 mt-1
                      bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white opacity-0 group-hover:opacity-100
                   `}
                   title="Проверить рейтинги с AI"
                 >
                   <Sparkles className="w-3 h-3 mr-1" /> AI
                 </button>
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

        {/* Status Toggle Button with Tooltip (Bottom Left) */}
        <div className={`absolute bottom-2 left-2 z-30 flex flex-col items-start group/status ${containerVisibleClass} transition-opacity duration-200`}>
           <div className="absolute bottom-full mb-2 px-2.5 py-1.5 bg-zinc-900/95 border border-zinc-700 rounded-lg text-xs font-medium text-white shadow-xl backdrop-blur-md whitespace-nowrap opacity-0 group-hover/status:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="font-bold">{getStatusTooltipText()}</div>
              <div className="text-[10px] text-zinc-400 font-normal mt-0.5">{getNextStatusText()}</div>
              <div className="absolute top-full left-4 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-700" />
           </div>

           <button
             onClick={handleStatusClick}
             className={`p-1.5 rounded-full ${buttonBgClass} backdrop-blur-sm transition-all duration-200 group/btn shadow-sm ring-1 ring-transparent hover:ring-white/20`}
           >
             <StatusIcon className={`w-4 h-4 ${statusColorClass}`} />
           </button>
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
