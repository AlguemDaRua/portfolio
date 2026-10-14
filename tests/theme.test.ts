import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createThemePaint,
  drawThemePaintFrame,
  themeDropRadius,
  createThemeTransition,
  THEME_DROP_COLUMNS,
  THEME_DROP_COUNT,
  THEME_DROP_ROWS,
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
  assert.match(paintStyles, /mask-image:\s*var\(--theme-paint-mask/);
  assert.match(paintStyles, /-webkit-mask-image:\s*var\(--theme-paint-mask/);
  assert.match(paintStyles, /mask-size:\s*100% 100%/);
  assert.match(paintStyles, /mask-mode:\s*alpha/);
  assert.match(paintStyles, /html\.theme-transitioning[\s\S]*?transition:\s*none/);
  assert.match(paintStyles, /::view-transition-new\(root\)\s*\{\s*z-index: 2/);
  assert.match(paintStyles, /mix-blend-mode:\s*normal/);
  assert.doesNotMatch(paintStyles, /mix-blend-mode:\s*difference|opacity:\s*0\.\d+/);
  assert.doesNotMatch(paintStyles, /@property|@keyframes theme-drop/);

  assert.match(provider, /document\.startViewTransition/);
  assert.match(provider, /supportsPaintMasks/);
  assert.match(provider, /flushSync\(\(\) => applyTheme\(nextTheme\)\)/);
  assert.match(provider, /prefers-reduced-motion:\s*reduce/);
  assert.match(provider, /viewTransition\.ready/);
  assert.match(provider, /paint\.dispose\(\)/);
  assert.match(provider, /version !== activeTransitionVersion/);
  assert.doesNotMatch(shell, /ThemePaintOverlay|PaintBlob/);
  assert.match(accessibilityStyles, /prefers-reduced-motion:\s*reduce/);
  assert.match(nextConfig, /allowedDevOrigins:\s*\["\*\.e2b\.app"\]/);
  assert.match(nextConfig, /turbopack:\s*\{\s*root:\s*projectRoot/);
});

test("Paint drops are reproducible, varied, scattered, and arrive throughout the viewport", () => {
  const first = createThemeTransition("dark", 1440, 900, seededRandom(42));
  assert.deepEqual(first, createThemeTransition("dark", 1440, 900, seededRandom(42)));
  assert.notDeepEqual(first, createThemeTransition("dark", 1440, 900, seededRandom(99)));
  assert.equal(first.theme, "dark");
  assert.equal(first.drops.length, THEME_DROP_COUNT);
  assert.ok(THEME_DROP_COUNT >= 48);
  assert.ok(new Set(first.drops.map((drop) => drop.maxRadius)).size > 32);
  assert.ok(new Set(first.drops.map((drop) => drop.impactRadius)).size > 32);

  const cells = new Set<string>();
  for (const drop of first.drops) {
    assert.ok(drop.centerX >= 0 && drop.centerX < first.width);
    assert.ok(drop.centerY >= 0 && drop.centerY < first.height);
    assert.ok(drop.maxRadius > drop.impactRadius && drop.impactRadius > 0);
    assert.ok(drop.delay >= 0 && drop.duration > 0);
    assert.ok(drop.delay + drop.duration <= THEME_TRANSITION_DURATION_MS);
    cells.add(`${Math.floor(drop.centerX / (1440 / THEME_DROP_COLUMNS))}-${Math.floor(drop.centerY / (900 / THEME_DROP_ROWS))}`);
  }
  assert.equal(cells.size, THEME_DROP_COLUMNS * THEME_DROP_ROWS);
  assert.ok(first.drops.filter((drop) => drop.delay <= 250).length >= 24);
  assert.ok(first.drops.some((drop) => drop.delay > 450));
});

test("Growing drops guarantee full coverage without a finishing sheet, even at extreme RNG/viewport sizes", () => {
  for (const [width, height] of [[1, 1], [390, 844], [1440, 900], [3840, 2160], [4000, 300], [300, 4000]]) {
    for (const random of [seededRandom(42), seededRandom(99), () => 0, () => 0.999999]) {
      const transition = createThemeTransition("light", width, height, random);
      for (let row = 0; row < THEME_DROP_ROWS; row += 1) {
        for (let column = 0; column < THEME_DROP_COLUMNS; column += 1) {
          const left = column * width / THEME_DROP_COLUMNS;
          const right = (column + 1) * width / THEME_DROP_COLUMNS;
          const top = row * height / THEME_DROP_ROWS;
          const bottom = (row + 1) * height / THEME_DROP_ROWS;
          // A disk is convex: containing all four corners proves it contains
          // the entire cell, not merely sampled pixels or an estimated percent.
          assert.ok(transition.drops.some((drop) =>
            [[left, top], [right, top], [left, bottom], [right, bottom]].every(([x, y]) =>
              Math.hypot(x - drop.centerX, y - drop.centerY) + 1 <
                themeDropRadius(drop, THEME_TRANSITION_DURATION_MS),
            ),
          ));
        }
      }
    }
  }
});

test("Ink only accumulates: delayed drops appear and every radius grows monotonically", () => {
  const transition = createThemeTransition("dark", 800, 600, seededRandom(7));
  const previous = transition.drops.map(() => 0);
  let previousCount = 0;
  let fills = 0;
  let arcs = 0;
  const context = {
    fillStyle: "",
    beginPath() {},
    arc() { arcs += 1; },
    fill() { fills += 1; },
    clearRect() { assert.fail("Cumulative ink must never be erased"); },
    fillRect() { assert.fail("Coverage must come from drops, not an opaque finishing rectangle"); },
  } as unknown as CanvasRenderingContext2D;

  for (let elapsed = -1; elapsed <= THEME_TRANSITION_DURATION_MS; elapsed += 16) {
    const count = transition.drops.filter((drop) => themeDropRadius(drop, elapsed) > 0).length;
    assert.ok(count >= previousCount);
    previousCount = count;
    transition.drops.forEach((drop, index) => {
      const radius = themeDropRadius(drop, elapsed);
      assert.ok(radius >= previous[index] && radius <= drop.maxRadius);
      previous[index] = radius;
    });
    const before = arcs;
    drawThemePaintFrame(context, transition, elapsed);
    assert.equal(arcs - before, count);
  }
  assert.equal(previousCount, THEME_DROP_COUNT);
  assert.equal(arcs, fills);
  assert.equal(context.fillStyle, "#ffffff");
});

test("Canvas masks advance via rAF, remain detached, and release frames/styles on completion or interruption", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const callbacks = new Map<number, FrameRequestCallback>();
  const values = new Map<string, string>();
  let frameId = 0;
  let styles = 0;
  let encodeFails = false;
  let contextAvailable = true;
  const context = { scale() {}, beginPath() {}, arc() {}, fill() {} };
  const canvas = {
    width: 0, height: 0,
    getContext: () => contextAvailable ? context : null,
    toDataURL: () => {
      if (encodeFails) throw new Error("Encoding failed");
      return "data:image/png;base64,procedural";
    },
  };
  const stylesheet = {
    textContent: "",
    sheet: { cssRules: [{ style: { setProperty: (key: string, value: string) => values.set(key, value) } }] },
    remove() { styles -= 1; values.clear(); },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    devicePixelRatio: 3,
    requestAnimationFrame(callback: FrameRequestCallback) {
      callbacks.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame(id: number) { callbacks.delete(id); },
  } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    createElement: (tag: string) => tag === "canvas" ? canvas : stylesheet,
    head: { appendChild(element: unknown) { assert.equal(element, stylesheet); styles += 1; } },
  } });
  const advance = (time: number) => {
    const [id, callback] = [...callbacks.entries()][0];
    callbacks.delete(id);
    callback(time);
  };

  try {
    const transition = createThemeTransition("dark", 3840, 2160, seededRandom(4));
    const paint = createThemePaint(transition);
    assert.ok(canvas.width * canvas.height < 2_005_000, "Bound high-DPI encoding cost");
    assert.equal(styles, 1);
    assert.equal(values.size, 0, "The CSS fallback hides the new snapshot before its first mask");
    let completed = false;
    paint.play(() => { completed = true; paint.dispose(); });
    paint.play(() => assert.fail("Cannot start two loops"));
    assert.equal(callbacks.size, 1);
    advance(performance.now() + 10);
    assert.equal(values.get("--theme-paint-mask"), 'url("data:image/png;base64,procedural")');
    advance(performance.now() + THEME_TRANSITION_DURATION_MS + 100);
    assert.equal(completed, false, "Present the fully covered mask before finishing");
    advance(performance.now() + THEME_TRANSITION_DURATION_MS + 120);
    assert.equal(completed, true);
    assert.equal(styles, 0);
    assert.equal(callbacks.size, 0);
    assert.equal(canvas.width, 0);
    paint.dispose();
    assert.equal(styles, 0, "Disposal is idempotent");

    const interrupted = createThemePaint(transition);
    interrupted.play(() => assert.fail("Cancelled paint must not finish"));
    interrupted.dispose();
    assert.equal(callbacks.size, 0);
    assert.equal(styles, 0);
    interrupted.play(() => assert.fail("Disposed paint must not restart"));
    assert.equal(callbacks.size, 0);

    const failed = createThemePaint(transition);
    encodeFails = true;
    failed.play(() => failed.dispose());
    advance(performance.now() + 10);
    assert.equal(styles, 0);
    assert.equal(callbacks.size, 0);

    contextAvailable = false;
    assert.throws(() => createThemePaint(transition), /Canvas 2D/);
    assert.equal(styles, 0);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
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
