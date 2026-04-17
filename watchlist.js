// ============================================================
// CineScope — js/watchlist.js
// Watchlist page: render saved films, stats, sort, clear.
// ============================================================

import { getWatchlist, removeFromWatchlist, clearWatchlist, updateBadge } from './storage.js';
import { renderCards, showToast, openMovieModal } from './ui.js';
import { GENRE_MAP } from './config.js';

// ── DOM ──────────────────────────────────────────────────────
const watchlistGrid = document.getElementById('watchlist-grid');
const emptyState = document.getElementById('empty-state');
const watchlistCount = document.getElementById('watchlist-count');
const clearBtn = document.getElementById('clear-watchlist-btn');
const sortSelect = document.getElementById('watchlist-sort');
const statTotal = document.getElementById('stat-total');
const statAvg = document.getElementById('stat-avg');
const statTopGenre = document.getElementById('stat-top-genre');
const hamburger = document.getElementById('hamburger');
const mainNav = document.getElementById('main-nav');
const siteHeader = document.getElementById('site-header');

// ── Render ───────────────────────────────────────────────────

function render() {
    const list = getSortedList();
    updateBadge();

    if (list.length === 0) {
        watchlistGrid.innerHTML = '';
        emptyState?.removeAttribute('hidden');
        watchlistCount.textContent = '0 films saved';
        updateStats([]);
        return;
    }

    emptyState?.setAttribute('hidden', '');
    watchlistCount.textContent = `${list.length} film${list.length !== 1 ? 's' : ''} saved`;

    // Render cards
    renderCards(watchlistGrid, list, false);
    updateStats(list);

    // Add remove buttons to each card (overlay on saved cards)
    watchlistGrid.querySelectorAll('.movie-card').forEach((card) => {
        const id = Number(card.dataset.id);
        const wlBtn = card.querySelector('.card-watchlist-btn');
        if (wlBtn) {
            wlBtn.textContent = '✕';
            wlBtn.classList.add('saved');
            wlBtn.setAttribute('aria-label', 'Remove from watchlist');
            wlBtn.style.opacity = '1';
            wlBtn.onclick = (e) => {
                e.stopPropagation();
                const title = card.querySelector('.card-title')?.textContent || 'Film';
                removeFromWatchlist(id);
                showToast(`"${title}" removed from watchlist`);
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(render, 300);
            };
        }

        // Card click → modal
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-watchlist-btn')) {
                openMovieModal(id);
            }
        });
    });
}

function getSortedList() {
    const order = sortSelect?.value || 'added';
    const list = [...getWatchlist()];

    return list.sort((a, b) => {
        switch (order) {
            case 'title': return a.title.localeCompare(b.title);
            case 'rating': return (b.vote_average || 0) - (a.vote_average || 0);
            default: return (b._addedAt || 0) - (a._addedAt || 0); // recently added
        }
    });
}

// ── Stats ────────────────────────────────────────────────────

function updateStats(list) {
    if (!statTotal) return;

    statTotal.textContent = list.length;

    const avgRating = list.length
        ? (list.reduce((sum, m) => sum + (m.vote_average || 0), 0) / list.length).toFixed(1)
        : '—';
    statAvg.textContent = list.length ? `${avgRating} ⭐` : '—';

    // Most common genre
    const genreCount = {};
    list.forEach((m) => {
        (m.genre_ids || []).forEach((id) => {
            genreCount[id] = (genreCount[id] || 0) + 1;
        });
    });
    const topId = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    statTopGenre.textContent = topId ? (GENRE_MAP[topId] || '—') : '—';
}

// ── Events ───────────────────────────────────────────────────

sortSelect?.addEventListener('change', render);

clearBtn?.addEventListener('click', () => {
    if (getWatchlist().length === 0) return;
    const confirmed = window.confirm('Clear your entire watchlist?');
    if (confirmed) {
        clearWatchlist();
        showToast('Watchlist cleared');
        render();
    }
});

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
render(); 