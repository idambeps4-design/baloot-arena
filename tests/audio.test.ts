import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { JOKE_AUDIO_BY_ID, jokeAudioSources } from "../lib/jokeAudio";

test("recorded joke audio mappings point to packaged m4a files", () => {
  for (const sources of Object.values(JOKE_AUDIO_BY_ID)) {
    assert.ok(sources.length > 0);
    for (const source of sources) {
      assert.match(source, /^\/audio\/jokes\/.+\.m4a$/);
      assert.ok(existsSync(`public${source}`), `missing ${source}`);
    }
  }
});

test("three-loss progress joke has recorded variants", () => {
  const sources = jokeAudioSources("three-losses-A-3");
  assert.equal(sources.length, 3);
  sources.forEach((source) => assert.ok(existsSync(`public${source}`)));
});
