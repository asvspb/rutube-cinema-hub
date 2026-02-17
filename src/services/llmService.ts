import { MovieRatingData, validateMovieRatingData, validateMovieRatingArray } from '../types';

export const searchMovieRatings = async (query: string): Promise<MovieRatingData | null> => {
  try {
    const response = await fetch('/api/ai/kinorate/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Validate external data with Zod schema
    const validatedData = validateMovieRatingData(data);
    return validatedData;
  } catch (error) {
    console.error('LLM Search Error:', error);
    return null;
  }
};

export const analyzeBatchWithAgent = async (queries: string[]): Promise<MovieRatingData[]> => {
  if (queries.length === 0) return [];

  try {
    const response = await fetch('/api/ai/kinorate/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ queries }),
    });

    if (!response.ok) return [];

    const data = await response.json();

    // Validate external data with Zod schema
    const validatedData = validateMovieRatingArray(data);
    return validatedData;
  } catch (error) {
    console.error('LLM Batch Error:', error);
    return [];
  }
};
