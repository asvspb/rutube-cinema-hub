import { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';

interface UseVideoStatusesResult {
  videoWatchedStatuses: Record<string, 'watched' | 'watch_later'>;
  setVideoWatchedStatuses: React.Dispatch<
    React.SetStateAction<Record<string, 'watched' | 'watch_later'>>
  >;
  videoLikedStatuses: Record<string, 'liked' | 'disliked'>;
  setVideoLikedStatuses: React.Dispatch<React.SetStateAction<Record<string, 'liked' | 'disliked'>>>;
  isLoggedIn: boolean;
  toggleVideoWatchedStatus: (videoId: string) => void;
  toggleVideoLikedStatus: (videoId: string) => void;
  updateWatchedStatus: (videoId: string, status: 'watched' | 'watch_later' | undefined) => void;
  updateLikedStatus: (videoId: string, status: 'liked' | 'disliked' | undefined) => void;
}

export const useVideoStatuses = (isLoggedIn: boolean): UseVideoStatusesResult => {
  const [videoWatchedStatuses, setVideoWatchedStatuses] = useState<
    Record<string, 'watched' | 'watch_later'>
  >(() => {
    const migrated = StorageService.migrateOldStatusStructure(isLoggedIn);
    return migrated.watched;
  });

  const [videoLikedStatuses, setVideoLikedStatuses] = useState<
    Record<string, 'liked' | 'disliked'>
  >(() => {
    const migrated = StorageService.migrateOldStatusStructure(isLoggedIn);
    return migrated.liked;
  });

  // Save watched statuses to storage when they change
  useEffect(() => {
    StorageService.setVideoWatchedStatuses(videoWatchedStatuses, isLoggedIn);
  }, [videoWatchedStatuses, isLoggedIn]);

  // Save liked statuses to storage when they change
  useEffect(() => {
    StorageService.setVideoLikedStatuses(videoLikedStatuses, isLoggedIn);
  }, [videoLikedStatuses, isLoggedIn]);

  const toggleVideoWatchedStatus = (videoId: string) => {
    setVideoWatchedStatuses(prev => {
      const current = prev[videoId];
      let next: 'watched' | 'watch_later' | undefined;

      if (!current) {
        next = 'watched';
      } else if (current === 'watched') {
        next = 'watch_later';
      } else {
        next = undefined;
      }

      if (next === undefined) {
        const { [videoId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [videoId]: next };
    });
  };

  const toggleVideoLikedStatus = (videoId: string) => {
    setVideoLikedStatuses(prev => {
      const current = prev[videoId];
      let next: 'liked' | 'disliked' | undefined;

      if (!current) {
        next = 'liked';
      } else if (current === 'liked') {
        next = 'disliked';
      } else {
        next = undefined;
      }

      if (next === undefined) {
        const { [videoId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [videoId]: next };
    });
  };

  const updateWatchedStatus = (videoId: string, status: 'watched' | 'watch_later' | undefined) => {
    if (status === undefined) {
      setVideoWatchedStatuses(prev => {
        const { [videoId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setVideoWatchedStatuses(prev => ({ ...prev, [videoId]: status }));
    }
  };

  const updateLikedStatus = (videoId: string, status: 'liked' | 'disliked' | undefined) => {
    if (status === undefined) {
      setVideoLikedStatuses(prev => {
        const { [videoId]: _, ...rest } = prev;
        return rest;
      });
    } else {
      setVideoLikedStatuses(prev => ({ ...prev, [videoId]: status }));
    }
  };

  return {
    videoWatchedStatuses,
    setVideoWatchedStatuses,
    videoLikedStatuses,
    setVideoLikedStatuses,
    isLoggedIn,
    toggleVideoWatchedStatus,
    toggleVideoLikedStatus,
    updateWatchedStatus,
    updateLikedStatus,
  };
};
