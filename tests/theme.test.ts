import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  applyThemeDropVariables,
  clearThemeDropVariables,
  createThemeTransition,
  THEME_DROP_COUNT,
  THEME_TRANSITION_DURATION_MS,
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

test("Theme changes are revealed locally through non-translucent page snapshots", () => {
  const paintStyles = readProjectFile("styles/theme-transition.css");
  const accessibilityStyles = readProjectFile("styles/accessibility.css");
  const provider = readProjectFile("context/ThemeContext.tsx");
  const shell = readProjectFile("components/layout/PortfolioShell.tsx");
  const nextConfig = readProjectFile("next.config.ts");

  assert.match(paintStyles, /::view-transition-new\(root\)/);
  assert.match(paintStyles, /mask-image:[\s\S]*?radial-gradient/);
  assert.match(paintStyles, /mask-composite:\s*add/);
  assert.match(paintStyles, /html\.theme-transitioning[\s\S]*?transition:\s*none/);
  assert.equal((paintStyles.match(/@property --theme-drop-radius-\d+/g) ?? []).length, THEME_DROP_COUNT);
  assert.equal((paintStyles.match(/@keyframes theme-drop-\d+/g) ?? []).length, THEME_DROP_COUNT);
  assert.doesNotMatch(paintStyles, /\.theme-paint|mix-blend-mode|opacity:\s*0\.\d+/);

  assert.match(provider, /document\.startViewTransition/);
  assert.match(provider, /flushSync\(\(\) => applyTheme\(nextTheme\)\)/);
  assert.match(provider, /prefers-reduced-motion:\s*reduce/);
  assert.match(provider, /clearThemeDropVariables/);
  assert.doesNotMatch(shell, /ThemePaintOverlay|PaintBlob/);
  assert.match(accessibilityStyles, /prefers-reduced-motion:\s*reduce/);
  assert.match(nextConfig, /allowedDevOrigins:\s*\["\*\.e2b\.app"\]/);
  assert.match(nextConfig, /turbopack:\s*\{\s*root:\s*projectRoot/);
});

test("Theme drops cover the viewport with bounded, deterministic timing", () => {
  const firstTransition = createThemeTransition("dark", 1440, 900, () => 0.5);
  const secondTransition = createThemeTransition("dark", 1440, 900, () => 0.5);

  assert.deepEqual(firstTransition, secondTransition);
  assert.equal(firstTransition.theme, "dark");
  assert.equal(firstTransition.drops.length, THEME_DROP_COUNT);
  assert.ok(THEME_TRANSITION_DURATION_MS <= 1_250);

  const coveredCells = new Set<string>();
  for (const drop of firstTransition.drops) {
    assert.ok(drop.x >= 0 && drop.x <= 100);
    assert.ok(drop.y >= 0 && drop.y <= 100);
    assert.ok(drop.maxRadius > drop.impactRadius);
    assert.ok(drop.impactRadius > 0);
    assert.ok(drop.delay >= 0);
    assert.ok(drop.duration >= 580 && drop.duration <= 700);
    assert.ok(drop.delay + drop.duration <= THEME_TRANSITION_DURATION_MS);

    coveredCells.add(`${Math.floor(drop.x / 25)}-${Math.floor(drop.y / (100 / 3))}`);
  }
  assert.equal(coveredCells.size, THEME_DROP_COUNT, "Drops should start in separate page regions");
});

test("Drop CSS variables are set and cleared without retaining stale transition data", () => {
  const values = new Map<string, string>();
  const removed: string[] = [];
  const fakeRoot = {
    style: {
      setProperty: (name: string, value: string) => values.set(name, value),
      removeProperty: (name: string) => {
        removed.push(name);
        values.delete(name);
      },
    },
  } as unknown as HTMLElement;
  const transition = createThemeTransition("light", 800, 600, () => 0.4);

  applyThemeDropVariables(fakeRoot, transition.drops);
  assert.equal(values.get("--theme-drop-x-0"), `${transition.drops[0].x}%`);
  assert.equal(values.get("--theme-drop-max-radius-0"), `${transition.drops[0].maxRadius}px`);
  assert.equal(values.get(`--theme-drop-duration-${THEME_DROP_COUNT - 1}`), `${transition.drops.at(-1)?.duration}ms`);

  clearThemeDropVariables(fakeRoot);
  assert.equal(values.size, 0);
  assert.equal(removed.length, THEME_DROP_COUNT * 6);
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
