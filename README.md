# CineScope — Film Discovery Web Application

**Author:** Kamohelo G. Mejaele
**Course:** WO 4 CSE 310 — Applied Programming(Module #2)

CineScope is a fully responsive film discovery web application built with vanilla HTML, CSS, and JavaScript (no frameworks or libraries). It combines data from two third-party APIs to give users a rich, data-driven cinema experience: browse trending films, search live, view detailed film information with ratings from multiple sources, and keep a personal watchlist that survives page refreshes.

## Links

- **Live app:** https://mejaelek.github.io/cinescope/
- **Source code:** https://github.com/mejaelek/cinescope
- **Demo and code walkthrough video:** 

## Software Purpose

I built CineScope to deepen my skills in developing and debugging HTML, CSS, and JavaScript programs that use medium-complexity web technologies. The goal was to practise consuming real REST APIs, handling JSON data, storing data in the browser, and building a polished, accessible, responsive interface without relying on a framework.

## Features

### Pages
| Page | What it does |
| --- | --- |
| `index.html` | Home / Discover: hero banner, trending films, genre filter, sort, film strip, load more, film facts |
| `watchlist.html` | Personal watchlist: saved films, statistics, sorting, remove and clear controls |
| `search.html` | Search: live debounced search, recent searches, full results grid |

### Highlights
- **Two APIs working together:** TMDB for film data and OMDb for supplemental Rotten Tomatoes, Metacritic and IMDb ratings
- **Parallel data fetching** with `async/await` and `Promise.all()`
- **Film detail modal** showing cast, trailers, genres and merged ratings
- **Genre filtering and sorting** by popularity, rating, title and release date
- **Live search** with a 500 ms debounce, plus clickable recent-search chips
- **Persistent watchlist and preferences** using LocalStorage
- **Scroll-reveal effects** using `IntersectionObserver`
- **CSS animations and a design system** built on custom properties
- **Accessibility:** keyboard navigation (Enter, Space, Escape) and a reduced-motion override

## Technologies Used

- HTML5, CSS3 (Grid, custom properties, keyframe animations, transitions)
- JavaScript (ES Modules, Fetch API, async/await, array methods, event delegation, IntersectionObserver)
- LocalStorage (serialised JSON)
- TMDB API and OMDb API
- GitHub Pages (hosting), Trello (project planning), browser DevTools and ESLint (debugging)

## APIs

**TMDB (The Movie Database)** — `https://api.themoviedb.org/3`
- `/trending/movie/week`
- `/movie/now_playing`
- `/movie/{id}?append_to_response=credits,videos`
- `/discover/movie?with_genres`
- `/search/movie`

**OMDb (Open Movie Database)** — `https://www.omdbapi.com`
- Lookup by IMDb ID for Rotten Tomatoes, Metacritic and IMDb ratings

## Project Structure

```
cinescope/
├── index.html
├── watchlist.html
├── search.html
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
   ```bash
   git clone https://github.com/mejaelek/cinescope.git
   cd cinescope
   ```
2. Get free API keys from [TMDB](https://www.themoviedb.org/settings/api) and [OMDb](https://www.omdbapi.com/apikey.aspx).
3. Open `js/config.js` and add your keys.
4. Because the project uses ES Modules, serve it through a local web server rather than opening the file directly:
   ```bash
   python -m http.server 8000
   ```
   Then visit `http://localhost:8000`. (The VS Code **Live Server** extension also works.)

## Development Environment

- Visual Studio Code
- Google Chrome with DevTools (Network and Application tabs)
- ESLint
- Git and GitHub

## What I Learned

- Splitting a project into focused modules (config, api, storage, ui) makes it far easier to debug and extend
- Reading and parsing deeply nested JSON from real APIs
- Combining two independent APIs and fetching them in parallel
- Using event delegation and debouncing to keep the interface fast
- Persisting application state with LocalStorage

## Useful Websites

- [TMDB API Documentation](https://developer.themoviedb.org/docs)
- [OMDb API](https://www.omdbapi.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Fetch API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [IntersectionObserver (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)

## Future Work

- User accounts with a cloud-synced watchlist
- Filtering by year, rating range and language
- Recommendations based on the watchlist
- Light/dark theme toggle
- Automated tests for the API and storage modules

## Acknowledgements

Film data provided by [TMDB](https://www.themoviedb.org/) and [OMDb](https://www.omdbapi.com/). This product uses the TMDB API but is not endorsed or certified by TMDB.
