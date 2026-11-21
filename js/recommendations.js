// ============================================================
// CineScope — js/recommendations.js
// Intelligent movie recommendation engine based on watchlist data.
// Combines genre frequency weighting with TMDB movie recommendations.
// ============================================================

import { getWatchlist, isInWatchlist } from './storage.js';
import { getMovieRecommendations, discoverByGenre } from './api.js';

/**
 * Generate personalized recommendations using films currently in the user's watchlist.
 * 
 * Algorithm:
 * 1. Calculate frequency of genre_ids across the watchlist to find the user's top genre.
 * 2. Query TMDB's /movie/{id}/recommendations for the 2 most recently added films.
 * 3. Query TMDB's discover endpoint for top rated/popular films in the top genre.
 * 4. Merge, deduplicate by ID, and filter out any film already in the user's watchlist.
 * 5. Sort by vote_average descending and return top candidates.
 * 
 * @param {number} limit - Maximum number of recommendations to return (default: 8)
 * @returns {Promise<{reason: string, topGenreId?: number|null, basedOn: string[], movies: Array}>}
 */
export async function getPersonalizedRecommendations(limit = 8) {
    const watchlist = getWatchlist();
    if (!watchlist || watchlist.length === 0) {
        return {
            reason: 'empty',
            basedOn: [],
            movies: []
        };
    }

    // 1. Tally genre frequencies across the entire watchlist
    const genreCounts = {};
    watchlist.forEach((movie) => {
        (movie.genre_ids || []).forEach((genreId) => {
            genreCounts[genreId] = (genreCounts[genreId] || 0) + 1;
        });
    });

    const topGenreId = Object.keys(genreCounts).sort(
        (a, b) => genreCounts[b] - genreCounts[a]
    )[0];

    // 2. Fetch recommendations for the 2 most recently added films
    const recentMovies = watchlist.slice(0, 2);
    const recPromises = recentMovies.map((m) =>
        getMovieRecommendations(m.id).catch(() => ({ results: [] }))
    );

    // Also fetch popular films matching their #1 genre
    if (topGenreId) {
        recPromises.push(
            discoverByGenre(Number(topGenreId), 1).catch(() => ({ results: [] }))
        );
    }

    const responses = await Promise.all(recPromises);

    // 3. Merge, deduplicate, and exclude any films already saved in the watchlist
    const candidates = responses.flatMap((r) => r?.results || []);
    const uniqueMap = new Map();

    for (const movie of candidates) {
        if (!movie || !movie.id || isInWatchlist(movie.id)) continue;
        if (!uniqueMap.has(movie.id)) {
            uniqueMap.set(movie.id, movie);
        }
    }

    // 4. Rank by rating (vote_average) and slice to requested limit
    const recommendedList = Array.from(uniqueMap.values())
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, limit);

    return {
        reason: 'success',
        topGenreId: topGenreId ? Number(topGenreId) : null,
        basedOn: recentMovies.map((m) => m.title).filter(Boolean),
        movies: recommendedList,
    };
}
