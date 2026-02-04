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
  imdbUrl?: string;
  top250Url?: string;
  source: 'top250' | 'topIMDB';
}

export interface MatchResult extends TopMovie {
  score: number;
}

// ---------- Dataset loading ----------
const normalizeWhitespace = (s: string) => s.trim().replace(/\s+/g, ' ');

const parseOscarAward = (text: string): Award | null => {
  const t = normalizeWhitespace(text);
  const lower = t.toLowerCase();
  if (!lower.includes('oscar')) return null;

  // Common patterns in our datasets:
  // - "Won Oscar"
  // - "Nominated to Oscar"
  if (/\b(won|winner)\b/.test(lower)) {
    return { type: 'Oscar', status: 'Won', description: t };
  }

  if (/\b(nominated|nominee)\b/.test(lower)) {
    return { type: 'Oscar', status: 'Nominated', description: t };
  }

  return { type: 'Oscar', status: '', description: t };
};

const toAwardObjects = (awards: any[]): Award[] =>
  (Array.isArray(awards) ? awards : [])
    .map((a) => {
      if (typeof a === 'string') {
        const s = normalizeWhitespace(a);
        return parseOscarAward(s) ?? { type: s, status: '', description: s };
      }

      if (a && typeof a === 'object') {
        const rawType = normalizeWhitespace(String(a.type ?? a.title ?? a.name ?? 'award'));
        const rawStatus = a.status ? normalizeWhitespace(String(a.status)) : '';
        const rawDescription = a.description
          ? normalizeWhitespace(String(a.description))
          : rawType;

        const parsedOscar = parseOscarAward(rawType) ?? parseOscarAward(rawDescription);
        if (parsedOscar) {
          return {
            ...parsedOscar,
            status: rawStatus || parsedOscar.status
          };
        }

        return {
          type: rawType,
          status: rawStatus,
          description: rawDescription
        };
      }

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
      const imdbUrl = typeof m.url === 'string' && m.url.trim().length > 0
        ? String(m.url)
        : imdbId
          ? `https://www.imdb.com/title/tt${imdbId}/`
          : undefined;

      const top250Url = typeof m.source_url === 'string' && m.source_url.trim().length > 0
        ? String(m.source_url)
        : imdbId
          ? `http://top250.info/movie/?${imdbId}`
          : undefined;

      return {
        title,
        id: imdbId,
        year: Number.isFinite(m.year) ? m.year : m.year ? parseInt(String(m.year), 10) || null : m.year ?? null,
        currentRating: m.rating ?? m.currentRating ?? null,
        awards: toAwardObjects(m.awards ?? []),
        imdbUrl,
        top250Url,
        source
      } as TopMovie;
    })
    .filter(Boolean) as TopMovie[];
};

const rawTop250: TopMovie[] = normalizeDataset(top250Json, 'top250');
const rawTopImdb: TopMovie[] = normalizeDataset(topImdbJson, 'topIMDB');

// If Top 250 items have missing awards, fall back to the Top 1000 dataset (same imdb ids).
const awardsById = new Map<string, Award[]>();
rawTopImdb.forEach((m) => awardsById.set(m.id, m.awards));

const mergeAwards = (a: Award[], b: Award[]): Award[] => {
  if (b.length === 0) return a;
  if (a.length === 0) return b;

  const seen = new Set<string>();
  const out: Award[] = [];

  for (const aw of [...a, ...b]) {
    const key = `${aw.type}|${aw.status ?? ''}|${aw.description ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(aw);
  }

  return out;
};

export const TOP_250_MOVIES: TopMovie[] = rawTop250.map((m) => ({
  ...m,
  awards: mergeAwards(m.awards, awardsById.get(m.id) ?? [])
}));

export const TOP_IMDB_MOVIES: TopMovie[] = rawTopImdb;

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

const findBestInDataset = (query: string, dataset: TopMovie[], threshold = 0.6): MatchResult | undefined => {
  const queryYear = extractYear(query);
  let best: MatchResult | undefined;
  
  // Check if query looks like a series episode (e.g., contains "серия", "сезон", "эпизод")
  const queryLower = query.toLowerCase();
  const isSeriesEpisode = /серия|сезон|эпизод|episode|season/i.test(query);
  
  for (const movie of dataset) {
    const s = scoreMatch(query, movie, queryYear);
    if (!best || s > best.score) best = { ...movie, score: s };
  }
  
  // If query is a series episode, require much higher threshold
  const effectiveThreshold = isSeriesEpisode ? 0.85 : threshold;
  
  return best && best.score >= effectiveThreshold ? best : undefined;
};

// ---------- Public API ----------
export const findMovieInTop250 = (title: string): TopMovie | undefined => {
  const match = findBestInDataset(title, TOP_250_MOVIES);
  return match;
};

export const findMovieInTopIMDB = (title: string): TopMovie | undefined => {
  const match = findBestInDataset(title, TOP_IMDB_MOVIES, 0.6);
  return match;
};

export const findBestMovieMatch = (title: string): TopMovie | undefined => {
  const a = findMovieInTop250(title);
  const b = findMovieInTopIMDB(title);
  if (a && b) return (scoreMatch(title, a, extractYear(title)) >= scoreMatch(title, b, extractYear(title))) ? a : b;
  return a ?? b;
};
