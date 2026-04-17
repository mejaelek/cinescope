// ============================================================
// CineScope — js/main.js
// Home page: hero, trending grid, genre filter, film strip,
// sort, load more, film facts.
// ============================================================

import { CONFIG, GENRE_MAP, FILM_FACTS } from './config.js';
import { getTrending, getNowPlaying, getGenres, discoverByGenre, backdropUrl, posterUrl } from './api.js';
import { renderCards, showToast, openMovieModal, initScrollReveal } from './ui.js';
import { toggleWatchlist, isInWatchlist, updateBadge } from './storage.js';

// ── State ────────────────────────────────────────────────────
const state = {
    allMovies: [],       // Full un-filtered list
    displayed: [],       // Currently visible
    page: 1,
    activeGenre: 'all',
    sortOrder: 'popularity',
    loading: false,
    heroMovie: null,
};

// ── DOM References ───────────────────────────────────────────
const movieGrid = document.getElementById('movie-grid');
const genreFilters = document.getElementById('genre-filters');
const sortSelect = document.getElementById('sort-select');
const loadMoreBtn = document.getElementById('load-more-btn');
const filmStrip = document.getElementById('film-strip');
const quoteText = document.getElementById('quote-text');
const refreshQuote = document.getElementById('refresh-quote');
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('main-nav');
const siteHeader = document.getElementById('site-header');

// ── Initialization ───────────────────────────────────────────
async function init() {
    updateBadge();
    initHeader();
    initHamburger();
    initScrollReveal();
    showFact();

    try {
        // Parallel fetches: trending + now playing + genres
        const [trendingData, nowData, genresData] = await Promise.all([
            getTrending(1),
            getNowPlaying(1),
            getGenres(),
        ]);

        state.allMovies = trendingData.results || [];
        state.page = 1;

        // Set hero to #1 trending film
        if (state.allMovies.length > 0) {
            setHero(state.allMovies[0]);
        }

        // Build genre filter buttons
        buildGenreFilters(state.allMovies, genresData.genres || []);

        // Render movie grid
        applyFiltersAndSort();

        // Render film strip (now playing)
        renderFilmStrip(nowData.results || []);

    } catch (err) {
        movieGrid.innerHTML = `<p style="color:var(--clr-muted);grid-column:1/-1;padding:32px 0">
      Could not load films. Please check your API keys in js/config.js.<br/>
      <small>${err.message}</small>
    </p>`;
        console.error('Init error:', err);
    }
}

// ── Hero Banner ──────────────────────────────────────────────

/**
 * Populate the hero banner with the most trending film.
 * Uses backdrop image, title, synopsis, and meta tags.
 */
function setHero(movie) {
    state.heroMovie = movie;

    const heroBg = document.getElementById('hero-bg');
    const heroTitle = document.getElementById('hero-title');
    const heroSynopsis = document.getElementById('hero-synopsis');
    const heroMeta = document.getElementById('hero-meta');
    const heroDetails = document.getElementById('hero-details-btn');
    const heroWl = document.getElementById('hero-watchlist-btn');

    if (heroBg && movie.backdrop_path) {
        heroBg.style.backgroundImage = `url(${backdropUrl(movie.backdrop_path)})`;
    }
    if (heroTitle) heroTitle.textContent = movie.title;
    if (heroSynopsis) heroSynopsis.textContent = movie.overview;

    if (heroMeta) {
        const year = movie.release_date?.slice(0, 4) || '';
        const score = movie.vote_average?.toFixed(1) || '';
        heroMeta.innerHTML = `
      ${score ? `<span class="meta-tag meta-rating">⭐ ${score}</span>` : ''}
      ${year ? `<span class="meta-tag">${year}</span>` : ''}
      ${(movie.genre_ids || []).slice(0, 2).map((id) =>
            GENRE_MAP[id] ? `<span class="meta-tag">${GENRE_MAP[id]}</span>` : ''
        ).join('')}
    `;
    }

    // Hero button events
    heroDetails?.addEventListener('click', () => openMovieModal(movie.id));
    heroWl?.addEventListener('click', () => {
        const added = toggleWatchlist(movie);
        heroWl.textContent = added ? '♥ Saved' : '+ Add to Watchlist';
        updateBadge();
        showToast(added ? `"${movie.title}" added to watchlist ♥` : 'Removed from watchlist', added ? 'success' : 'info');
    });

    // Update hero watchlist button state
    if (heroWl && isInWatchlist(movie.id)) {
        heroWl.textContent = '♥ Saved';
    }
}

// ── Genre Filters ────────────────────────────────────────────

function buildGenreFilters(movies, allGenres) {
    // Only show genres that appear in current results
    const activeIds = new Set(movies.flatMap((m) => m.genre_ids || []));
    const relevant = allGenres.filter((g) => activeIds.has(g.id)).slice(0, 8);

    relevant.forEach((genre) => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = genre.name;
        btn.dataset.genre = genre.id;
        btn.setAttribute('aria-pressed', 'false');
        genreFilters.appendChild(btn);
    });
}

genreFilters?.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    // Update active state
    genreFilters.querySelectorAll('.filter-btn').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');

    state.activeGenre = btn.dataset.genre || 'all';
    applyFiltersAndSort();
});

// ── Sort ─────────────────────────────────────────────────────

sortSelect?.addEventListener('change', () => {
    state.sortOrder = sortSelect.value;
    applyFiltersAndSort();
});

// ── Filter + Sort + Render ───────────────────────────────────

function applyFiltersAndSort() {
    let movies = [...state.allMovies];

    // Filter by genre
    if (state.activeGenre !== 'all') {
        const id = Number(state.activeGenre);
        movies = movies.filter((m) => (m.genre_ids || []).includes(id));
    }

    // Sort
    movies = sortMovies(movies, state.sortOrder);

    // Render first page
    state.displayed = movies.slice(0, CONFIG.MOVIES_PER_PAGE);
    renderCards(movieGrid, state.displayed, false);
}

function sortMovies(movies, order) {
    return [...movies].sort((a, b) => {
        switch (order) {
            case 'rating': return b.vote_average - a.vote_average;
            case 'title': return a.title.localeCompare(b.title);
            case 'release': return new Date(b.release_date) - new Date(a.release_date);
            default: return b.popularity - a.popularity;  // popularity
        }
    });
}

// ── Load More ────────────────────────────────────────────────

loadMoreBtn?.addEventListener('click', async () => {
    if (state.loading) return;
    state.loading = true;
    loadMoreBtn.textContent = 'Loading…';
    loadMoreBtn.disabled = true;

    try {
        state.page++;
        const data = await getTrending(state.page);
        const newMovies = data.results || [];
        state.allMovies.push(...newMovies);
        const sorted = sortMovies(newMovies, state.sortOrder);
        renderCards(movieGrid, sorted, true);
    } catch {
        showToast('Failed to load more films', 'error');
    } finally {
        state.loading = false;
        loadMoreBtn.textContent = 'Load More Films';
        loadMoreBtn.disabled = false;
    }
});

// ── Film Strip ───────────────────────────────────────────────

function renderFilmStrip(movies) {
    if (!filmStrip) return;
    filmStrip.innerHTML = '';
    movies.slice(0, 12).forEach((movie) => {
        filmStrip.insertAdjacentHTML('beforeend', `
      <div
        class="strip-card"
        role="listitem"
        tabindex="0"
        aria-label="${movie.title}"
        data-id="${movie.id}"
      >
        <img
          src="${posterUrl(movie.poster_path)}"
          alt="${movie.title}"
          loading="lazy"
          width="140"
        />
        <div class="strip-card-title">${movie.title}</div>
      </div>
    `);
    });

    // Click events on strip
    filmStrip.addEventListener('click', (e) => {
        const card = e.target.closest('.strip-card');
        if (card) openMovieModal(Number(card.dataset.id));
    });
    filmStrip.addEventListener('keydown', (e) => {
        const card = e.target.closest('.strip-card');
        if (card && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            openMovieModal(Number(card.dataset.id));
        }
    });
}

// ── Film Facts ───────────────────────────────────────────────

let factIndex = 0;

function showFact() {
    if (!quoteText) return;
    quoteText.style.opacity = '0';
    setTimeout(() => {
        quoteText.textContent = FILM_FACTS[factIndex % FILM_FACTS.length];
        quoteText.style.opacity = '1';
        factIndex++;
    }, 300);
}

refreshQuote?.addEventListener('click', showFact);

// Cycle fact every 10 seconds
setInterval(showFact, 10000);

// ── Header Scroll Effect ─────────────────────────────────────

function initHeader() {
    window.addEventListener('scroll', () => {
        siteHeader?.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
}

// ── Hamburger Menu ───────────────────────────────────────────

function initHamburger() {
    hamburger?.addEventListener('click', () => {
        const open = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', String(!open));
        mainNav?.classList.toggle('open', !open);
    });

    // Close menu on nav link click
    mainNav?.querySelectorAll('.nav-link').forEach((link) => {
        link.addEventListener('click', () => {
            hamburger?.setAttribute('aria-expanded', 'false');
            mainNav.classList.remove('open');
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!hamburger?.contains(e.target) && !mainNav?.contains(e.target)) {
            hamburger?.setAttribute('aria-expanded', 'false');
            mainNav?.classList.remove('open');
        }
    });
}

// ── Boot ─────────────────────────────────────────────────────
init(); 
