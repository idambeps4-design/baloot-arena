# Balot Arena v1.4.0

## Audio
The supplied M4A recordings are included under `public/audio/jokes/` and mapped to their matching joke IDs. When multiple recordings exist, one is chosen randomly. Device Arabic speech remains as a fallback for catalog jokes without a supplied recording.

## iPhone safe areas
The sticky header now remains below the Dynamic Island/notch while scrolling. Full-screen joke announcements include safe-area padding and an internal scroll limit so text and controls remain visible.

## Compatibility
No Supabase schema changes are required from v1.1.0–v1.3.0.
