
import { GoogleGenAI, Type } from "@google/genai";
import { MovieRatingData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Act as a "Cinema Intelligence Agent" for the KinoRate AI application.
Your goal is to retrieve accurate movie ratings from Kinopoisk (KP) and IMDb, and strictly verify Major Awards (Oscars/Academy Awards) using Google Search.

Rules:
1. Fix user typos (e.g., "shoshank" -> "The Shawshank Redemption").
2. If the query is ambiguous, prefer the most acclaimed version.
3. Always localize the 'title' and 'description' to Russian.
4. 'originalTitle' should be in the original language.
5. If ratings are not found, return 0 for that rating.
6. 'kpVotes' should be a string like "900K" or "1.2M".
7. 'description' should be a short, engaging plot summary in Russian.
8. 'awards': Check specifically for Academy Awards (Oscars). 
   - If the movie WON any Oscar, add string "Oscar Won". 
   - If it was NOMINATED but didn't win, add "Oscar Nominated".
   - You can add specific major wins like "Best Picture", "Best Actor".
   - IGNORE minor festivals unless requested. Focus on Oscars.
9. Use the googleSearch tool to find up-to-date information.
`;

const movieRatingSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    originalTitle: { type: Type.STRING },
    year: { type: Type.STRING },
    kpRating: { type: Type.NUMBER },
    kpVotes: { type: Type.STRING },
    imdbRating: { type: Type.NUMBER },
    description: { type: Type.STRING },
    awards: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of major awards status, e.g., 'Oscar Won', 'Oscar Nominated', 'Best Picture'",
    }
  },
  required: ["title", "originalTitle", "year", "kpRating", "kpVotes", "imdbRating", "description"],
};

export const searchMovieRatings = async (query: string): Promise<MovieRatingData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find ratings and awards for the movie: "${query}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: movieRatingSchema,
      },
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text) as MovieRatingData;
    
    // Extract sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks
      ?.map(c => c.web?.uri)
      .filter((uri): uri is string => !!uri);

    return { ...data, sources };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return null;
  }
};

export const analyzeBatchWithAgent = async (queries: string[]): Promise<MovieRatingData[]> => {
  if (queries.length === 0) return [];

  const batchSchema = {
    type: Type.ARRAY,
    items: movieRatingSchema
  };

  try {
    const joinedQueries = queries.map((q, i) => `${i + 1}. ${q}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find ratings and Oscar status for the following movies:\n${joinedQueries}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + "\nReturn a JSON array of results in the same order.",
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: batchSchema,
      },
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text) as MovieRatingData[];
    return data;
  } catch (error) {
    console.error("Gemini Batch Error:", error);
    return [];
  }
};
