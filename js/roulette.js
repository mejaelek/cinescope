// ============================================================
// CineScope — js/roulette.js
// Movie Night Picker / Roulette Mode
// Filters candidate films, runs physics-based deceleration spin
// on movie cards, and opens the winning film's details modal.
// ============================================================

import { GENRE_MAP } from './config.js';
import { openModal, closeModal, openMovieModal, showToast } from './ui.js';

let isSpinning = false;

/**
 * Run the card-hopping roulette animation on a grid container.
 * 
 * @param {HTMLElement} gridElement - Container element holding .movie-card items
 * @param {Object} [filterOptions]  - { genreId: string|number, minRating: number }
 */
export async function spinRoulette(gridElement, filterOptions = {}) {
    if (isSpinning) return;
    if (!gridElement) return;

    const cards = Array.from(gridElement.querySelectorAll('.movie-card'));
    if (cards.length === 0) {
        showToast('No movies available to pick from!', 'info');
        return;
    }

    // Filter candidate cards matching criteria
    const candidates = cards.filter((card) => {
        // Genre filter
        if (filterOptions.genreId && filterOptions.genreId !== 'all') {
            const rawGenres = card.dataset.genres || '';
            const genreList = rawGenres.split(',').filter(Boolean);
            if (!genreList.includes(String(filterOptions.genreId))) {
                return false;
            }
        }

        // Minimum rating filter
        if (filterOptions.minRating && filterOptions.minRating > 0) {
            const ratingText = card.querySelector('.card-rating')?.textContent || '0';
            const rating = parseFloat(ratingText);
            if (isNaN(rating) || rating < filterOptions.minRating) {
                return false;
            }
        }

        return true;
    });

    if (candidates.length === 0) {
        showToast('No films matched your filter criteria. Try different options!', 'info');
        return;
    }

    // Scroll to the first candidate card so the user sees the spin in action
    candidates[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Single candidate: instant winner
    if (candidates.length === 1) {
        const singleCard = candidates[0];
        const singleId = Number(singleCard.dataset.id);
        singleCard.classList.add('roulette-winner');
        setTimeout(() => {
            singleCard.classList.remove('roulette-winner');
            openMovieModal(singleId);
        }, 600);
        return;
    }

    isSpinning = true;

    // Pick random target winner
    const winningCandidateIndex = Math.floor(Math.random() * candidates.length);
    const winningCard = candidates[winningCandidateIndex];
    const winningMovieId = Number(winningCard.dataset.id);

    // Calculate total hops (minimum 18 hops to guarantee a satisfying ~2.5 - 3.5s spin)
    const baseCycles = Math.max(2, Math.ceil(18 / candidates.length));
    const totalHops = (candidates.length * baseCycles) + winningCandidateIndex;

    let currentHop = 0;
    let currentIndex = 0;
    let delay = 50; // Initial rapid speed (50ms)

    // Clear any previous highlights
    cards.forEach((c) => c.classList.remove('roulette-highlight', 'roulette-winner'));

    function step() {
        // Remove highlight from all candidates
        candidates.forEach((c) => c.classList.remove('roulette-highlight'));

        // Highlight active candidate
        const activeCard = candidates[currentIndex % candidates.length];
        activeCard.classList.add('roulette-highlight');
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

        currentHop++;
        currentIndex++;

        if (currentHop >= totalHops) {
            // Reached winner!
            activeCard.classList.remove('roulette-highlight');
            activeCard.classList.add('roulette-winner');

            setTimeout(() => {
                activeCard.classList.remove('roulette-winner');
                isSpinning = false;
                openMovieModal(winningMovieId);
            }, 750);
            return;
        }

        // Exponential deceleration curve: slow down across the final 45% of hops
        if (currentHop > totalHops * 0.55) {
            delay = Math.min(500, Math.floor(delay * 1.14));
        }

        setTimeout(step, delay);
    }

    step();
}

/**
 * Open the Movie Night Picker filter dialog.
 * 
 * @param {HTMLElement} gridElement - Container holding the movie cards
 * @param {string} [title]          - Dialog heading title
 */
export function openRouletteDialog(gridElement, title = 'Movie Night Picker') {
    if (isSpinning) return;
    if (!gridElement) return;

    const cards = Array.from(gridElement.querySelectorAll('.movie-card'));
    if (cards.length === 0) {
        showToast('No films to pick from! Add films or check back later.', 'info');
        return;
    }

    // Collect available genres present in this grid
    const presentGenreIds = new Set();
    cards.forEach((card) => {
        const raw = card.dataset.genres || '';
        raw.split(',').filter(Boolean).forEach((id) => presentGenreIds.add(Number(id)));
    });

    const genreOptionsHtml = Array.from(presentGenreIds)
        .filter((id) => GENRE_MAP[id])
        .sort((a, b) => GENRE_MAP[a].localeCompare(GENRE_MAP[b]))
        .map((id) => `<option value="${id}">${GENRE_MAP[id]}</option>`)
        .join('');

    const dialogHtml = `
      <div class="roulette-modal-card">
        <div class="roulette-modal-header">
          <span class="roulette-modal-icon">🎲</span>
          <h2 class="modal-title" style="margin:0">${title}</h2>
          <p class="modal-tagline" style="margin-top:6px">Can't decide what to watch? Let fate spin and choose for you.</p>
        </div>

        <div class="roulette-form">
          <div class="roulette-form-group">
            <label for="roulette-genre-select" class="roulette-label">Filter by Genre (Optional)</label>
            <select id="roulette-genre-select" class="roulette-select">
              <option value="all">Any Genre (${cards.length} films)</option>
              ${genreOptionsHtml}
            </select>
          </div>

          <div class="roulette-form-group">
            <label for="roulette-rating-select" class="roulette-label">Minimum Rating (Optional)</label>
            <select id="roulette-rating-select" class="roulette-select">
              <option value="0">Any Rating</option>
              <option value="7">⭐ 7.0 or higher</option>
              <option value="8">⭐ 8.0 or higher</option>
            </select>
          </div>
        </div>

        <div class="modal-actions" style="margin-top:28px">
          <button type="button" class="btn btn-primary" id="roulette-spin-submit">
            🎲 Spin the Wheel!
          </button>
          <button type="button" class="btn btn-ghost" id="roulette-dialog-cancel">
            Cancel
          </button>
        </div>
      </div>
    `;

    openModal(dialogHtml);

    // Cancel action
    document.getElementById('roulette-dialog-cancel')?.addEventListener('click', () => {
        closeModal();
    });

    // Spin action
    document.getElementById('roulette-spin-submit')?.addEventListener('click', () => {
        const genreId = document.getElementById('roulette-genre-select')?.value || 'all';
        const minRating = parseFloat(document.getElementById('roulette-rating-select')?.value || '0');

        closeModal();

        // Delay starting spin slightly to let the modal fade-out transition complete smoothly
        setTimeout(() => {
            spinRoulette(gridElement, { genreId, minRating });
        }, 220);
    });
}
