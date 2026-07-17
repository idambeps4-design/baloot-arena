import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import manifest from "../app/manifest";

function pngSize(path: string) {
  const bytes = readFileSync(path);
  assert.equal(bytes.toString("ascii", 1, 4), "PNG");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

test("PWA manifest uses the Balot Arena identity and standalone RTL mode", () => {
  const value = manifest();
  assert.equal(value.name, "Balot Arena");
  assert.equal(value.short_name, "Balot Arena");
  assert.equal(value.display, "standalone");
  assert.equal(value.dir, "rtl");
  assert.equal(value.lang, "ar");
  assert.equal(value.start_url, "/");
  assert.equal(value.theme_color, "#021b13");
  assert.ok(value.icons?.some((icon) => icon.src === "/icons/icon-maskable-512.png" && icon.purpose === "maskable"));
});

test("PWA icon files have the required dimensions", () => {
  assert.deepEqual(pngSize("public/icons/icon-192.png"), { width: 192, height: 192 });
  assert.deepEqual(pngSize("public/icons/icon-512.png"), { width: 512, height: 512 });
  assert.deepEqual(pngSize("public/icons/icon-maskable-512.png"), { width: 512, height: 512 });
  assert.deepEqual(pngSize("public/apple-touch-icon.png"), { width: 180, height: 180 });
});

test("service worker caches the shell but never caches APIs, RSC, or cross-origin Supabase traffic", () => {
  const source = readFileSync("public/sw.js", "utf8");
  assert.match(source, /balot-arena-shell-v1\.1\.0/);
  assert.match(source, /url\.origin !== self\.location\.origin/);
  assert.match(source, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(source, /url\.searchParams\.has\("_rsc"\)/);
  assert.match(source, /request\.headers\.get\("RSC"\)/);
});

test("layout and CSS include iPhone standalone metadata and safe areas", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(layout, /applicationName: "Balot Arena"/);
  assert.match(layout, /statusBarStyle: "black-translucent"/);
  assert.match(layout, /viewportFit: "cover"/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /safe-area-inset-bottom/);
});
