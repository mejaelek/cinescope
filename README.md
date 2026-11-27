# CineScope — Film Discovery Web Application

**Authors:** Kamohelo G. Mejaele, Fernando Caballero, Pius Mukisa, Kyle Bowser
**Course:** WO 2 CSE 499 — Senior Project

CineScope is a fully responsive film discovery web application built with vanilla HTML, CSS, and JavaScript (no frameworks or libraries). It combines data from two third-party APIs to give users a rich, data-driven cinema experience: browse trending films, search live, view detailed film information with ratings from multiple sources, keep a personal watchlist that survives page refreshes, get recommendations based on that watchlist, and share films with friends on WhatsApp.

## Links

- **Live app:** [https://mejaelek.github.io/cinescope/](https://mejaelek.github.io/cinescope/)
- **Test deployment (Netlify):** [https://cinescope-test.netlify.app](https://cinescope-test.netlify.app)
- **Source code:** [https://github.com/mejaelek/cinescope](https://github.com/mejaelek/cinescope)
- **Demo and code walkthrough video:**

## Software Purpose

CineScope was built to deepen our skills in developing and debugging HTML, CSS, and JavaScript programs that use medium-complexity web technologies. The goal was to practise consuming real REST APIs, handling JSON data, storing data in the browser, working as a team through GitHub pull requests, and building a polished, accessible, responsive interface without relying on a framework.

## Features

### Pages

| Page             | What it does                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `index.html`     | Home / Discover: hero banner, trending films, genre filter, sort, film strip, load more, film facts |
| `watchlist.html` | Personal watchlist: saved films, statistics, sorting, remove and clear controls, recommendations, sharing |
| `search.html`    | Search: live debounced search, recent searches, full results grid                                   |

### Highlights

- **Two APIs working together:** TMDB for film data and OMDb for supplemental Rotten Tomatoes, Metacritic and IMDb ratings
- **Parallel data fetching** with `async/await` and `Promise.all()`
- **Film detail modal** showing cast, trailers, genres and merged ratings
- **Genre filtering and sorting** by popularity, rating, title and release date
- **Live search** with a 500 ms debounce, plus clickable recent-search chips
- **Persistent watchlist and preferences** using LocalStorage
- **Watchlist-based recommendations:** film suggestions built from the films saved in the user's watchlist
- **WhatsApp share:** share a film or the watchlist with friends through WhatsApp
- **Google sign-in and Google Drive integration** using Google Identity
- **Scroll-reveal effects** using `IntersectionObserver`
- **CSS animations and a design system** built on custom properties
- **Accessibility:** keyboard navigation (Enter, Space, Escape) and a reduced-motion override

### Team Contributions

| Team member | Contributions |
| ----------- | ------------- |
| Kamohelo G. Mejaele | Original application (home, search, watchlist, film detail modal), code structure and documentation, search filters and sorting, watchlist enhancements, accessibility and responsive polish |
| Fernando Caballero | Watchlist-based recommendations, WhatsApp share, Google Drive integration, Netlify test deployment, Where to Watch and Movie Night Picker (planned) |
| Kyle Bowser | Playwright automated testing framework and tests |
| Pius Mukisa | Team contributions, including the Team Favorite Quotes section |

## Technologies Used

- HTML5, CSS3 (Grid, custom properties, keyframe animations, transitions)
- JavaScript (ES Modules, Fetch API, async/await, array methods, event delegation, IntersectionObserver)
- LocalStorage (serialised JSON)
- TMDB API and OMDb API
- Google Identity (sign-in) and Google Drive integration
- WhatsApp sharing
- Playwright (automated tests)
- GitHub Pages (hosting), Netlify (test deployment), browser DevTools and ESLint (debugging)
- Git and GitHub pull requests for team collaboration

## APIs

**TMDB (The Movie Database)** — `https://api.themoviedb.org/3`

- `/trending/movie/week`
- `/movie/now_playing`
- `/movie/{id}?append_to_response=credits,videos`
- `/discover/movie?with_genres`
- `/search/movie`

**OMDb (Open Movie Database)** — `https://www.omdbapi.com`

- Lookup by IMDb ID for Rotten Tomatoes, Metacritic and IMDb ratings

**Google Identity and Google Drive** — used for sign-in and Drive integration.

## Project Structure

```
cinescope/
├── index.html
├── watchlist.html
├── search.html
├── netlify.toml          # Netlify test deployment configuration
├── server.js             # local server (Node) that sends the Cross-Origin-Opener-Policy header
├── server.py             # local server (Python) that sends the same header
├── .vscode/              # Live Server header settings for local development
├── css/
│   ├── main.css          # layout, components, typography, responsive breakpoints
│   └── animations.css    # keyframes, stagger delays, reduced-motion override
└── js/
    ├── config.js         # API keys, endpoints, storage key names, genre map, film facts
    ├── api.js            # all TMDB and OMDb fetch calls
    ├── storage.js        # watchlist CRUD, recent searches, preferences
    ├── ui.js             # card builder, modal, toasts, scroll reveal
    ├── main.js           # home page logic
    ├── watchlist.js      # watchlist page logic
    └── search.js         # search page logic
```

## How to Run Locally

1. Clone the repository:

   ```
   git clone https://github.com/mejaelek/cinescope.git
   cd cinescope
   ```

2. Get free API keys from [TMDB](https://www.themoviedb.org/settings/api) and [OMDb](https://www.omdbapi.com/apikey.aspx).
3. Open `js/config.js` and add your keys.
4. Because the project uses ES Modules and Google Identity OAuth popups, serve it with `Cross-Origin-Opener-Policy: same-origin-allow-popups` enabled:

   ```
   python server.py
   # or: node server.js
   # or: python -m http.server 8000
   ```

   Then visit `http://localhost:8000`. (The VS Code **Live Server** extension also automatically uses the header configured in `.vscode/settings.json`.)

## Deployment

- **Live app:** GitHub Pages, published from the `main` branch.
- **Test site:** Netlify, configured in `netlify.toml`, used to try out new features before they are shared.

## Development Environment

- Visual Studio Code
- Google Chrome with DevTools (Network and Application tabs)
- ESLint
- Playwright
- Git and GitHub (feature branches and pull requests)

## What We Learned

- Splitting a project into focused modules (config, api, storage, ui) makes it far easier to debug and extend
- Reading and parsing deeply nested JSON from real APIs
- Combining two independent APIs and fetching them in parallel
- Using event delegation and debouncing to keep the interface fast
- Persisting application state with LocalStorage
- Working as a team: feature branches, pull requests and merging each other's work

## Useful Websites

- [TMDB API Documentation](https://developer.themoviedb.org/docs)
- [OMDb API](https://www.omdbapi.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Fetch API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [IntersectionObserver (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Playwright](https://playwright.dev/)

## Future Work

- Where to Watch: streaming and rental availability for the user's region, with a manual region selector (in planning)
- Movie Night Picker: an animated random pick from a chosen genre or duration (in planning)
- Filtering by year, rating range and language, with more sort options (in progress)
- Watchlist enhancements: watched toggle, sort and filter by status, remove-all with undo (in progress)
- Accessibility and responsive polish checked with Lighthouse
- More Playwright tests covering the most important features
- User accounts with a cloud-synced watchlist
- Light/dark theme toggle

## Contributing

Our team works on CineScope through GitHub pull requests:

1. Create a feature branch from `main` (for example `fc-whatsapp-share`).
2. Make your changes and commit with a clear message.
3. Open a pull request and ask a teammate to review it.
4. Merge into `main` once it is reviewed and the checks pass.

Please pull the latest `main` before you start, so your work builds on your teammates' changes.## Acknowledgements

Film data provided by [TMDB](https://www.themoviedb.org/) and [OMDb](https://www.omdbapi.com/). This product uses the TMDB API but is not endorsed or certified by TMDB.

## Team Favorite Quotes

"Coming together is a beginning; keeping together is progress; working together is success." (Henry Ford), added by Kamohelo Godfrey Mejaele

"I teach them correct principles and they govern themselves." (Joseph Smith), added by Fernando Caballero.

"It always seems impossible until it's done." (Nelson Mandela), added by Pius Mukisa.

"Saruman believes it is only great power that can hold evil in check, but that is not what I have found. I found it is the small everyday deeds of ordinary folk that keep the darkness at bay… small acts of kindness and love." (Gandalf) added by Kyle Bowser
