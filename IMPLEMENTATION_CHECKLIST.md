# Baloot Arena v1.0 Rule and Update Checklist

- [x] The last multiplier announcer becomes the effective bidder for scoring.
- [x] A multiplied tie is a loss for the effective bidder.
- [x] In صن, تكبير stops at دبل.
- [x] In أشكل, تكبير follows the same rule as صن and stops at دبل.
- [x] صن/أشكل دبل is available only when the original bidder's team has 100 or more and the opposing team has less than 100.
- [x] The multiplier sequence remains manually selected from the existing dropdown.
- [x] The dropdown blocks ثري، فور and قهوة in صن/أشكل.
- [x] In دبل، ثري and فور, the losing team receives zero.
- [x] Base points and counted projects are multiplied.
- [x] بلوت is added after multiplication and remains worth 2 points.
- [x] Effective-bid statistics are charged only to the last bidder, not automatically to the original bidder.
- [x] Jokes and story text may mention both the original bidder and the player who raised the bid.
- [x] عبدالله شريف receives the large “زخه التفتيش” announcement whenever his team loses a round.
- [x] عبدالله شريف receives the same highest-priority joke whenever his team loses the completed match.
- [x] The عبدالله شريف joke is never shown when his team wins.
- [x] Arabic names are normalized by trimming and combining repeated spaces before special-name matching.
- [x] The special joke appears in the middle of the screen with an explicit dismiss button.
- [x] Important mid-game events can show dismissible contextual announcements.
- [x] The final summary contains a short event-based “قصة الصكة”, not a full visible round timeline.
- [x] Saving a completed match immediately updates local matches and hands so standings and player profiles refresh without waiting for a page reload.
- [x] A silent Supabase reconciliation follows the immediate local update.
- [x] If hand-detail reloading fails, the newly saved local hand data is preserved instead of being erased.

- [x] The final summary selects no more than two jokes.
- [x] Consecutive completed matches avoid repeating the same joke when a valid alternative exists.
- [x] Joke logic is isolated in `lib/jokes.ts` and cannot modify scoring totals.
- [x] Every requested joke condition has automated coverage.
