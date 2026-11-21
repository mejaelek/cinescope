// ============================================================
// CineScope — js/ui.js
// Shared & worked UI helpers or builders: toast, modal, card builder, genre tags
// ============================================================

import { CONFIG, GENRE_MAP } from './config.js';
import { posterUrl, backdropUrl, profileUrl, getMovieDetails, getOmdbRatings } from './api.js';
import { toggleWatchlist, isInWatchlist, updateBadge } from './storage.js';

// ── Toast Notification ───────────────────────────────────────
let toastTimer = null;

/**
 * Show a brief toast message at the bottom of the screen.
 * @param {string} message
 * @param {string} type - 'success' | 'info' | 'error'
 */
export function showToast(message, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  clearTimeout(toastTimer);

  el.textContent = message;
  el.style.borderColor =
    type === 'success' ? 'var(--clr-accent)' :
      type === 'error' ? '#ff4757' :
        'var(--clr-border)';
  el.classList.add('show');

  toastTimer = setTimeout(() => el.classList.remove('show'), CONFIG.TOAST_DURATION);
}

// ── Modal ────────────────────────────────────────────────────
const modalOverlay = () => document.getElementById('modal-overlay');
const modalContent = () => document.getElementById('modal-content');

export function openModal(html) {
  const overlay = modalOverlay();
  const content = modalContent();
  if (!overlay || !content) return;
  content.innerHTML = html;
  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  // Close on overlay click
  overlay.addEventListener('click', handleOverlayClick);
  document.getElementById('modal-close')
    ?.addEventListener('click', closeModal);
}

export function closeModal() {
  const overlay = modalOverlay();
  if (!overlay) return;
  overlay.setAttribute('hidden', '');
  document.body.style.overflow = '';
  overlay.removeEventListener('click', handleOverlayClick);

  // Clean ?movie= parameter from URL if present
  if (window.location.search.includes('movie=')) {
    const cleanUrl = new URL(window.location);
    cleanUrl.searchParams.delete('movie');
    window.history.replaceState({}, '', cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ''));
  }
}

function handleOverlayClick(e) {
  if (e.target === modalOverlay()) closeModal();
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ── Genre Helper ─────────────────────────────────────────────

/**
 * Convert an array of genre IDs to a display string.
 * @param {number[]} ids
 * @param {number} max - Max genres to show
 */
export function genreNames(ids = [], max = 2) {
  return ids
    .slice(0, max)
    .map((id) => GENRE_MAP[id] || '')
    .filter(Boolean)
    .join(' · ');
}

/**
 * Return a single genre name (first match).
 */
export function firstGenre(ids = []) {
  return GENRE_MAP[ids[0]] || 'Film';
}

// ── Rating Star ──────────────────────────────────────────────
export function starRating(score) {
  const pct = Math.round((score / 10) * 100);
  return `⭐ ${score.toFixed(1)}`;
}

// ── Movie Card Builder ───────────────────────────────────────

/**
 * Build a movie card HTML string from a TMDB movie object.
 * @param {Object} movie - TMDB movie object
 * @returns {string} HTML string
 */
export function buildCard(movie) {
  const saved = isInWatchlist(movie.id);
  const year = movie.release_date?.slice(0, 4) || '—';
  const genre = firstGenre(movie.genre_ids || []);
  const score = movie.vote_average?.toFixed(1) || '—';

  return `
    <article
      class="movie-card"
      data-id="${movie.id}"
      data-genres="${(movie.genre_ids || []).join(',')}"
      data-title="${movie.title?.replace(/"/g, '&quot;')}"
      tabindex="0"
      role="button"
      aria-label="View details for ${movie.title}"
    >
      <div class="card-poster">
        <img
          src="${posterUrl(movie.poster_path)}"
          alt="Poster for ${movie.title}"
          loading="lazy"
          width="342"
          height="513"
        />
        <span class="card-rating">${score}</span>
        <button
          class="card-watchlist-btn ${saved ? 'saved' : ''}"
          data-id="${movie.id}"
          aria-label="${saved ? 'Remove from watchlist' : 'Add to watchlist'}"
          aria-pressed="${saved}"
        >${saved ? '♥' : '♡'}</button>
      </div>
      <div class="card-body">
        <h3 class="card-title">${movie.title}</h3>
        <div class="card-meta">
          <span>${year}</span>
          <span class="card-genre-tag">${genre}</span>
        </div>
      </div>
    </article>
  `;
}

/**
 * Render a list of movie cards into a container.
 * Attaches click and watchlist toggle events.
 * @param {HTMLElement} container
 * @param {Object[]} movies
 * @param {boolean} append - if true, appends; otherwise replaces
 */
export function renderCards(container, movies, append = false) {
  if (!append) container.innerHTML = '';
  movies.forEach((movie) => {
    container.insertAdjacentHTML('beforeend', buildCard(movie));
  });
  attachCardEvents(container);
}

/**
 * Attach click events to cards in a container.
 * Uses event delegation for efficiency.
 */
export function attachCardEvents(container) {
  container.addEventListener('click', (e) => {
    // Watchlist button
    const wlBtn = e.target.closest('.card-watchlist-btn');
    if (wlBtn) {
      e.stopPropagation();
      const card = wlBtn.closest('.movie-card');
      const id = Number(wlBtn.dataset.id);
      // Minimal object needed for watchlist storage
      const rawGenres = card.dataset.genres;
      const movie = {
        id,
        title: card.querySelector('.card-title').textContent,
        poster_path: card.querySelector('img').src.includes('placeholder')
          ? null
          : card.querySelector('img').src.split('/w342')[1],
        vote_average: parseFloat(card.querySelector('.card-rating').textContent),
        genre_ids: rawGenres ? rawGenres.split(',').filter(Boolean).map(Number) : [],
        release_date: card.querySelector('.card-meta span').textContent + '-01-01',
      };
      const added = toggleWatchlist(movie);
      wlBtn.textContent = added ? '♥' : '♡';
      wlBtn.classList.toggle('saved', added);
      wlBtn.setAttribute('aria-pressed', added);
      showToast(added ? `"${movie.title}" added to watchlist ♥` : `Removed from watchlist`, added ? 'success' : 'info');
      return;
    }

    // Card click → open modal
    const card = e.target.closest('.movie-card');
    if (card) {
      const id = Number(card.dataset.id);
      openMovieModal(id);
    }
  });

  // Keyboard accessibility
  container.querySelectorAll('.movie-card').forEach((card) => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMovieModal(Number(card.dataset.id));
      }
    });
  });
}

// ── Movie Detail Modal ───────────────────────────────────────

/**
 * Fetch full details and render the movie modal.
 * Combines TMDB detailed data + OMDb supplemental ratings.
 */
export async function openMovieModal(movieId) {
  // Show loading state
  openModal(`<div style="padding:80px;text-align:center;color:var(--clr-muted)">Loading…</div>`);

  try {
    // Parallel fetch: TMDB details + OMDb supplemental
    const [movie, omdb] = await Promise.all([
      getMovieDetails(movieId),
      (async () => {
        const detail = await getMovieDetails(movieId);
        return getOmdbRatings(detail.imdb_id);
      })(),
    ]);

    const year = movie.release_date?.slice(0, 4) || '';
    const cast = (movie.credits?.cast || []).slice(0, 10);
    const trailer = (movie.videos?.results || []).find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    );
    const genres = (movie.genres || []).map((g) => g.name).join(', ');
    const runtime = movie.runtime
      ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
      : '—';

    // Build ratings from both APIs
    const tmdbRating = movie.vote_average?.toFixed(1);
    const omdbRatings = omdb?.Ratings || [];

    const ratingsHtml = `
      <div class="ratings-row">
        <div class="rating-badge">
          <span class="rating-source">TMDB</span>
          <span class="rating-value">⭐ ${tmdbRating}</span>
        </div>
        ${omdbRatings.map((r) => `
          <div class="rating-badge">
            <span class="rating-source">${r.Source.replace('Internet Movie Database', 'IMDb').replace('Rotten Tomatoes', 'RT').replace('Metacritic', 'MC')}</span>
            <span class="rating-value">${r.Value}</span>
          </div>
        `).join('')}
      </div>
    `;

    const castHtml = cast.length ? `
      <p class="modal-section-title">Cast</p>
      <div class="cast-row">
        ${cast.map((c) => `
          <div class="cast-card">
            <img class="cast-photo" src="${profileUrl(c.profile_path)}" alt="${c.name}" loading="lazy" />
            <div class="cast-name">${c.name}</div>
            <div class="cast-role">${c.character || ''}</div>
          </div>
        `).join('')}
      </div>
    ` : '';

    const saved = isInWatchlist(movie.id);

    const html = `
      ${movie.backdrop_path
        ? `<img class="modal-backdrop" src="${backdropUrl(movie.backdrop_path)}" alt="Backdrop for ${movie.title}" /><div class="modal-backdrop-overlay"></div>`
        : ''
      }
      <div class="modal-content">
        <div class="modal-poster-row">
          <img class="modal-poster" src="${posterUrl(movie.poster_path)}" alt="${movie.title} poster" width="120" />
          <div class="modal-titles">
            <h2 class="modal-title" id="modal-title">${movie.title}</h2>
            ${movie.tagline ? `<p class="modal-tagline">${movie.tagline}</p>` : ''}
            <div class="modal-meta-row">
              ${year ? `<span class="meta-tag">${year}</span>` : ''}
              <span class="meta-tag">${runtime}</span>
              ${movie.original_language ? `<span class="meta-tag">${movie.original_language.toUpperCase()}</span>` : ''}
            </div>
          </div>
        </div>

        ${ratingsHtml}

        <p class="modal-overview">${movie.overview || 'No synopsis available.'}</p>

        <div class="modal-info-grid">
          <div class="info-cell"><div class="info-label">Genres</div><div class="info-value">${genres || '—'}</div></div>
          <div class="info-cell"><div class="info-label">Director</div><div class="info-value">${(movie.credits?.crew || []).find((c) => c.job === 'Director')?.name || '—'}</div></div>
          <div class="info-cell"><div class="info-label">Budget</div><div class="info-value">${movie.budget ? '$' + (movie.budget / 1e6).toFixed(1) + 'M' : '—'}</div></div>
          <div class="info-cell"><div class="info-label">Revenue</div><div class="info-value">${movie.revenue ? '$' + (movie.revenue / 1e6).toFixed(1) + 'M' : '—'}</div></div>
          ${omdb ? `<div class="info-cell"><div class="info-label">Awards</div><div class="info-value">${omdb.Awards || '—'}</div></div>` : ''}
          ${omdb ? `<div class="info-cell"><div class="info-label">Box Office</div><div class="info-value">${omdb.BoxOffice || '—'}</div></div>` : ''}
        </div>

        ${castHtml}

        <div class="modal-actions" style="margin-top:24px;">
          <button
            class="btn btn-primary"
            id="modal-wl-btn"
            data-id="${movie.id}"
          >${saved ? '♥ In Watchlist' : '+ Add to Watchlist'}</button>

          <button
            type="button"
            class="btn btn-whatsapp"
            id="modal-share-wa-btn"
          >💬 Share</button>

          ${trailer
        ? `<a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" rel="noopener" class="btn btn-ghost">▶ Watch Trailer</a>`
        : ''
      }
        </div>
      </div>
    `;

    openModal(html);

    // Re-attach watchlist button in modal
    document.getElementById('modal-wl-btn')?.addEventListener('click', (e) => {
      const added = toggleWatchlist(movie);
      e.currentTarget.textContent = added ? '♥ In Watchlist' : '+ Add to Watchlist';
      updateBadge();
      showToast(
        added ? `"${movie.title}" added to watchlist ♥` : 'Removed from watchlist',
        added ? 'success' : 'info'
      );
    });

    // WhatsApp Share listener (Hybrid Approach: Web Share API with image file + wa.me URL fallback)
    document.getElementById('modal-share-wa-btn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const originalText = btn.innerHTML;

      const movieYear = movie.release_date?.slice(0, 4) || '';
      const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
      const overview = movie.overview ? movie.overview.slice(0, 140) + '...' : '';

      // Build deep-link URL pointing to index.html with the movie ID
      const movieLink = new URL(window.location.href);
      movieLink.search = `?movie=${movie.id}`;
      movieLink.pathname = movieLink.pathname.replace(/(watchlist|search)\.html$/, 'index.html');

      const caption =
        `🍿 *Check out this movie recommendation on CineScope!*

🎬 *${movie.title}* ${movieYear ? `(${movieYear})` : ''}
⭐ *Rating:* ${rating}/10
${overview ? `\n📝 ${overview}\n` : ''}
🔗 *View in CineScope:* ${movieLink.toString()}`;

      const imageShareUrl = movie.poster_path
        ? `${CONFIG.TMDB_IMG_BASE}/w500${movie.poster_path}`
        : null;

      // Check synchronous capability: can this browser share image files?
      const canShareFile = typeof navigator !== 'undefined'
        && typeof navigator.canShare === 'function'
        && typeof navigator.share === 'function'
        && (() => {
          try {
            return navigator.canShare({ files: [new File([], 't.jpg', { type: 'image/jpeg' })] });
          } catch {
            return false;
          }
        })();

      // Method 1: If file sharing is supported (Mobile/compatible browsers), attach the real poster image
      if (canShareFile && imageShareUrl) {
        try {
          btn.disabled = true;
          btn.textContent = '⏳ Preparing…';

          const res = await fetch(imageShareUrl);
          const blob = await res.blob();
          const cleanTitle = (movie.title || 'movie').replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const file = new File([blob], `${cleanTitle}_poster.jpg`, { type: 'image/jpeg' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: movie.title,
              text: caption,
            });
            return; // Successfully shared with image attached!
          }
        } catch (err) {
          // If the user cancelled/closed the native share sheet, do not open fallback
          if (err.name === 'AbortError') return;
          console.warn('Native file share failed, falling back to WhatsApp URL:', err);
        } finally {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      }

      // Method 2: Fallback for desktop & browsers without file share support
      let fallbackText = caption;
      if (imageShareUrl) {
        fallbackText += `\n\n🖼️ *Poster:* ${imageShareUrl}`;
      }
      const waUrl = `https://wa.me/?text=${encodeURIComponent(fallbackText)}`;
      window.open(waUrl, '_blank');
    });

  } catch (err) {
    openModal(`<div style="padding:80px;text-align:center;color:#ff4757">
      Failed to load film details.<br/><small>${err.message}</small>
    </div>`);
  }
}

// ── Scroll Reveal ────────────────────────────────────────────
export function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
} 
