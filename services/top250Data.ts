import top250Json from '../scripts/top250-2025.json';
import topImdbJson from '../scripts/topIMDB.json';

export interface Award {
  type: string;
  status?: string;
  description?: string;
}

export interface TopMovie {
  title: string;
  id: string; // imdb id without tt prefix
  year: number | null;
  currentRating: number | null;
  awards: Award[];
  source: 'top250' | 'topIMDB';
}

export interface MatchResult extends TopMovie {
  score: number;
}

// ---------- Dataset loading ----------
const toAwardObjects = (awards: any[]): Award[] =>
  (Array.isArray(awards) ? awards : [])
    .map((a) => {
      if (typeof a === 'string') return { type: a, status: '', description: a };
      if (a && typeof a === 'object')
        return {
          type: String(a.type ?? a.title ?? a.name ?? 'award'),
          status: a.status ? String(a.status) : '',
          description: a.description ? String(a.description) : String(a.type ?? '')
        };
      return null;
    })
    .filter(Boolean) as Award[];

const normalizeDataset = (json: any, source: 'top250' | 'topIMDB'): TopMovie[] => {
  const movies = Array.isArray(json) ? json : json?.movies ?? [];
  return movies
    .map((m: any) => {
      const imdbId = String(m.imdbId ?? m.id ?? '').replace(/^tt/, '');
      const title = String(m.title ?? m.name ?? '').trim();
      if (!title || !imdbId) return null;
      return {
        title,
        id: imdbId,
        year: Number.isFinite(m.year) ? m.year : m.year ? parseInt(String(m.year), 10) || null : m.year ?? null,
        currentRating: m.rating ?? m.currentRating ?? null,
        awards: toAwardObjects(m.awards ?? []),
        source
      } as TopMovie;
    })
    .filter(Boolean) as TopMovie[];
};

export const TOP_250_MOVIES: TopMovie[] = normalizeDataset(top250Json, 'top250');
export const TOP_IMDB_MOVIES: TopMovie[] = normalizeDataset(topImdbJson, 'topIMDB');

// ---------- Matching helpers ----------
const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeTitle = (title: string) =>
  stripDiacritics(title)
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // remove parenthesized years/subtitles
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (title: string): string[] => normalizeTitle(title).split(' ').filter(Boolean);

const extractYear = (title: string): number | null => {
  const match = title.match(/\b(19|20|21)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
};

const diceCoefficient = (aTokens: Set<string>, bTokens: Set<string>): number => {
  if (!aTokens.size || !bTokens.size) return 0;
  let overlap = 0;
  for (const t of aTokens) if (bTokens.has(t)) overlap++;
  return (2 * overlap) / (aTokens.size + bTokens.size);
};

const scoreMatch = (query: string, candidate: TopMovie, queryYear: number | null): number => {
  const qTokens = new Set(tokenize(query));
  const cTokens = new Set(tokenize(candidate.title));

  let score = diceCoefficient(qTokens, cTokens); // base overlap 0..1

  const qNorm = normalizeTitle(query);
  const cNorm = normalizeTitle(candidate.title);
  if (qNorm === cNorm) score += 0.6;
  else if (qNorm.includes(cNorm) || cNorm.includes(qNorm)) score += 0.2;

  if (queryYear && candidate.year) {
    if (queryYear === candidate.year) score += 0.35;
    else if (Math.abs(queryYear - candidate.year) <= 1) score += 0.2;
    else score -= 0.3;
  }

  // small boost for higher rating as tie-breaker
  if (candidate.currentRating) score += candidate.currentRating / 100; // up to +0.1 for 10/10

  return score;
};

const findBestInDataset = (query: string, dataset: TopMovie[], threshold = 0.45): MatchResult | undefined => {
  const queryYear = extractYear(query);
  let best: MatchResult | undefined;
  for (const movie of dataset) {
    const s = scoreMatch(query, movie, queryYear);
    if (!best || s > best.score) best = { ...movie, score: s };
  }
  return best && best.score >= threshold ? best : undefined;
};

// ---------- Public API ----------
export const findMovieInTop250 = (title: string): TopMovie | undefined => {
  const match = findBestInDataset(title, TOP_250_MOVIES);
  return match;
};

export const findMovieInTopIMDB = (title: string): TopMovie | undefined => {
  const match = findBestInDataset(title, TOP_IMDB_MOVIES, 0.4);
  return match;
};

export const findBestMovieMatch = (title: string): TopMovie | undefined => {
  const a = findMovieInTop250(title);
  const b = findMovieInTopIMDB(title);
  if (a && b) return (scoreMatch(title, a, extractYear(title)) >= scoreMatch(title, b, extractYear(title))) ? a : b;
  return a ?? b;
};
