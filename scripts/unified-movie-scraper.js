import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFile } from 'fs/promises';

/**
 * Configuration for the scrapers
 */
const CONFIG = {
    imdbTop250Url: "https://www.imdb.com/chart/top/",
    top250InfoUrl: "http://top250.info/movies/",
    imdbOutputJson: "top250-2025.json",  // Current IMDB Top 250
    allTimeOutputJson: "topIMDB.json",   // All-time top movies (987+)
    concurrency: 10,
    retries: 3,
    timeout: 15000,
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Referer": "https://www.imdb.com/"
    }
};

/**
 * Helper: Sleep function
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper: Fetch with retry logic
 */
async function fetchWithRetry(url, attempt = 1) {
    try {
        const response = await axios.get(url, {
            headers: CONFIG.headers,
            timeout: CONFIG.timeout
        });
        return response;
    } catch (error) {
        if (attempt >= CONFIG.retries) {
            throw error;
        }
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.warn(`⚠️ Error fetching ${url} (Attempt ${attempt}). Retrying in ${delay}ms...`);
        await sleep(delay);
        return fetchWithRetry(url, attempt + 1);
    }
}

/**
 * Scrape IMDB Top 250 List
 */
async function scrapeIMDBTop250() {
    console.time('IMDB Top 250 Execution Time');

    console.log(`🚀 Starting scrape from ${CONFIG.imdbTop250Url}`);

    try {
        const response = await fetchWithRetry(CONFIG.imdbTop250Url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Look for the JSON-LD structured data in the head
        const schemaScript = $('script[type="application/ld+json"]');
        let jsonData = null;

        for (let i = 0; i < schemaScript.length; i++) {
            try {
                const text = $(schemaScript[i]).html();
                if (text) {
                    jsonData = JSON.parse(text);
                    // Check if this is the ItemList with the top 250 movies
                    if (jsonData['@type'] === 'ItemList' && jsonData.itemListElement) {
                        break;
                    }
                }
            } catch (e) {
                continue; // Continue to next script tag if parsing fails
            }
        }

        if (!jsonData) {
            throw new Error('Could not find structured data for top 250 movies');
        }

        const movies = [];

        // Parse the movie data from the structured JSON-LD
        if (jsonData.itemListElement && Array.isArray(jsonData.itemListElement)) {
            jsonData.itemListElement.forEach((item, index) => {
                if (item['@type'] === 'ListItem' && item.item && item.item['@type'] === 'Movie') {
                    const movieItem = item.item;

                    // Extract title and year from the name field
                    let title = movieItem.name || '';
                    let year = null;

                    // Try to extract year from the name if it's in format like "Movie Name (YYYY)"
                    const titleYearMatch = title.match(/^(.*?)\s*\((\d{4})\)$/);
                    if (titleYearMatch) {
                        title = titleYearMatch[1];
                        year = parseInt(titleYearMatch[2], 10);
                    }

                    const movie = {
                        rank: item.position || (index + 1),
                        title: title,
                        year: year,
                        rating: movieItem.aggregateRating ? parseFloat(movieItem.aggregateRating.ratingValue) : null,
                        url: movieItem.url || '',
                        description: movieItem.description || '',
                        genre: movieItem.genre || '',
                        duration: movieItem.duration || ''
                    };

                    movies.push(movie);
                }
            });
        }

        console.log(`Parsed ${movies.length} movies from the structured data`);

        // Create updated IMDB Top 250 with description
        const updatedImdbTop250 = {
            description: {
                title: "IMDB Top 250 Movies",
                source: "https://www.imdb.com/chart/top/",
                methodology: "The IMDB Top 250 is calculated based on ratings from regular IMDB users. To be eligible, a film must have more than 2500 votes. The ranking is determined by a Bayesian estimate that factors in the number of ratings received by the movie as well as the weighted average of those ratings.",
                criteria: [
                    "Must be a feature-length fiction film",
                    "Must have more than 2500 ratings",
                    "Ranking based on weighted average of ratings"
                ],
                update_frequency: "Updated daily",
                data_fields: {
                    "rank": "Position in the Top 250 list",
                    "title": "Movie title",
                    "year": "Release year (may be null if not parsed from title)",
                    "rating": "IMDB rating score",
                    "url": "Link to the movie on IMDB",
                    "description": "Brief plot summary",
                    "genre": "Movie genres",
                    "duration": "Runtime in ISO 8601 format"
                },
                note: "This list represents the most highly rated movies according to IMDB users and typically includes classic and critically acclaimed films."
            },
            metadata: {
                scraped_at: new Date().toISOString(),
                total_movies: movies.length,
                source_url: "https://www.imdb.com/chart/top/"
            },
            movies: movies
        };

        // Save the complete IMDB Top 250 list with description
        await writeFile(CONFIG.imdbOutputJson, JSON.stringify(updatedImdbTop250, null, 2));

        console.log(`✅ Saved ${CONFIG.imdbOutputJson} with ${movies.length} movies and detailed description`);
        console.timeEnd('IMDB Top 250 Execution Time');

        return movies;
    } catch (error) {
        console.error('❌ Error scraping IMDB:', error.message);
        throw error;
    }
}

/**
 * Scrape All-Time Top Movies from top250.info
 */
async function scrapeAllTimeTopMovies() {
    console.time('All-Time Top Movies Execution Time');

    // Sections: 0-9 and A-Z
    const sections = ['0-9', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];
    const allMovies = new Map();

    console.log(`🚀 Starting optimized scrape from ${CONFIG.top250InfoUrl}`);
    console.log(`⚡ Concurrency: ${CONFIG.concurrency} threads`);

    // Process sections in batches to control concurrency
    for (let i = 0; i < sections.length; i += CONFIG.concurrency) {
        const batch = sections.slice(i, i + CONFIG.concurrency);

        await Promise.all(batch.map(async (sec) => {
            const url = `${CONFIG.top250InfoUrl}?${sec}`;
            try {
                const response = await fetchWithRetry(url);
                const $ = cheerio.load(response.data);

                let countInSection = 0;

                $('table tr').each((_, element) => {
                    const row = $(element);
                    const movieLink = row.find('td a[href^="/movie/"]');

                    if (movieLink.length) {
                        const title = movieLink.text().trim();
                        const href = movieLink.attr('href');
                        const movieId = href.match(/\/movie\/\?(\d+)/)?.[1];

                        if (title && movieId && !allMovies.has(movieId)) {
                            // Extract ratings cleanly
                            const ratingCell = row.find('td').eq(1); // Usually the second cell
                            const ratingText = ratingCell.text().trim();
                            const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
                            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

                            // Extract awards
                            const awards = [];
                            row.find('img').each((_, img) => {
                                const titleAttr = $(img).attr('title');
                                if (titleAttr) awards.push(titleAttr);
                            });

                            allMovies.set(movieId, {
                                id: movieId,
                                title: title,
                                rating: rating,
                                awards: awards,
                                url: `http://top250.info${href}`
                            });
                            countInSection++;
                        }
                    }
                });

                console.log(`✅ Section ${sec}: Found ${countInSection} movies`);

            } catch (error) {
                console.error(`❌ Failed to process section ${sec}: ${error.message}`);
            }
        }));
    }

    // Sort and Save
    const sortedMovies = Array.from(allMovies.values()).sort((a, b) => a.title.localeCompare(b.title));

    // Create updated all-time top movies with description
    const updatedAllTimeTopMovies = {
        description: {
            title: "All-Time Top Movies Collection",
            source: "http://top250.info/movies/",
            methodology: "This collection aggregates top-rated movies from various sources and categories. The data was collected by scraping the top250.info website which compiles movies from different rating systems and award recognition.",
            criteria: [
                "Includes movies from various decades and genres",
                "Based on multiple rating sources and award recognition",
                "Compilation of top-rated films across different categories"
            ],
            update_frequency: "Static snapshot taken during scraping",
            data_fields: {
                "id": "Unique identifier for the movie on the source site",
                "title": "Movie title with release year in parentheses",
                "rating": "Rating from the source site (currently null in this dataset)",
                "awards": "Array of awards and recognitions (Oscars, box office achievements, etc.)",
                "url": "Link to the movie page on the source site"
            },
            note: "This collection includes ~987+ movies from various time periods, representing a broader compilation than just the IMDB Top 250."
        },
        metadata: {
            scraped_at: new Date().toISOString(),
            total_movies: sortedMovies.length,
            source_url: "http://top250.info/movies/"
        },
        movies: sortedMovies
    };

    await writeFile(CONFIG.allTimeOutputJson, JSON.stringify(updatedAllTimeTopMovies, null, 2));

    console.log("-".repeat(40));
    console.log(`🎉 All-Time Top Movies Scraping Completed!`);
    console.log(`📚 Total Movies: ${sortedMovies.length}`);
    console.log(`💾 JSON Data: ${CONFIG.allTimeOutputJson}`);
    console.timeEnd('All-Time Top Movies Execution Time');

    return sortedMovies;
}

/**
 * Main function to run both scrapers
 */
async function main() {
    console.log("🎬 Starting unified movie scraper...");
    console.log("📊 This will create:");
    console.log("   - top250-2025.json: Current IMDB Top 250 list");
    console.log("   - topIMDB.json: All-time top movies (~987+ films)");
    
    try {
        // Scrape IMDB Top 250 first
        console.log("\n🔍 Fetching current IMDB Top 250 list...");
        await scrapeIMDBTop250();
        
        // Then scrape all-time top movies
        console.log("\n🔍 Fetching all-time top movies list...");
        await scrapeAllTimeTopMovies();
        
        console.log("\n🎉 All scraping completed successfully!");
        console.log(`📊 Files created:`);
        console.log(`   - top250-2025.json (Current IMDB Top 250)`);
        console.log(`   - topIMDB.json (All-time top movies)`);
    } catch (error) {
        console.error('❌ Error in main execution:', error.message);
        throw error;
    }
}

// Execute
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
    main().catch(console.error);
}