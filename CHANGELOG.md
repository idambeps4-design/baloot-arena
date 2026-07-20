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

## 1.3.0 - 2026-07-20
- Combined v1.2 gameplay/voice changes and v1.3 advanced statistics.
- Added tap-table redeal/dealer passing without recording a round.
- Removed visible purchase stage and reduced game type to صن/حكم buttons.
- Added automatic Arabic joke speech and persistent mute control.
- Added requested long-match, three-loss, kaboot, close-match, Abdullah Sharif, losing-streak, and projects wording.
- Added advanced player statistics, date filters, search, and completed-match CSV export.
- Expanded automated tests to 58 passing tests.
