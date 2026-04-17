// ============================================================
// CineScope — js/storage.js
// All LocalStorage read/write operations in one place.
// Saves and retrieves: watchlist, recent searches, user prefs.
// ============================================================

import { CONFIG } from './config.js';

// ── Watchlist ────────────────────────────────────────────────

/**
 * Read the entire watchlist array from localStorage.
 * @returns {Array} Array of movie objects (may be empty)
 */
export function getWatchlist() {
    try {
        const raw = localStorage.getItem(CONFIG.LS_WATCHLIST);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Save the full watchlist array to localStorage.
 * @param {Array} list
 */
function saveWatchlist(list) {
    localStorage.setItem(CONFIG.LS_WATCHLIST, JSON.stringify(list));
}

/**
 * Add a movie to the watchlist (if not already present).
 * Stores an object with at least: id, title, poster_path, vote_average, genre_ids, release_date
 * Also stores a timestamp for "recently added" sorting.
 * @param {Object} movie - TMDB movie object
 */
export function addToWatchlist(movie) {
    const list = getWatchlist();
    if (list.find((m) => m.id === movie.id)) return false; // already saved
    list.unshift({ ...movie, _addedAt: Date.now() });
    saveWatchlist(list);
    updateBadge();
    return true;
}

/**
 * Remove a movie from the watchlist by its TMDB id.
 * @param {number} movieId
 */
export function removeFromWatchlist(movieId) {
    const list = getWatchlist().filter((m) => m.id !== movieId);
    saveWatchlist(list);
    updateBadge();
}

/**
 * Toggle watchlist status. Returns true if added, false if removed.
 * @param {Object} movie
 */
export function toggleWatchlist(movie) {
    const list = getWatchlist();
    if (list.find((m) => m.id === movie.id)) {
        removeFromWatchlist(movie.id);
        return false;
    } else {
        addToWatchlist(movie);
        return true;
    }
}

/**
 * Check whether a movie is in the watchlist.
 * @param {number} movieId
 */
export function isInWatchlist(movieId) {
    return getWatchlist().some((m) => m.id === movieId);
}

/**
 * Clear the entire watchlist.
 */
export function clearWatchlist() {
    localStorage.removeItem(CONFIG.LS_WATCHLIST);
    updateBadge();
}

// ── Recent Searches ──────────────────────────────────────────

/**
 * Retrieve the list of recent search terms.
 * @returns {string[]}
 */
export function getRecentSearches() {
    try {
        const raw = localStorage.getItem(CONFIG.LS_SEARCHES);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Add a search term to recent searches (max 6, no duplicates).
 * @param {string} term
 */
export function addRecentSearch(term) {
    const searches = getRecentSearches().filter(
        (s) => s.toLowerCase() !== term.toLowerCase()
    );
    searches.unshift(term);
    localStorage.setItem(
        CONFIG.LS_SEARCHES,
        JSON.stringify(searches.slice(0, CONFIG.MAX_RECENT_SEARCHES))
    );
}

/**
 * Clear all recent searches.
 */
export function clearRecentSearches() {
    localStorage.removeItem(CONFIG.LS_SEARCHES);
}

// ── User Preferences ─────────────────────────────────────────
// Stores: lastSortPref, lastGenrePref, dismissedNotices

/**
 * Get a single preference by key.
 * @param {string} key
 * @param {*} defaultValue
 */
export function getPref(key, defaultValue = null) {
    try {
        const raw = localStorage.getItem(CONFIG.LS_PREFS);
        const prefs = raw ? JSON.parse(raw) : {};
        return key in prefs ? prefs[key] : defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * Set a single preference.
 * @param {string} key
 * @param {*} value
 */
export function setPref(key, value) {
    try {
        const raw = localStorage.getItem(CONFIG.LS_PREFS);
        const prefs = raw ? JSON.parse(raw) : {};
        prefs[key] = value;
        localStorage.setItem(CONFIG.LS_PREFS, JSON.stringify(prefs));
    } catch {
        // Silently fail in private mode
    }
}

// ── Badge Helper ─────────────────────────────────────────────

/**
 * Update all nav watchlist badge counts.
 * Called after every watchlist mutation.
 */
export function updateBadge() {
    const count = getWatchlist().length;
    document.querySelectorAll('#nav-badge').forEach((el) => {
        el.textContent = count;
        el.style.display = count === 0 ? 'none' : '';
    });
} 
