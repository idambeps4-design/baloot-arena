# Baloot Arena Scoring Rulebook

## Bidder and score entry

- The player who starts the bid is the original bidder.
- When a multiplier is selected, the last player who announced the multiplier becomes the effective bidder for scoring.
- Score entry defaults to the opposing team of the original bidder, but the user may change it manually.

## تكبير

### حكم

The valid manual sequence is:

1. Opposing team: دبل
2. Original bidder's team: ثري
3. Opposing team: فور
4. Original bidder's team: قهوة

The interface keeps manual selection, while validating the team of the last multiplier announcer.

### صن and أشكل

- تكبير stops at دبل.
- دبل is available only when the original bidder's team score is 100 or more and the opposing team's score is below 100.
- ثري، فور and قهوة are not allowed.

## Multiplied-round scoring

- The effective bidder is the last multiplier announcer.
- A tie is a loss for the effective bidder.
- The losing team receives zero round points.
- The winning team receives the full base and counted-project pool multiplied by the selected level.
- بلوت is never multiplied. It is added after multiplication at its normal value of 2.

Example in حكم at ثري:

- Base pool: 16
- Counted project: مية = 10
- بلوت: 2
- Total: `(16 + 10) × 3 + 2 = 80`

## Statistics and jokes

- Successful and failed bid statistics belong to the effective bidder.
- The original bidder is not charged with a failed bid caused by another player becoming the effective bidder.
- Story and joke text may mention both the original bidder and the multiplier announcer.
- Player names are normalized by trimming spaces and combining repeated spaces for special joke matching.
- عبدالله شريف receives “زخه التفتيش” whenever his team loses a round or completed match.
- The عبدالله شريف joke has priority over other jokes and is never shown when his team wins.
- Round jokes appear immediately after the round is recorded.
- Game jokes appear in the final Arabic summary, with a maximum of two jokes.
- The same final joke is not repeated in consecutive matches when another valid alternative exists.
- Joke selection is isolated from the scoring engine and cannot change points.
