import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { fetchChannelInfo } from '../services/rutubeService';
import { useAbortController } from '../utils/abortUtils';

interface RecommendedChannelCardProps {
  id: string;
  label: string;
  color: string;
  onClick: () => void;
}

export const RecommendedChannelCard: React.FC<RecommendedChannelCardProps> = ({
  id,
  label,
  color,
  onClick,
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { signal, cleanup } = useAbortController();

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const info = await fetchChannelInfo(id);
        if (!signal.aborted && info && info.avatarUrl) {
          setAvatarUrl(info.avatarUrl);
        }
      } catch (e) {}
    };
    loadAvatar();
    return cleanup;
  }, [id, signal, cleanup]);

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-3 transition-transform duration-300 hover:scale-105 active:scale-95"
    >
      <div
        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-xl flex items-center justify-center ${!avatarUrl ? color : 'bg-zinc-800'} relative overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500/50 transition-all`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <>
            <Plus className="w-8 h-8 text-white drop-shadow-md" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none" />
          </>
        )}
      </div>
      <span className="text-zinc-300 font-medium text-sm sm:text-base group-hover:text-white transition-colors">
        {label}
      </span>
    </button>
  );
};
