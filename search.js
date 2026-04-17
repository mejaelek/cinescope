// ============================================================
// CineScope — js/search.js
// Search page: live search with debounce, recent searches,
// result rendering, OMDb enrichment.
// ============================================================

import { searchMovies } from './api.js';
import { renderCards, showToast, openMovieModal } from './ui.js';
import { addRecentSearch, getRecentSearches, updateBadge } from './storage.js';

// ── DOM ──────────────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchGrid = document.getElementById('search-grid');
const resultsHeader = document.getElementById('results-header');
const resultsCount = document.getElementById('results-count');
const searchEmpty = document.getElementById('search-empty');
const noResults = document.getElementById('no-results');
const recentEl = document.getElementById('recent-searches');
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('main-nav');
const siteHeader = document.getElementById('site-header');

// ── State ────────────────────────────────────────────────────
let debounceTimer = null;
let currentQuery = '';

// ── Search ───────────────────────────────────────────────────

/**
 * Execute a search and display results.
 * Saves term to recent searches via localStorage.
 * @param {string} query
 */
async function doSearch(query) {
    query = query.trim();
    if (!query) return;
    currentQuery = query;

    // Show loading
    searchEmpty?.setAttribute('hidden', '');
    noResults?.setAttribute('hidden', '');
    searchGrid.innerHTML = `
    <div class="skeleton-card" aria-hidden="true"></div>
    <div class="skeleton-card" aria-hidden="true"></div>
    <div class="skeleton-card" aria-hidden="true"></div>
    <div class="skeleton-card" aria-hidden="true"></div>
  `;

    try {
        const data = await searchMovies(query);
        const results = (data.results || []).filter((m) => m.poster_path); // only with posters

        // Save to recent searches
        addRecentSearch(query);
        renderRecentSearches();

        if (results.length === 0) {
            searchGrid.innerHTML = '';
            noResults?.removeAttribute('hidden');
            resultsHeader?.setAttribute('hidden', '');
            return;
        }

        resultsHeader?.removeAttribute('hidden');
        if (resultsCount) {
            resultsCount.textContent = `${data.total_results?.toLocaleString() || results.length} results for "${query}"`;
        }

        renderCards(searchGrid, results, false);

        // Attach card click events (card opens modal)
        searchGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.movie-card');
            if (card && !e.target.closest('.card-watchlist-btn')) {
                openMovieModal(Number(card.dataset.id));
            }
        });

    } catch (err) {
        searchGrid.innerHTML = `<p style="color:var(--clr-muted);grid-column:1/-1;padding:32px 0">
      Search failed. Please check your API keys.<br/><small>${err.message}</small>
    </p>`;
        console.error(err);
    }
}

// ── Event Listeners ──────────────────────────────────────────

// Search on button click
searchBtn?.addEventListener('click', () => doSearch(searchInput.value));

// Search on Enter key
searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch(searchInput.value);
});

// Debounced live search — triggers after 500ms of inactivity
searchInput?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = searchInput.value.trim();
    if (q.length < 2) return;
    debounceTimer = setTimeout(() => doSearch(q), 500);
});

// Focus: expand input
searchInput?.addEventListener('focus', () => {
    searchInput.style.boxShadow = '0 0 0 3px rgba(230,57,70,0.15)';
});
searchInput?.addEventListener('blur', () => {
    searchInput.style.boxShadow = '';
});

// ── Recent Searches ──────────────────────────────────────────

function renderRecentSearches() {
    if (!recentEl) return;
    const recent = getRecentSearches();
    if (recent.length === 0) {
        recentEl.innerHTML = '';
        return;
    }

    recentEl.innerHTML = recent.map((term) =>
        `<button class="recent-chip" data-term="${term.replace(/"/g, '&quot;')}">${term}</button>`
    ).join('');

    recentEl.addEventListener('click', (e) => {
        const chip = e.target.closest('.recent-chip');
        if (chip) {
            const term = chip.dataset.term;
            searchInput.value = term;
            doSearch(term);
        }
    });
}

// Header scroll
window.addEventListener('scroll', () => {
    siteHeader?.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// Hamburger
hamburger?.addEventListener('click', () => {
    const open = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!open));
    mainNav?.classList.toggle('open', !open);
});

// ── Boot ─────────────────────────────────────────────────────
updateBadge();
renderRecentSearches();

// Pre-fill from URL param: ?q=avengers
const urlParams = new URLSearchParams(window.location.search);
const urlQuery = urlParams.get('q');
if (urlQuery) {
    searchInput.value = urlQuery;
    doSearch(urlQuery);
} 