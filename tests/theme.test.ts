import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Theme Variables: Light and Dark Tokens defined", () => {
  const cssPath = path.resolve(__dirname, "..", "app", "globals.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  const requiredVariables = [
    "--paper",
    "--ink",
    "--muted",
    "--line",
    "--accent",
    "--soft",
    "--strong",
    "--body-text",
    "--control",
    "--active-bg",
    "--shadow"
  ];

  for (const v of requiredVariables) {
    assert.ok(css.includes(v), `globals.css must define CSS variable '${v}'`);
  }

  assert.ok(css.includes(":root"), "globals.css must define root theme variables");
  assert.ok(css.includes('[data-theme="dark"]'), "globals.css must define dark theme selector");
  assert.ok(css.includes(".theme-paint"), "globals.css must contain .theme-paint overlay styles");
  assert.ok(css.includes(".paint-sheet"), "globals.css must contain .paint-sheet styles");
  assert.ok(css.includes(".paint-splash"), "globals.css must contain .paint-splash styles");
  assert.ok(css.includes(".side-rail"), "globals.css must contain side-rail navigation styles");
});
