# Changelog

## 1.0.1 — Kaboot Project Scoring Fix

- Fixed كبوت so the winning team receives its valid سرى، خمسين، مية، أربعمئة and بلوت points in addition to the fixed كبوت value.
- Fixed كبوت عكسي so the winning team receives its valid projects in addition to 88 points.
- Kept the losing team at zero during كبوت and كبوت عكسي.
- Kept بلوت at its normal two points without multiplication.
- Added regression tests for صن كبوت, حكم كبوت with بلوت, and كبوت عكسي projects.

## 1.0.0 Final Candidate — Contextual Match Experience

- Preserved the newest scoring engine without modification, including the latest تكبير, صن/أشكل and بلوت fixes.
- Added a dedicated `lib/jokes.ts` engine so joke selection cannot alter scoring points.
- Added Arabic-name normalization that trims leading/trailing spaces, combines repeated spaces and ignores Arabic diacritics/tatweel for special-name matching.
- Added immediate contextual round announcements for failed bidders, عبدالله شريف, كبوت, كبوت عكسي, قهوة and project-heavy rounds.
- Made `زخه التفتيش` the highest-priority joke whenever عبدالله شريف’s team loses a round or completed game; it is never shown when his team wins.
- Added the complete requested joke catalogs for failed bids, كبوت, كبوت عكسي, قهوة, comeback, large victory, close games, streaks and projects.
- Prevented result-contradicting joke variants, including requester-specific قهوة wording and literal Team 2 wording.
- Limited final summaries to a maximum of two jokes.
- Prevented the same final joke from repeating in consecutive matches when another valid alternative exists.
- Added saved-history winning and losing streak detection, projected through the newly finished game.
- Expanded نجم الصكة scoring using successful bids, important-round wins, projects, كبوت, كبوت عكسي, قهوة and winning-team contribution.
- Expanded مفلس الصكة scoring using failed bids, repeated round losses, low contribution and losing-team status.
- Added visible reasons below نجم الصكة and مفلس الصكة.
- Preserved the Arabic RTL interface and the existing completed-match-only Supabase save flow.
- Preserved immediate leaderboard and player-profile refresh after saving.
- Added tests for every requested joke condition and contradiction rule.

## 1.0.0 Candidate — Completed Match & Profiles

- Defaulted score entry to the opposing team of the bidder while preserving manual selection.
- Made the last مكبر the effective bidder for scoring and statistics.
- Limited صن and أشكل to دبل with the required score condition.
- Awarded multiplied rounds only to the winner and kept بلوت unmultiplied.
- Added atomic completed-match saving, duplicate prevention, profiles and Arabic summaries.

## 0.5.0 — Clean Foundation

- Cleaned `package-lock.json` of internal registry links.
- Added automated registry and scoring checks.
