import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  applyThemeDropVariables,
  clearThemeDropVariables,
  createThemeTransition,
  THEME_DROP_COLUMNS,
  THEME_DROP_COUNT,
  THEME_DROP_ROWS,
  THEME_SPLASH_COUNT,
  THEME_TRANSITION_DURATION_MS,
} from "../lib/theme-paint";

const rootDir = path.resolve(__dirname, "..");

function readProjectFile(filePath: string): string {
  return fs.readFileSync(path.join(rootDir, filePath), "utf8");
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
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
  assert.match(paintStyles, /mask-image:[\s\S]*?var\(--theme-drop-mask-0/);
  assert.match(paintStyles, /mask-size:[\s\S]*?--theme-drop-radius-0/);
  assert.match(paintStyles, /mask-composite:\s*add/);
  assert.match(paintStyles, /html\.theme-transitioning[\s\S]*?transition:\s*none/);
  assert.equal((paintStyles.match(/@property --theme-drop-radius-\d+/g) ?? []).length, THEME_DROP_COUNT);
  assert.equal((paintStyles.match(/@keyframes theme-drop-\d+/g) ?? []).length, THEME_DROP_COUNT);
  assert.doesNotMatch(paintStyles, /\.theme-paint|mix-blend-mode|opacity:\s*0\.\d+/);

  assert.match(provider, /document\.startViewTransition/);
  assert.match(provider, /supportsPaintMasks/);
  assert.match(provider, /flushSync\(\(\) => applyTheme\(nextTheme\)\)/);
  assert.match(provider, /prefers-reduced-motion:\s*reduce/);
  assert.match(provider, /clearThemeDropVariables/);
  assert.doesNotMatch(shell, /ThemePaintOverlay|PaintBlob/);
  assert.match(accessibilityStyles, /prefers-reduced-motion:\s*reduce/);
  assert.match(nextConfig, /allowedDevOrigins:\s*\["\*\.e2b\.app"\]/);
  assert.match(nextConfig, /turbopack:\s*\{\s*root:\s*projectRoot/);
});

test("Paint splashes are varied, scattered, and finish within the transition window", () => {
  const firstTransition = createThemeTransition("dark", 1440, 900, seededRandom(42));
  const secondTransition = createThemeTransition("dark", 1440, 900, seededRandom(42));
  const differentTransition = createThemeTransition("dark", 1440, 900, seededRandom(99));
  const slowestTransition = createThemeTransition("light", 1440, 900, () => 0.999999);

  assert.deepEqual(firstTransition, secondTransition);
  assert.notDeepEqual(firstTransition, differentTransition);
  assert.equal(firstTransition.theme, "dark");
  assert.equal(firstTransition.drops.length, THEME_DROP_COUNT);
  assert.equal(firstTransition.drops[0].kind, "sheet");
  assert.equal(
    firstTransition.drops.filter((drop) => drop.kind === "splash").length,
    THEME_SPLASH_COUNT,
  );
  assert.ok(THEME_TRANSITION_DURATION_MS >= 3_000);
  assert.ok(THEME_TRANSITION_DURATION_MS <= 3_200);
  assert.ok(
    Math.max(...slowestTransition.drops.map((drop) => drop.delay + drop.duration)) <=
      THEME_TRANSITION_DURATION_MS,
  );

  const splashes = firstTransition.drops.filter((drop) => drop.kind === "splash");
  assert.ok(new Set(splashes.map((drop) => drop.shape)).size > 1);
  assert.ok(new Set(splashes.map((drop) => drop.rotation)).size > 8);
  assert.ok(new Set(splashes.map((drop) => drop.maxRadius)).size > 8);

  const coveredGridCells = new Set<string>();
  for (const drop of firstTransition.drops) {
    assert.ok(drop.centerX >= -0.15 * 1_440 && drop.centerX <= 1.15 * 1_440);
    assert.ok(drop.centerY >= -0.15 * 900 && drop.centerY <= 1.15 * 900);
    assert.ok(drop.maxRadius > drop.impactRadius);
    assert.ok(drop.impactRadius > 0);
    assert.ok(drop.delay >= 0);
    assert.ok(drop.shape >= 0 && drop.shape < 3);
    assert.ok(drop.rotation >= 0 && drop.rotation <= 360);
    assert.ok(drop.specks.length >= 7 && drop.specks.length <= 14);
    assert.ok(drop.delay + drop.duration <= THEME_TRANSITION_DURATION_MS);

    if (drop.kind === "sheet") {
      assert.ok(drop.duration >= 2_000 && drop.duration <= 2_550);
      assert.match(drop.sheetPath ?? "", /^M[\s\S]+Q[\s\S]+Z$/);
    } else {
      assert.equal(drop.sheetPath, null);
      assert.ok(drop.duration >= 1_250 && drop.duration <= 2_200);
      if (drop.centerX >= 0 && drop.centerX < 1_440 && drop.centerY >= 0 && drop.centerY < 900) {
        coveredGridCells.add(
          `${Math.floor(drop.centerX / (1_440 / THEME_DROP_COLUMNS))}-${Math.floor(drop.centerY / (900 / THEME_DROP_ROWS))}`,
        );
      }
    }
  }

  assert.equal(
    coveredGridCells.size,
    THEME_DROP_COLUMNS * THEME_DROP_ROWS,
    "Randomized splashes should still cover the viewport grid",
  );
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
  assert.equal(values.get("--theme-drop-x-0"), `${transition.drops[0].centerX}px`);
  assert.equal(values.get("--theme-drop-y-0"), `${transition.drops[0].centerY}px`);
  const maskValue = values.get("--theme-drop-mask-0");
  assert.equal(maskValue?.startsWith('url("data:image/svg+xml,'), true);
  const encodedMask = maskValue?.match(/svg\+xml,([^\"]+)/)?.[1] ?? "";
  assert.match(decodeURIComponent(encodedMask), /<svg[\s\S]*<path d=/);
  assert.equal(values.get("--theme-drop-max-radius-0"), `${transition.drops[0].maxRadius}px`);
  assert.equal(values.get(`--theme-drop-duration-${THEME_DROP_COUNT - 1}`), `${transition.drops.at(-1)?.duration}ms`);

  clearThemeDropVariables(fakeRoot);
  assert.equal(values.size, 0);
  assert.equal(removed.length, THEME_DROP_COUNT * 7);
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
