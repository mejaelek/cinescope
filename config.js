// ============================================================
// CineScope — js/config.js
// API keys, endpoints, and app-wide constants
// ============================================================

/**
 * INSTRUCTIONS FOR SETUP:
 * 1. Get a free TMDB API key at https://www.themoviedb.org/settings/api
 * 2. Get a free OMDb API key at https://www.omdbapi.com/apikey.aspx
 * 3. Replace the placeholder values below with your real keys
 */

export const CONFIG = {
    // ── TMDB (The Movie Database) ─────────────────────────────
    // API docs: https://developer.themoviedb.org/docs
    TMDB_KEY: 'YOUR_TMDB_API_KEY_HERE',   // ← replace with real key
    TMDB_BASE: 'https://api.themoviedb.org/3',
    TMDB_IMG_BASE: 'https://image.tmdb.org/t/p',
    TMDB_POSTER_W: 'w342',
    TMDB_BACKDROP: 'w1280',
    TMDB_PROFILE: 'w185',

    // ── OMDb (Open Movie Database) ────────────────────────────
    // API docs: https://www.omdbapi.com
    OMDB_KEY: 'YOUR_OMDB_API_KEY_HERE',   // ← replace with real key
    OMDB_BASE: 'https://www.omdbapi.com',

    // ── LocalStorage Keys ─────────────────────────────────────
    LS_WATCHLIST: 'cinescope_watchlist',
    LS_SEARCHES: 'cinescope_recent_searches',
    LS_PREFS: 'cinescope_preferences',
    LS_THEME: 'cinescope_theme',
    LS_GENRE_PREF: 'cinescope_genre_pref',

    // ── App Settings ──────────────────────────────────────────
    MAX_RECENT_SEARCHES: 6,
    MOVIES_PER_PAGE: 18,
    TOAST_DURATION: 3000,  // ms
};

// TMDB Genre ID → Name mapping
export const GENRE_MAP = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Sci-Fi',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
};

// Curated film trivia / facts
export const FILM_FACTS = [
    'The Lumière Brothers held the world\'s first public film screening on December 28, 1895 in Paris.',
    'Alfred Hitchcock appeared as an extra in 39 of his own films — a tradition he called a "cameo".',
    'The shower scene in Psycho (1960) used 70 different camera angles across 3 days of filming.',
    'Titanic (1997) cost more to produce than the actual ship did to build, adjusted for inflation.',
    'The Wilhelm Scream — a stock sound effect — has been used in over 400 films and TV shows.',
    'James Cameron directed Titanic and Avatar, the two highest-grossing films of their eras.',
    'The Lord of the Rings trilogy was filmed entirely in New Zealand over 438 days.',
    'Blade Runner (1982) flopped at the box office but is now considered one of the greatest films ever made.',
    'Forrest Gump used digital effects to insert the lead character into real historical footage.',
    'The budget for The Dark Knight\'s marketing campaign exceeded the film\'s actual production budget.',
    'Interstellar\'s black hole visualisation, Gargantua, was so scientifically accurate it led to new academic papers.',
    'Heath Ledger kept a personal diary for his role as The Joker, filling it with dark thoughts and images.',
    'Tom Hanks and Meg Ryan never shared a scene together in You\'ve Got Mail until late in production.',
    'The entire film Birdman (2014) appears to be shot in one continuous take — an editing masterpiece.',
    'Stanley Kubrick destroyed nearly all prints of his debut feature, Fear and Desire (1953).',
];