export const JOKE_AUDIO_BY_ID: Record<string, readonly string[]> = {
  "failed-1": ["/audio/jokes/failed_bid_1.m4a"],
  "failed-2": ["/audio/jokes/failed_bid_2.m4a"],
  "failed-3": ["/audio/jokes/failed_bid_3.m4a"],
  "kaboot-1": ["/audio/jokes/kaboot_1a.m4a", "/audio/jokes/kaboot_1b.m4a"],
  "kaboot-2": ["/audio/jokes/kaboot_2.m4a"],
  "reverse-1": ["/audio/jokes/reverse_kaboot_1.m4a"],
  "reverse-2": ["/audio/jokes/reverse_kaboot_2a.m4a", "/audio/jokes/reverse_kaboot_2b.m4a"],
  "abdullah-sharif-inspection": ["/audio/jokes/abdullah_1a.m4a", "/audio/jokes/abdullah_1b.m4a", "/audio/jokes/abdullah_2.m4a"],
  "abdullah-sharif-match-inspection": ["/audio/jokes/abdullah_1a.m4a", "/audio/jokes/abdullah_1b.m4a"],
  "coffee-2": ["/audio/jokes/coffee_2.m4a"],
  "comeback-1": ["/audio/jokes/comeback_1a.m4a", "/audio/jokes/comeback_1b.m4a"],
  "comeback-2": ["/audio/jokes/comeback_2a.m4a", "/audio/jokes/comeback_2b.m4a"],
  "large-2": ["/audio/jokes/blowout_2.m4a"],
  "large-3": ["/audio/jokes/blowout_3.m4a"],
  "close-1": ["/audio/jokes/close_match_1.m4a", "/audio/jokes/close_match_1b.m4a"],
  "close-2": ["/audio/jokes/close_match_1.m4a", "/audio/jokes/close_match_1b.m4a"],
  "losing-streak-1": ["/audio/jokes/losing_streak_1b.m4a", "/audio/jokes/losing_streak_1c.m4a"],
  "losing-streak-2": ["/audio/jokes/losing_streak_2.m4a"],
  "projects-1": ["/audio/jokes/projects_1a.m4a", "/audio/jokes/projects_1b.m4a"],
  "projects-2": ["/audio/jokes/projects_1a.m4a", "/audio/jokes/projects_1b.m4a"],
  "long-match-11": ["/audio/jokes/long_match_1.m4a"],
};

export function jokeAudioSources(id: string) {
  if (id.startsWith("three-losses-")) {
    return [
      "/audio/jokes/three_loses_1.m4a",
      "/audio/jokes/three_losses.m4a",
      "/audio/jokes/three_losses_streak.m4a",
    ];
  }
  return JOKE_AUDIO_BY_ID[id] ?? [];
}

export function chooseAudioSource(id: string) {
  const sources = jokeAudioSources(id);
  if (!sources.length) return null;
  return sources[Math.floor(Math.random() * sources.length)];
}
