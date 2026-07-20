import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const scorer = readFileSync("components/CompetitionScorer.tsx", "utf8");
const dealer = readFileSync("components/DealerTable.tsx", "utf8");
const page = readFileSync("app/page.tsx", "utf8");
const sound = readFileSync("components/SoundToggle.tsx", "utf8");

test("competition UI removes purchase stage and exposes only sun/hokum buttons", () => {
  assert.equal(scorer.includes("مرحلة الشراء"), false);
  assert.ok(scorer.includes('(["صن", "حكم"] as GameType[])'));
});

test("table center supports redeal without recording a round", () => {
  assert.ok(dealer.includes("اضغط هنا إذا محد شرى"));
  assert.ok(scorer.includes("passDealerForRedeal"));
  assert.ok(scorer.includes("بدون تسجيل راوند"));
});

test("sound toggle is beside appearance and persists mute", () => {
  assert.ok(page.includes("<SoundToggle/><ThemeToggle/>"));
  assert.ok(sound.includes("baloot-arena-sound-muted"));
});

test("advanced statistics tab is wired to matches and hands", () => {
  assert.ok(page.includes("<StatsPanel"));
  assert.ok(page.includes("hands={hands}"));
});
