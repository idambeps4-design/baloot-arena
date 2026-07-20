# Verification — Balot Arena v1.1.0 PWA

Verification date: 17 July 2026

Environment used:

- Node.js `v22.16.0`
- npm `10.9.2`

## Commands executed successfully

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run check:registry
```

## Results

- `npm ci`: passed using the public npm registry.
- Automated tests: **54/54 passed**.
- TypeScript `tsc --noEmit`: passed.
- Next.js production build: passed.
- Static routes generated: `/`, `/manifest.webmanifest`, and `/offline`.
- `.npmrc` and every locked package source use `registry.npmjs.org`.
- Production server check returned a valid `application/manifest+json` manifest.
- `/sw.js` returned `Service-Worker-Allowed: /` and no-cache headers.
- Required icon dimensions were validated automatically: 180×180, 192×192, 512×512, and maskable 512×512.
- Service-worker tests confirm that API, React Server Component, and cross-origin requests are excluded from caching.
- iPhone safe-area and standalone metadata checks passed.

## Preserved application logic

The PWA work did not modify the verified scoring, saving, analytics, or joke modules. Their before/after SHA-256 values are identical:

```text
e888457eec35baeeed186e2dad13b49d3d3514d142887b37be056beaa57885e7  lib/scoring.ts
89fcd7cf685f2e010a1387c15fa5e8d23dc3a22a98edfa2c57a918418188440f  lib/data.ts
fade02772fc66e19209bfd7b09e899da9c8df177bad7c4cf102f0053204fde92  lib/analytics.ts
861182a8df5290e8facb536b45db1d91d52aa977d08c1315832be7d36c08a9c6  lib/jokes.ts
```

The Supabase SQL was not changed for v1.1.0. No database migration is required when upgrading from the verified v1.0.1 release.

## v1.3.0 verification
- `npm test`: 58/58 passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with all routes statically generated.
- `npm run check:registry`: passed.
- No database migration required from v1.1.0.
