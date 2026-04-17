// ============================================================
// CineScope — js/api.js
// Centralized API service for TMDB and OMDb
// All fetch calls, error handling, and data shaping live here
// ============================================================

import { CONFIG } from './config.js';

/**
 * Generic fetch wrapper with error handling.
 * @param {string} url - Full URL to fetch
 * @returns {Promise<Object>} Parsed JSON response
 */
async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

// ── TMDB Helper ──────────────────────────────────────────────
const tmdb = (path, params = {}) => {
    const url = new URL(`${CONFIG.TMDB_BASE}${path}`);
    url.searchParams.set('api_key', CONFIG.TMDB_KEY);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
};

// ── Image URL Builders ───────────────────────────────────────
export const posterUrl = (path) => path
    ? `${CONFIG.TMDB_IMG_BASE}/${CONFIG.TMDB_POSTER_W}${path}`
    : 'https://via.placeholder.com/342x513/12121a/888888?text=No+Image';

export const backdropUrl = (path) => path
    ? `${CONFIG.TMDB_IMG_BASE}/${CONFIG.TMDB_BACKDROP}${path}`
    : '';

export const profileUrl = (path) => path
    ? `${CONFIG.TMDB_IMG_BASE}/${CONFIG.TMDB_PROFILE}${path}`
    : 'https://via.placeholder.com/185x278/1c1c28/888888?text=?';

// ── TMDB API Methods ─────────────────────────────────────────

/**
 * Fetch trending movies (week).
 * Returns rich JSON array with 20+ attributes per movie.
 */
export async function getTrending(page = 1) {
    return fetchJSON(tmdb('/trending/movie/week', { page }));
}

/**
 * Fetch top-rated movies.
 */
export async function getTopRated(page = 1) {
    return fetchJSON(tmdb('/movie/top_rated', { page }));
}

/**
 * Fetch movies currently in theatres.
 */
export async function getNowPlaying(page = 1) {
    return fetchJSON(tmdb('/movie/now_playing', { page }));
}

/**
 * Fetch detailed info for a single movie.
 * Appends credits, videos, and keywords as sub-requests.
 */
export async function getMovieDetails(movieId) {
    return fetchJSON(
        tmdb(`/movie/${movieId}`, {
            append_to_response: 'credits,videos,keywords,similar',
        })
    );
}

/**
 * Search for movies by title.
 * @param {string} query - User-entered search term
 * @param {number} page  - Pagination
 */
export async function searchMovies(query, page = 1) {
    return fetchJSON(tmdb('/search/movie', { query, page, include_adult: false }));
}

/**
 * Fetch the list of official TMDB genres.
 */
export async function getGenres() {
    return fetchJSON(tmdb('/genre/movie/list'));
}

/**
 * Fetch movies filtered by genre ID.
 * Uses the /discover endpoint — a unique TMDB endpoint for filtered browsing.
 */
export async function discoverByGenre(genreId, page = 1) {
    return fetchJSON(
        tmdb('/discover/movie', {
            with_genres: genreId,
            sort_by: 'popularity.desc',
            page,
        })
    );
}

// ── OMDb API Methods ─────────────────────────────────────────
/**
 * Fetch extended ratings data from OMDb by IMDB ID.
 * Returns Rotten Tomatoes, Metacritic, and IMDB scores.
 * This is our SECOND unique API — different endpoint & data source from TMDB.
 * @param {string} imdbId - e.g. "tt0114709"
 */
export async function getOmdbRatings(imdbId) {
    const url = `${CONFIG.OMDB_BASE}/?i=${imdbId}&apikey=${CONFIG.OMDB_KEY}`;
    try {
        const data = await fetchJSON(url);
        if (data.Response === 'False') return null;
        return data;
    } catch {
        // OMDb is supplemental; silently fail if unavailable
        return null;
    }
}

/**
 * Search OMDb by title (fallback enrichment).
 * Returns a different set of JSON attributes compared to TMDB,
 * demonstrating use of multiple unique API endpoints.
 */
export async function searchOmdb(title, year = '') {
    const url = `${CONFIG.OMDB_BASE}/?t=${encodeURIComponent(title)}&y=${year}&apikey=${CONFIG.OMDB_KEY}`;
    try {
        const data = await fetchJSON(url);
        return data.Response === 'True' ? data : null;
    } catch {
        return null;
    }
} 