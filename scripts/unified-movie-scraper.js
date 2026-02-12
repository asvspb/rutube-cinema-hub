import axios from 'axios';
import * as cheerio from 'cheerio';
import { readFile, rename, writeFile } from 'fs/promises';
import { createGunzip } from 'zlib';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, resolve as resolvePath } from 'path';

const CONFIG = {
  imdbTop250Url: 'https://www.imdb.com/chart/top/',
  imdbBasicsTsv: 'https://datasets.imdbws.com/title.basics.tsv.gz',
  imdbRatingsTsv: 'https://datasets.imdbws.com/title.ratings.tsv.gz',
  imdbOutputJson: 'top250-2025.json',
  allTimeOutputJson: 'topIMDB.json',
  allTimeLimit: 1000,
  top250InfoUrl: 'http://top250.info/movies/',
  concurrency: 10,
  retries: 3,
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/122.0',
    'Accept-Language': 'en-US,en;q=0.9',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    Referer: 'https://www.imdb.com/',
  },
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, attempt = 1, axiosOptions = {}) {
  try {
    return await axios.get(url, {
      headers: CONFIG.headers,
      timeout: CONFIG.timeout,
      ...axiosOptions,
    });
  } catch (error) {
    if (attempt >= CONFIG.retries) throw error;
    const delay = Math.pow(2, attempt) * 1000;
    console.warn(`⚠️ Error fetching ${url} (Attempt ${attempt}). Retrying in ${delay}ms...`);
    await sleep(delay);
    return fetchWithRetry(url, attempt + 1, axiosOptions);
  }
}

const normalizeTitle = title =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const parseYear = value => {
  const year = parseInt(value, 10);
  return Number.isFinite(year) ? year : null;
};

const keyFromTitleYear = (title, year) => `${normalizeTitle(title)}|${year ?? ''}`;

async function loadImdbBasics() {
  const response = await fetchWithRetry(CONFIG.imdbBasicsTsv, 1, { responseType: 'stream' });
  const rl = readline.createInterface({
    input: response.data.pipe(createGunzip()),
    crlfDelay: Infinity,
  });

  const basics = new Map();
  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    const cols = line.split('\t');
    if (cols.length < 9) continue;
    const [
      tconst,
      titleType,
      primaryTitle,
      originalTitle,
      isAdult,
      startYear,
      ,
      runtimeMinutes,
      genres,
    ] = cols;
    if (titleType !== 'movie' || isAdult === '1') continue;

    basics.set(tconst, {
      title: primaryTitle !== '\\N' ? primaryTitle : originalTitle,
      year: startYear !== '\\N' ? parseYear(startYear) : null,
      runtimeMinutes: runtimeMinutes !== '\\N' ? Number(runtimeMinutes) : null,
      genres: genres !== '\\N' ? genres.split(',') : [],
    });
  }
  return basics;
}

async function loadImdbRatings() {
  const response = await fetchWithRetry(CONFIG.imdbRatingsTsv, 1, { responseType: 'stream' });
  const rl = readline.createInterface({
    input: response.data.pipe(createGunzip()),
    crlfDelay: Infinity,
  });

  const ratings = new Map();
  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    const cols = line.split('\t');
    if (cols.length < 3) continue;
    const [tconst, averageRating, numVotes] = cols;
    ratings.set(tconst, {
      rating: Number(averageRating),
      votes: Number(numVotes),
    });
  }
  return ratings;
}

async function loadImdbDataset(minVotes = 2500) {
  console.log('📥 Downloading IMDb TSV dumps...');
  const [basics, ratings] = await Promise.all([loadImdbBasics(), loadImdbRatings()]);
  const movies = [];

  for (const [tconst, ratingEntry] of ratings.entries()) {
    if (ratingEntry.votes < minVotes) continue;
    const basic = basics.get(tconst);
    if (!basic) continue;

    movies.push({
      imdbId: tconst,
      title: basic.title,
      year: basic.year,
      rating: ratingEntry.rating,
      votes: ratingEntry.votes,
      genre: basic.genres,
      duration: basic.runtimeMinutes ? `PT${basic.runtimeMinutes}M` : '',
      url: `https://www.imdb.com/title/${tconst}/`,
      awards: [],
    });
  }
  console.log(`✅ IMDb dataset ready: ${movies.length} movies (votes ≥ ${minVotes})`);
  return movies;
}

function compareMovies(a, b) {
  if (b.rating !== a.rating) return b.rating - a.rating;
  if (b.votes !== a.votes) return b.votes - a.votes;
  if ((b.year ?? 0) !== (a.year ?? 0)) return (b.year ?? 0) - (a.year ?? 0);
  return a.title.localeCompare(b.title);
}

function buildTop250(dataset) {
  const sorted = [...dataset].sort(compareMovies);
  return sorted.slice(0, 250).map((m, idx) => ({ ...m, rank: idx + 1 }));
}

function buildAllTime(dataset, limit = CONFIG.allTimeLimit) {
  const sorted = [...dataset].sort(compareMovies);
  return sorted.slice(0, limit).map((m, idx) => ({ ...m, rank: idx + 1 }));
}

function validateList(list, { expectedCount, minCount = 0, idField = 'imdbId' }) {
  if (expectedCount && list.length !== expectedCount) {
    throw new Error(`Validation failed: expected ${expectedCount} items, got ${list.length}`);
  }
  if (list.length < minCount) {
    throw new Error(`Validation failed: expected at least ${minCount} items, got ${list.length}`);
  }
  const seen = new Set();
  for (const item of list) {
    const id = item[idField] || keyFromTitleYear(item.title, item.year);
    if (seen.has(id)) throw new Error(`Duplicate entry detected: ${id}`);
    seen.add(id);
    if (item.rating < 0 || item.rating > 10) throw new Error(`Invalid rating for ${id}`);
    if (item.votes !== undefined && item.votes < 0) throw new Error(`Invalid votes for ${id}`);
  }
}

async function loadExistingMovies(path) {
  try {
    const raw = await readFile(path, 'utf8');
    const json = JSON.parse(raw);
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.movies)) return json.movies;
    return [];
  } catch {
    return [];
  }
}

function summarizeChanges(prev, next, idField = 'imdbId') {
  const prevMap = new Map(prev.map(m => [m[idField] || keyFromTitleYear(m.title, m.year), m]));
  const nextMap = new Map(next.map(m => [m[idField] || keyFromTitleYear(m.title, m.year), m]));

  const added = [];
  const removed = [];
  const changed = [];

  for (const key of nextMap.keys()) {
    if (!prevMap.has(key)) added.push(key);
    else {
      const a = prevMap.get(key);
      const b = nextMap.get(key);
      if (a.rating !== b.rating || a.rank !== b.rank || a.votes !== b.votes) changed.push(key);
    }
  }
  for (const key of prevMap.keys()) {
    if (!nextMap.has(key)) removed.push(key);
  }

  return {
    added: added.length,
    removed: removed.length,
    changed: changed.length,
    sample_added: added.slice(0, 5),
    sample_removed: removed.slice(0, 5),
  };
}

async function writeJsonAtomic(targetPath, data) {
  const tempPath = `${targetPath}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2));
  await rename(tempPath, targetPath);
}

async function scrapeIMDBTop250Html() {
  console.log(`🌐 Fallback: scraping IMDb Top 250 HTML from ${CONFIG.imdbTop250Url}`);
  const response = await fetchWithRetry(CONFIG.imdbTop250Url);
  const html = response.data;
  const $ = cheerio.load(html);

  const schemaScript = $('script[type="application/ld+json"]');
  let jsonData = null;
  for (let i = 0; i < schemaScript.length; i++) {
    try {
      const text = $(schemaScript[i]).html();
      if (!text) continue;
      const parsed = JSON.parse(text);
      if (parsed['@type'] === 'ItemList' && parsed.itemListElement) {
        jsonData = parsed;
        break;
      }
    } catch {
      continue;
    }
  }
  if (!jsonData) throw new Error('Could not find structured data for Top 250');

  const movies = [];
  jsonData.itemListElement?.forEach((item, index) => {
    if (item['@type'] !== 'ListItem' || !item.item) return;
    const movieItem = item.item;
    let title = movieItem.name || '';
    let year = null;
    const titleYearMatch = title.match(/^(.*?)\s*\((\d{4})\)$/);
    if (titleYearMatch) {
      title = titleYearMatch[1];
      year = parseInt(titleYearMatch[2], 10);
    }
    movies.push({
      rank: item.position || index + 1,
      title,
      year,
      rating: movieItem.aggregateRating ? parseFloat(movieItem.aggregateRating.ratingValue) : null,
      url: movieItem.url || '',
      description: movieItem.description || '',
      genre: movieItem.genre || '',
      duration: movieItem.duration || '',
      imdbId: movieItem.url ? movieItem.url.split('/title/')[1]?.split('/')[0] : undefined,
      votes: null,
      awards: [],
    });
  });
  console.log(`✅ Parsed ${movies.length} movies from HTML fallback`);
  return movies;
}

async function fetchTop250InfoEnrichment() {
  console.log(`🔍 Fetching enrichment from ${CONFIG.top250InfoUrl}`);
  const sections = ['0-9', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];
  const allMovies = new Map();

  for (let i = 0; i < sections.length; i += CONFIG.concurrency) {
    const batch = sections.slice(i, i + CONFIG.concurrency);
    await Promise.all(
      batch.map(async sec => {
        const url = `${CONFIG.top250InfoUrl}?${sec}`;
        try {
          const response = await fetchWithRetry(url);
          const $ = cheerio.load(response.data);
          $('table tr').each((_, element) => {
            const row = $(element);
            const movieLink = row.find('td a[href^="/movie/"]');
            if (!movieLink.length) return;
            const fullTitle = movieLink.text().trim(); // often "Title (Year)"
            const href = movieLink.attr('href');
            const movieId = href?.match(/\/movie\/\?(\d+)/)?.[1];
            const titleMatch = fullTitle.match(/^(.*?)(?:\s*\((\d{4})\))?$/);
            const title = titleMatch?.[1]?.trim() || fullTitle;
            const year = titleMatch?.[2] ? parseInt(titleMatch[2], 10) : null;

            const awards = [];
            row.find('img').each((_, img) => {
              const titleAttr = $(img).attr('title');
              if (titleAttr) awards.push(titleAttr);
            });

            const key = keyFromTitleYear(title, year);
            if (!allMovies.has(key)) {
              allMovies.set(key, {
                title,
                year,
                awards,
                url: href ? `http://top250.info${href}` : undefined,
                sourceId: movieId || undefined,
              });
            }
          });
          console.log(`✅ Section ${sec}: collected`);
        } catch (error) {
          console.error(`❌ Failed section ${sec}: ${error.message}`);
        }
      })
    );
  }
  console.log(`🎉 Enrichment collected: ${allMovies.size} entries`);
  return Array.from(allMovies.values());
}

function mergeAwards(list, enrichments) {
  const enrichMap = new Map(enrichments.map(e => [keyFromTitleYear(e.title, e.year), e]));
  return list.map(movie => {
    const key = keyFromTitleYear(movie.title, movie.year);
    const enrich = enrichMap.get(key);
    if (!enrich) return movie;
    const awards = Array.from(new Set([...(movie.awards || []), ...(enrich.awards || [])]));
    return { ...movie, awards, source_url: enrich.url ?? movie.source_url };
  });
}

function buildPayload({ title, source, methodology, criteria, note, movies, changeSummary }) {
  return {
    description: {
      title,
      source,
      methodology,
      criteria,
      update_frequency: 'Updated via TSV daily with HTML fallback',
      data_fields: {
        rank: 'Position in the list',
        title: 'Movie title',
        year: 'Release year',
        rating: 'IMDb rating score',
        votes: 'Number of IMDb votes',
        url: 'IMDb URL',
        awards: 'Awards/recognitions from top250.info (if any)',
        duration: 'Runtime ISO 8601',
        genre: 'Movie genres',
      },
      note,
    },
    metadata: {
      scraped_at: new Date().toISOString(),
      total_movies: movies.length,
      change_summary: changeSummary,
    },
    movies,
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    skipEnrich: false,
    forceHtml: false,
    allTimeLimit: CONFIG.allTimeLimit,
  };
  for (const arg of args) {
    if (arg === '--skip-enrich') options.skipEnrich = true;
    else if (arg === '--force-html') options.forceHtml = true;
    else if (arg.startsWith('--all-time-limit=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (Number.isFinite(val)) options.allTimeLimit = val;
    }
  }
  return options;
}

async function main() {
  const options = parseArgs();
  console.log('🎬 Starting unified movie updater');
  console.log(
    `Options: skipEnrich=${options.skipEnrich}, forceHtml=${options.forceHtml}, allTimeLimit=${options.allTimeLimit}`
  );

  let imdbDataset = null;
  let top250 = [];
  let allTime = [];

  try {
    imdbDataset = options.forceHtml ? null : await loadImdbDataset();
  } catch (error) {
    console.error(`⚠️ IMDb TSV failed: ${error.message}`);
  }

  if (!imdbDataset) {
    console.warn('Using HTML fallback for Top 250 and top250.info for all-time.');
    top250 = await scrapeIMDBTop250Html();
    allTime = await fetchTop250InfoEnrichment(); // fallback list (no IMDb ids)
  } else {
    top250 = buildTop250(imdbDataset);
    allTime = buildAllTime(imdbDataset, options.allTimeLimit);
  }

  if (!options.skipEnrich) {
    try {
      const enrichment = await fetchTop250InfoEnrichment();
      top250 = mergeAwards(top250, enrichment);
      allTime = mergeAwards(allTime, enrichment);
    } catch (error) {
      console.error(`⚠️ Enrichment failed: ${error.message}`);
    }
  }

  // Validation
  try {
    validateList(top250, { expectedCount: 250 });
  } catch (err) {
    console.error(`Top 250 validation failed: ${err.message}`);
    if (imdbDataset) throw err;
  }
  validateList(allTime, { minCount: Math.min(200, options.allTimeLimit / 2) });

  // Diffs
  const prevTop250 = await loadExistingMovies(OUTPUT_TOP_PATH);
  const prevAll = await loadExistingMovies(OUTPUT_ALL_PATH);
  const topDiff = summarizeChanges(prevTop250, top250);
  const allDiff = summarizeChanges(prevAll, allTime);

  // Payloads
  const topPayload = buildPayload({
    title: 'IMDb Top 250 Movies',
    source: 'IMDb TSV (primary) + HTML fallback',
    methodology:
      'Weighted IMDb ratings; TSV ranking replicated client-side using rating, votes, tie-breakers.',
    criteria: ['Feature-length movies', 'numVotes ≥ 2500', 'Sorted by rating then votes'],
    note: 'This snapshot mirrors IMDb Top 250 daily.',
    movies: top250,
    changeSummary: topDiff,
  });

  const allPayload = buildPayload({
    title: `IMDb All-Time Top Movies (Top ${options.allTimeLimit})`,
    source: 'IMDb TSV (ratings + votes)',
    methodology: 'Movies with numVotes ≥ 2500 sorted by rating then votes.',
    criteria: ['Movies only', 'numVotes ≥ 2500', `Top ${options.allTimeLimit} by rating`],
    note: 'Uses TSV as source of truth; enriched with awards from top250.info when available.',
    movies: allTime,
    changeSummary: allDiff,
  });

  // Write atomically
  await writeJsonAtomic(OUTPUT_TOP_PATH, topPayload);
  await writeJsonAtomic(OUTPUT_ALL_PATH, allPayload);

  console.log('✅ Files updated:');
  console.log(`   - ${CONFIG.imdbOutputJson} (Top 250)`);
  console.log(`   - ${CONFIG.allTimeOutputJson} (All-time)`);
  console.log('Change summary:');
  console.log(
    `   Top250 added ${topDiff.added}, removed ${topDiff.removed}, changed ${topDiff.changed}`
  );
  console.log(
    `   AllTime added ${allDiff.added}, removed ${allDiff.removed}, changed ${allDiff.changed}`
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_TOP_PATH = resolvePath(__dirname, CONFIG.imdbOutputJson);
const OUTPUT_ALL_PATH = resolvePath(__dirname, CONFIG.allTimeOutputJson);

if (process.argv[1] === __filename) {
  main().catch(err => {
    console.error('❌ Error in main execution:', err.message);
    process.exitCode = 1;
  });
}
