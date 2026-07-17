# Changelog

## v1.1.0 — PWA release

- Added installable Progressive Web App support under the name **Balot Arena**.
- Added green-and-gold app icons for iPhone, PWA, maskable Android display, and favicon use.
- Added a standalone RTL manifest and Apple web-app metadata.
- Added a safe service worker that caches the application shell and static assets only.
- Supabase, API, and React Server Component requests are deliberately excluded from caching.
- Added an iPhone Safari installation hint and supported browser install prompt.
- Added offline connection messaging without falsely claiming that matches are saved.
- Added iPhone safe-area handling for the Dynamic Island and Home indicator.
- Preserved all v1.0.1 scoring, jokes, statistics, summaries, and Supabase behavior.
