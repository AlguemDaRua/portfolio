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

test("Theme drops cover the viewport with bounded, deterministic timing", () => {
  const firstTransition = createThemeTransition("dark", 1440, 900, () => 0.5);
  const secondTransition = createThemeTransition("dark", 1440, 900, () => 0.5);
  const slowestTransition = createThemeTransition("light", 1440, 900, () => 0.999999);

  assert.deepEqual(firstTransition, secondTransition);
  assert.equal(firstTransition.theme, "dark");
  assert.equal(firstTransition.drops.length, THEME_DROP_COUNT);
  assert.ok(THEME_TRANSITION_DURATION_MS >= 2_800);
  assert.ok(THEME_TRANSITION_DURATION_MS <= 3_200);
  assert.ok(
    Math.max(...slowestTransition.drops.map((drop) => drop.delay + drop.duration)) <=
      THEME_TRANSITION_DURATION_MS,
  );

  const coveredCells = new Set<string>();
  for (const drop of firstTransition.drops) {
    assert.ok(drop.centerX >= 0 && drop.centerX <= 1_440);
    assert.ok(drop.centerY >= 0 && drop.centerY <= 900);
    assert.ok(drop.maxRadius > drop.impactRadius);
    assert.ok(drop.impactRadius > 0);
    assert.ok(drop.delay >= 0);
    assert.ok(drop.duration >= 2_050 && drop.duration <= 2_350);
    assert.ok(drop.delay + drop.duration <= THEME_TRANSITION_DURATION_MS);
    assert.ok(drop.shape >= 0 && drop.shape < 3);

    coveredCells.add(
      `${Math.floor(drop.centerX / 360)}-${Math.floor(drop.centerY / 300)}`,
    );
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
