import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createPaintTarget,
  PAINT_ANIMATION_DURATION_MS,
  PAINT_BLOB_PATHS,
} from "../lib/theme-paint";

const rootDir = path.resolve(__dirname, "..");

function readProjectFile(filePath: string): string {
  return fs.readFileSync(path.join(rootDir, filePath), "utf8");
}

test("Theme tokens are centralized and cover both color schemes", () => {
  const tokens = readProjectFile("styles/tokens.css");
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
    "--shadow",
  ];

  for (const variable of requiredVariables) {
    assert.ok(tokens.includes(variable), `Theme tokens must define '${variable}'`);
  }

  assert.ok(tokens.includes(":root {"), "Light tokens must be the root defaults");
  assert.ok(
    tokens.includes(':root[data-theme="dark"]'),
    "Dark tokens must be scoped to the document theme",
  );
});

test("Theme paint stays behind the interface and respects reduced motion", () => {
  const paintStyles = readProjectFile("styles/theme-transition.css");
  const navigationStyles = readProjectFile("styles/navigation.css");
  const accessibilityStyles = readProjectFile("styles/accessibility.css");
  const provider = readProjectFile("context/ThemeContext.tsx");

  assert.match(paintStyles, /\.theme-paint\s*\{[^}]*z-index:\s*1/);
  assert.match(navigationStyles, /\.site-main\s*\{[^}]*z-index:\s*2/);
  assert.match(accessibilityStyles, /prefers-reduced-motion:\s*reduce/);
  assert.match(provider, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(paintStyles, /mix-blend-mode|!important/);
  assert.doesNotMatch(provider, /2300|2980|switchTimer/);

  const applyThemeIndex = provider.indexOf("applyTheme(nextTheme)");
  const startPaintIndex = provider.indexOf("setPaintTarget(", applyThemeIndex);
  assert.ok(applyThemeIndex >= 0, "Theme changes must update the document");
  assert.ok(
    startPaintIndex > applyThemeIndex,
    "The theme must be applied before the decorative paint starts",
  );
});

test("Paint data is bounded, deterministic when seeded, and fast enough to feel immediate", () => {
  const firstTarget = createPaintTarget("dark", () => 0.5);
  const secondTarget = createPaintTarget("dark", () => 0.5);

  assert.deepEqual(firstTarget, secondTarget);
  assert.equal(firstTarget.theme, "dark");
  assert.equal(firstTarget.splashes.length, 16);
  assert.ok(PAINT_ANIMATION_DURATION_MS <= 1_250);
  assert.ok(PAINT_BLOB_PATHS.length >= 1);
  assert.ok(firstTarget.sheet.duration <= PAINT_ANIMATION_DURATION_MS);

  for (const splash of firstTarget.splashes) {
    assert.ok(splash.variant >= 0 && splash.variant < PAINT_BLOB_PATHS.length);
    assert.ok(splash.duration > 0);
    assert.ok(splash.delay + splash.duration < PAINT_ANIMATION_DURATION_MS);
  }
});

test("Global CSS is split into named style responsibilities", () => {
  const globalStyles = readProjectFile("app/globals.css");

  for (const stylesheet of [
    "tokens.css",
    "base.css",
    "navigation.css",
    "sections.css",
    "theme-transition.css",
    "responsive.css",
    "accessibility.css",
  ]) {
    assert.ok(
      globalStyles.includes(stylesheet),
      `Global styles must include ${stylesheet}`,
    );
  }
});
