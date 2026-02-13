import { useState, useEffect } from 'react';
import { MovieRatingData } from '../types';
import { StorageService } from '../services/storageService';
import { findBestMovieMatch } from '../services/top250Data';

interface UseMetadataResult {
  metadataCache: Record<string, MovieRatingData>;
  setMetadataCache: React.Dispatch<React.SetStateAction<Record<string, MovieRatingData>>>;
  handleAnalyzeVideo: (title: string) => Promise<void>;
  handleSaveMetadata: (newItems: MovieRatingData[], contextKey?: string) => void;
  loadingMetadataFor: Set<string>;
  handleClearMetadataCache: () => void;
}

export const useMetadata = (): UseMetadataResult => {
  const [metadataCache, setMetadataCache] = useState<Record<string, MovieRatingData>>(() =>
    StorageService.getMetadataCache()
  );

  const [loadingMetadataFor, setLoadingMetadataFor] = useState<Set<string>>(new Set());

  useEffect(() => {
    StorageService.setMetadataCache(metadataCache);
  }, [metadataCache]);

  const handleAnalyzeVideo = async (title: string): Promise<void> => {
    // Check if already loading
    if (loadingMetadataFor.has(title)) {
      return;
    }

    // Check if already has valid data with rating
    const existing = metadataCache[title];
    if (existing && (existing.imdbRating > 0 || existing.kpRating > 0)) {
      // Already has rating, do nothing
      return;
    }

    // First attempt: check local database (only if no existing record)
    if (!existing) {
      const localMatch = findBestMovieMatch(title);
      if (localMatch) {
        const metadata: MovieRatingData = {
          title: title,
          originalTitle: localMatch.title,
          year: localMatch.title.match(/\((\d{4})\)/)?.[1] || '',
          kpRating: 0,
          kpVotes: '',
          imdbRating: localMatch.currentRating || 0,
          imdbUrl: localMatch.imdbUrl,
          description: '',
          awards: localMatch.awards?.map(a => `${a.type} ${a.status || ''}`).filter(Boolean),
          dataSource: 'local',
          aiAttempts: 0,
        };
        handleSaveMetadata([metadata], title);
        return;
      }

      // No local match found, mark as failed local search
      const noLocalData: MovieRatingData = {
        title: title,
        originalTitle: '',
        year: '',
        kpRating: 0,
        kpVotes: '',
        imdbRating: 0,
        description: '',
        dataSource: undefined,
        aiAttempts: 0,
      };
      handleSaveMetadata([noLocalData], title);
      return;
    }

    // Subsequent attempts: use AI search (only if local search failed and no rating yet)
    if (existing && existing.imdbRating === 0 && existing.kpRating === 0) {
      setLoadingMetadataFor(prev => new Set(prev).add(title));

      try {
        const { searchMovieRatings } = await import('../services/llmService');
        const result = await searchMovieRatings(title);

        if (result && (result.imdbRating > 0 || result.kpRating > 0)) {
          // AI found valid ratings
          result.dataSource = 'ai';
          result.aiAttempts = (existing.aiAttempts || 0) + 1;
          handleSaveMetadata([result], title);
        } else {
          // AI search failed or returned no rating, increment attempt counter
          const updatedMetadata = {
            ...existing,
            aiAttempts: (existing.aiAttempts || 0) + 1,
          };
          handleSaveMetadata([updatedMetadata], title);
        }
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
        // Increment attempt counter even on error
        const updatedMetadata = {
          ...existing,
          aiAttempts: (existing.aiAttempts || 0) + 1,
        };
        handleSaveMetadata([updatedMetadata], title);
      } finally {
        setLoadingMetadataFor(prev => {
          const next = new Set(prev);
          next.delete(title);
          return next;
        });
      }
    }
  };

  const handleSaveMetadata = (newItems: MovieRatingData[], contextKey?: string) => {
    setMetadataCache(prev => {
      const next = { ...prev };

      // If a specific context key is provided (the rutube title), save the FIRST result to that key
      if (contextKey && newItems.length > 0) {
        next[contextKey] = newItems[0];
      }

      // Also save by the clean title for general lookups
      newItems.forEach(item => {
        if (item.title) {
          next[item.title] = item;
        }
      });
      return next;
    });
  };

  const handleClearMetadataCache = () => {
    setMetadataCache({});
  };

  return {
    metadataCache,
    setMetadataCache,
    handleAnalyzeVideo,
    handleSaveMetadata,
    loadingMetadataFor,
    handleClearMetadataCache,
  };
};
