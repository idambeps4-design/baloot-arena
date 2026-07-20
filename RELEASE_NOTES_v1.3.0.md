# Balot Arena v1.3.0

This release combines the requested v1.2 gameplay improvements and v1.3 statistics features.

## Gameplay and interface
- Tap the center of the Baloot table when nobody bids to pass the dealer clockwise and redeal.
- Passing the dealer does not save a round and does not change either score.
- Removed the visible purchase-stage field.
- Game type is now a single row with two large buttons: صن and حكم.
- Existing saved-round compatibility is preserved by storing the internal legacy bidding stage as أول.

## Jokes and sound
- Updated the approved joke catalog.
- `البنزين قضى وما قضينا` appears once when the match reaches round 11.
- `قدم مستوى يا هطف` appears when a team first loses three rounds consecutively inside the current match.
- Jokes are spoken automatically using the device/browser Arabic speech voice.
- Sound is on by default, with a persistent mute button beside the appearance button.

## Advanced statistics
- New statistics tab.
- Matches and rounds totals.
- Average rounds per match.
- Player wins and win percentage.
- Average points per round.
- حكم and صن round wins.
- Kaboot totals and longest winning streak.
- Player search and 30/90-day filters.
- CSV export for completed matches.

## Compatibility
- No Supabase migration is required when upgrading from v1.1.0.
- Existing matches, scoring, player profiles, PWA installation, and concurrent separate games remain supported.
