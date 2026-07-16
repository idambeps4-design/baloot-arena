# Verification — Baloot Arena v1.0.1

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
- Automated tests: **50/50 passed**.
- TypeScript `tsc --noEmit`: passed.
- Next.js production build: passed and generated the `/` route as static content.
- `.npmrc` and every locked package source use `registry.npmjs.org`.
- The newest scoring rules remain in place; only the كبوت and كبوت عكسي branches were corrected to include the winning team’s projects and unmultiplied بلوت.

## Test coverage

The automated suite covers:

- Opposing-team score-entry default and manual score-team selection support.
- Dealer movement, صن/حكم conversion and rounding.
- Project precedence and bidder failure.
- Last مكبر becoming the effective bidder.
- Multiplied ties counting as a loss for the effective bidder.
- صن and أشكل stopping at دبل.
- صن/أشكل دبل requiring bidder team score `>= 100` and opponent score `< 100`.
- دبل، ثري and فور awarding all applicable points to the winner and zero to the loser.
- بلوت remaining unmultiplied, including the verified `80`-point example.
- كبوت، كبوت عكسي and قهوة.
- كبوت adding valid سرى، خمسين، مية، أربعمئة and بلوت points to the winning team.
- كبوت عكسي adding the winning team’s valid projects to 88 points.
- Immediate completed-match merging for standings and profile statistics.
- Matches played, wins, losses, percentages, winning and losing streaks, bids, كبوت, قهوة, projects, partners and opponents.
- Failed bidder jokes.
- عبدالله شريف normalization, loss-only behavior and top priority.
- كبوت, كبوت عكسي, قهوة, comeback, large victory, close match, streak and project jokes.
- Contradiction prevention for literal team/requester joke lines.
- Consecutive-match joke rotation.
- Maximum two final jokes.
- Arabic final summary and factual storyline.
- نجم الصكة based on successful bids, important rounds, projects, كبوت and قهوة contribution.
- مفلس الصكة based on failed bids, repeated round losses, low contribution and losing-team status.

The Supabase SQL files were packaged and reviewed but were not executed against a live user database because credentials were not provided. For a new database run `supabase/setup.sql`; for an older Baloot Arena database run `supabase/v1.sql`.
