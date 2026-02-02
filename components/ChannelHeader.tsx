
import React, { useState, useEffect } from 'react';
import { ChannelInfo } from '../types';

interface ChannelHeaderProps {
  channelInfo: ChannelInfo | null;
  isLoading: boolean;
}

export const ChannelHeader: React.FC<ChannelHeaderProps> = ({ 
  channelInfo, 
  isLoading, 
}) => {
  const [avatarError, setAvatarError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  // Reset error states when channel info changes
  useEffect(() => {
    setAvatarError(false);
    setBannerError(false);
  }, [channelInfo]);

  const getInitials = (name: string) => {
    if (!name) return '';
    return String(name)
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
       <div className="relative w-full mb-[10px] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 min-h-[250px] shadow-2xl animate-pulse">
           {/* Banner Skeleton */}
           <div className="absolute inset-0 bg-zinc-800" />
           
           <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row items-center md:items-end gap-6 z-10">
               {/* Avatar Skeleton */}
               <div className="shrink-0 relative">
                   <div className="w-28 h-28 rounded-2xl bg-zinc-700" />
               </div>
               
               {/* Text Skeleton */}
               <div className="flex-1 w-full flex flex-col items-center md:items-start gap-3 pb-2">
                   <div className="h-8 bg-zinc-700 rounded w-3/4 md:w-1/3" />
                   <div className="h-5 bg-zinc-800 rounded w-1/2 md:w-1/4" />
               </div>
           </div>
       </div>
    );
  }

  if (!channelInfo) return null;

  const { title, subscribers, avatarUrl, bannerUrl } = channelInfo;

  return (
    <div className="relative w-full mb-[10px] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 min-h-[320px] group shadow-2xl">
      {/* Background Image Layer */}
      {bannerUrl && !bannerError ? (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ 
            backgroundImage: `url(${bannerUrl})` 
          }}
        >
             {/* Invisible img to track error */}
             <img 
                src={bannerUrl} 
                alt="" 
                className="hidden" 
                onError={() => setBannerError(true)} 
             />
        </div>
      ) : (
        /* Fallback Background */
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 group-hover:scale-105 transition-transform duration-700">
           {/* Decorative pattern */}
           <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        </div>
      )}
      
      {/* Gradient Overlay Layer */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(19, 19, 23, 0.95) 0%, rgba(19, 19, 23, 0.4) 100%)'
        }}
      />

      {/* Content Container */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row items-center md:items-end gap-6 z-10">
        
        {/* Profile Image */}
        <div className="shrink-0 relative">
          {avatarUrl && !avatarError ? (
            <img 
              src={avatarUrl} 
              alt="Channel Icon" 
              className="w-32 h-32 rounded-full object-cover border-4 border-zinc-700 shadow-xl bg-zinc-800"
              loading="lazy"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-zinc-700 shadow-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-3xl font-bold">
               {getInitials(title || '')}
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 text-center md:text-left pb-2 w-full min-w-0">
          <h1 className="text-3xl font-bold md:text-4xl text-white mb-2 tracking-tight drop-shadow-lg truncate">
            {title || 'Без названия'}
          </h1>
          <p className="text-zinc-400 font-medium text-lg">
            {subscribers !== '0' ? `${subscribers} подписчиков` : 'Подписчики скрыты'}
          </p>
        </div>
      </div>
    </div>
  );
};
