import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { searchMovieRatings, analyzeBatchWithAgent } from '../../src/services/llmService';
import { MovieRatingData } from '../../src/types';

describe('llmService', () => {
  const mockMovieData: MovieRatingData = {
    title: 'Тестовый фильм',
    originalTitle: 'Test Movie',
    year: '2024',
    kpRating: 7.5,
    kpVotes: '10000',
    imdbRating: 7.2,
    description: 'Описание тестового фильма',
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchMovieRatings', () => {
    it('should return movie data on successful search', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMovieData,
      } as Response);

      const result = await searchMovieRatings('Тестовый фильм');

      expect(fetch).toHaveBeenCalledWith('/api/ai/kinorate/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Тестовый фильм' }),
      });
      expect(result).toEqual(mockMovieData);
    });

    it('should return null on HTTP error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await searchMovieRatings('Фильм');

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await searchMovieRatings('Фильм');

      expect(result).toBeNull();
    });

    it('should return null on 404 response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await searchMovieRatings('Несуществующий фильм');

      expect(result).toBeNull();
    });

    it('should return null when response is null', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      } as Response);

      const result = await searchMovieRatings('Фильм');

      expect(result).toBeNull();
    });

    it('should return data with AI sources', async () => {
      const aiData: MovieRatingData = {
        ...mockMovieData,
        dataSource: 'ai',
        sources: ['https://kinopoisk.ru/film/123'],
        awards: ['Оскар'],
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => aiData,
      } as Response);

      const result = await searchMovieRatings('Тестовый фильм');

      expect(result).toEqual(aiData);
      expect(result?.dataSource).toBe('ai');
      expect(result?.sources).toHaveLength(1);
    });

    it('should handle empty query', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      } as Response);

      const result = await searchMovieRatings('');

      expect(fetch).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle timeout gracefully', async () => {
      vi.mocked(fetch).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 100);
          })
      );

      const result = await searchMovieRatings('Фильм');

      expect(result).toBeNull();
    });
  });

  describe('analyzeBatchWithAgent', () => {
    it('should return empty array for empty queries', async () => {
      const result = await analyzeBatchWithAgent([]);

      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return movie data array on successful batch', async () => {
      const mockBatchData: MovieRatingData[] = [
        mockMovieData,
        { ...mockMovieData, title: 'Фильм 2', kpRating: 8.0 },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBatchData,
      } as Response);

      const result = await analyzeBatchWithAgent(['Фильм 1', 'Фильм 2']);

      expect(fetch).toHaveBeenCalledWith('/api/ai/kinorate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: ['Фильм 1', 'Фильм 2'] }),
      });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Тестовый фильм');
    });

    it('should return empty array on HTTP error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await analyzeBatchWithAgent(['Фильм 1', 'Фильм 2']);

      expect(result).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await analyzeBatchWithAgent(['Фильм']);

      expect(result).toEqual([]);
    });

    it('should handle non-array response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'not an array' }),
      } as Response);

      const result = await analyzeBatchWithAgent(['Фильм']);

      expect(result).toEqual([]);
    });

    it('should handle null response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      } as Response);

      const result = await analyzeBatchWithAgent(['Фильм']);

      expect(result).toEqual([]);
    });

    it('should handle partial failures in batch', async () => {
      const partialData: (MovieRatingData | null)[] = [
        mockMovieData,
        null,
        { ...mockMovieData, title: 'Фильм 3' },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => partialData,
      } as Response);

      const result = await analyzeBatchWithAgent(['Фильм 1', 'Фильм 2', 'Фильм 3']);

      expect(result).toHaveLength(3);
    });

    it('should handle large batch', async () => {
      const queries = Array.from({ length: 20 }, (_, i) => `Фильм ${i}`);
      const mockData = queries.map((q, i) => ({
        ...mockMovieData,
        title: q,
        kpRating: 7 + i * 0.1,
      }));

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await analyzeBatchWithAgent(queries);

      expect(result).toHaveLength(20);
    });

    it('should handle 429 rate limit', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as Response);

      const result = await analyzeBatchWithAgent(['Фильм']);

      expect(result).toEqual([]);
    });

    it('should handle 400 bad request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      const result = await analyzeBatchWithAgent(['Фильм']);

      expect(result).toEqual([]);
    });
  });
});
