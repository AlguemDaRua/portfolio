import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createThemePaint,
  createThemeTransition,
  drawThemePaintFrame,
  themeWaveFactor,
  themeWaveProgress,
  themeWaveRadius,
  THEME_TRANSITION_DURATION_MS,
  THEME_WAVE_HOLD_MS,
  THEME_WAVE_MIN_FACTOR,
  THEME_WAVE_START,
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
    assert.ok(
      tokens.includes(variable),
      `Theme tokens must define '${variable}'`,
    );
  }

  assert.ok(tokens.includes(":root {"), "Light tokens must be root defaults");
  assert.ok(
    tokens.includes(':root[data-theme="dark"]'),
    "Dark tokens must be scoped to the document theme",
  );
});

test("Theme changes are revealed locally through a masked old-theme copy", () => {
  const paintStyles = readProjectFile("styles/theme-transition.css");
  const accessibilityStyles = readProjectFile("styles/accessibility.css");
  const provider = readProjectFile("context/ThemeContext.tsx");
  const shell = readProjectFile("components/layout/PortfolioShell.tsx");
  const nextConfig = readProjectFile("next.config.ts");

  assert.match(paintStyles, /\.theme-snapshot\s*\{/);
  assert.match(paintStyles, /mask-image:\s*linear-gradient\(black, black\)/);
  assert.match(paintStyles, /-webkit-mask-image:/);
  assert.match(paintStyles, /mask-size:\s*100% 100%/);
  assert.match(paintStyles, /mask-mode:\s*alpha/);
  assert.match(paintStyles, /pointer-events:\s*none/);
  assert.match(
    paintStyles,
    /html\.theme-transitioning[\s\S]*?transition:\s*none/,
  );
  assert.doesNotMatch(
    paintStyles,
    /mix-blend-mode|opacity:\s*0\.\d+|::view-transition/,
  );

  assert.doesNotMatch(
    provider,
    /document\.startViewTransition|root\.animate|navigator\.userAgent/,
  );
  assert.match(provider, /createThemeSnapshot/);
  assert.match(provider, /supportsPaintMasks/);
  assert.match(provider, /flushSync\(\(\) => applyTheme\(nextTheme\)\)/);
  assert.match(provider, /prefers-reduced-motion:\s*reduce/);
  assert.match(provider, /paint\.dispose\(\)/);
  assert.match(provider, /snapshot\?\.dispose\(\)/);
  assert.match(provider, /version !== activeTransitionVersion/);
  assert.doesNotMatch(shell, /ThemePaintOverlay|PaintBlob/);
  assert.match(accessibilityStyles, /prefers-reduced-motion:\s*reduce/);
  assert.match(nextConfig, /allowedDevOrigins:\s*\["\*\.e2b\.app"\]/);
  assert.match(nextConfig, /turbopack:\s*\{\s*root:\s*projectRoot/);
});

test("A single impact lands in the exact centre of the viewport", () => {
  const first = createThemeTransition("dark", 1440, 900, seededRandom(42));
  assert.deepEqual(
    first,
    createThemeTransition("dark", 1440, 900, seededRandom(42)),
  );
  assert.notDeepEqual(
    first,
    createThemeTransition("dark", 1440, 900, seededRandom(99)),
  );
  assert.equal(first.theme, "dark");
  assert.deepEqual(first.origin, { x: 720, y: 450 });

  const { splash } = first;
  assert.ok(splash.shapes.length >= 6 && splash.shapes.length <= 9);
  assert.ok(splash.coreRadius > 0);

  // Nothing has splash beyond the centre: no drops scattered across the page.
  for (const shape of splash.shapes) {
    for (const point of shape) {
      const distance = Math.hypot(
        point.x - first.origin.x,
        point.y - first.origin.y,
      );
      assert.ok(
        distance <= splash.coreRadius * 7,
        `Splash point ${distance} escaped the centre`,
      );
    }
  }

  // The impact itself is irregular, never a plain circle.
  const main = splash.shapes[0];
  const radii = main.map((point) =>
    Math.hypot(point.x - first.origin.x, point.y - first.origin.y),
  );
  assert.ok(Math.max(...radii) / Math.min(...radii) > 1.3);
});

test("The wave is centred, monotonic and clears every corner in every viewport", () => {
  assert.equal(themeWaveProgress(0), 0);
  assert.equal(themeWaveProgress(-10), 0);
  for (let elapsed = 0; elapsed <= THEME_WAVE_HOLD_MS; elapsed += 5) {
    assert.equal(themeWaveProgress(elapsed), 0, "The impact lands alone");
  }
  assert.equal(themeWaveProgress(THEME_TRANSITION_DURATION_MS), 1);
  assert.equal(themeWaveProgress(THEME_TRANSITION_DURATION_MS + 500), 1);

  for (const [width, height] of [
    [1, 1],
    [390, 844],
    [1440, 900],
    [3840, 2160],
    [4000, 300],
    [300, 4000],
  ]) {
    for (const random of [seededRandom(42), () => 0, () => 0.999999]) {
      const transition = createThemeTransition("light", width, height, random);
      assert.equal(transition.origin.x, width / 2);
      assert.equal(transition.origin.y, height / 2);

      let previous = -1;
      for (let elapsed = 0; elapsed <= THEME_TRANSITION_DURATION_MS; elapsed += 20) {
        const radius = themeWaveRadius(elapsed, transition.maxRadius);
        assert.ok(radius >= previous, "The wave never retreats");
        previous = radius;
        assert.ok(radius <= transition.maxRadius);
      }

      const finalRadius = themeWaveRadius(
        THEME_TRANSITION_DURATION_MS,
        transition.maxRadius,
      );
      assert.equal(finalRadius, transition.maxRadius);

      for (const [x, y] of [
        [0, 0],
        [width, 0],
        [0, height],
        [width, height],
      ]) {
        const distance = Math.hypot(
          x - transition.origin.x,
          y - transition.origin.y,
        );
        for (let step = 0; step < 64; step += 1) {
          const factor = themeWaveFactor((step / 64) * Math.PI * 2);
          assert.ok(factor >= THEME_WAVE_MIN_FACTOR - 1e-9);
          assert.ok(
            finalRadius * factor >= distance,
            "The final frame must clear the whole viewport",
          );
        }
      }
    }
  }
});

test("Ink only accumulates: the impact is stamped once and the front only advances", () => {
  const transition = createThemeTransition("dark", 800, 600, seededRandom(7));
  let cursor = THEME_WAVE_START;
  let fills = 0;
  const context = {
    fillStyle: "",
    beginPath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    closePath() {},
    fill() {
      fills += 1;
    },
    clearRect() {
      assert.fail("Cumulative ink must never be erased");
    },
    fillRect() {
      assert.fail("No opaque finishing rectangle");
    },
    scale() {
      assert.fail("No scaling of the reveal");
    },
  } as unknown as CanvasRenderingContext2D;

  const impact = drawThemePaintFrame(context, transition, 0, cursor);
  assert.equal(impact.splashed, true);
  assert.equal(impact.radius, 0);
  assert.equal(fills, transition.splash.shapes.length);
  cursor = impact;

  const repeated = drawThemePaintFrame(context, transition, 0, cursor);
  assert.equal(
    fills,
    transition.splash.shapes.length,
    "A repeated frame adds no ink",
  );
  cursor = repeated;

  for (
    let elapsed = 16;
    elapsed <= THEME_TRANSITION_DURATION_MS;
    elapsed += 16
  ) {
    const before = fills;
    cursor = drawThemePaintFrame(context, transition, elapsed, cursor);
    assert.equal(
      fills - before,
      elapsed > THEME_WAVE_HOLD_MS ? 1 : 0,
      "One wavefront stamp per frame once the impact has landed",
    );
  }

  const finalCursor = drawThemePaintFrame(
    context,
    transition,
    THEME_TRANSITION_DURATION_MS,
    cursor,
  );
  const settled = fills;
  drawThemePaintFrame(
    context,
    transition,
    THEME_TRANSITION_DURATION_MS,
    finalCursor,
  );
  drawThemePaintFrame(context, transition, 0, finalCursor);
  assert.equal(fills, settled, "A stale frame cannot smear the front");
});

test("Canvas masks advance via rAF, stay detached, and release on completion", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const callbacks = new Map<number, FrameRequestCallback>();
  const values = new Map<string, string>();
  let frameId = 0;
  let initialFills = 0;
  let encodeFails = false;
  let contextAvailable = true;
  const context = {
    globalCompositeOperation: "source-over",
    fillRect() {
      initialFills += 1;
    },
    scale() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    closePath() {},
    fill() {},
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => (contextAvailable ? context : null),
    toDataURL: () => {
      if (encodeFails) throw new Error("Encoding failed");
      return "data:image/png;base64,procedural";
    },
  };
  const target = {
    style: {
      setProperty: (key: string, value: string) => values.set(key, value),
      removeProperty: (key: string) => values.delete(key),
    },
  } as unknown as HTMLElement;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      devicePixelRatio: 3,
      requestAnimationFrame(callback: FrameRequestCallback) {
        callbacks.set(++frameId, callback);
        return frameId;
      },
      cancelAnimationFrame(id: number) {
        callbacks.delete(id);
      },
    },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: (tag: string) => {
        assert.equal(tag, "canvas");
        return canvas;
      },
    },
  });
  const advance = (time: number) => {
    const [id, callback] = [...callbacks.entries()][0];
    callbacks.delete(id);
    callback(time);
  };

  try {
    const transition = createThemeTransition(
      "dark",
      3840,
      2160,
      seededRandom(4),
    );
    const paint = createThemePaint(transition, target);
    assert.ok(
      canvas.width * canvas.height < 1_405_000,
      "Bound high-DPI encoding cost",
    );
    assert.equal(
      initialFills,
      1,
      "Initialize the old snapshot mask as fully opaque",
    );
    assert.equal(context.globalCompositeOperation, "destination-out");
    assert.equal(
      values.size,
      0,
      "The opaque CSS fallback preserves the old snapshot before the first frame",
    );

    let completed = false;
    paint.play(() => {
      completed = true;
      paint.dispose();
    });
    paint.play(() => assert.fail("Cannot start two loops"));
    assert.equal(callbacks.size, 1);

    advance(performance.now() + 10);
    assert.equal(
      values.get("mask-image"),
      'url("data:image/png;base64,procedural")',
    );
    assert.equal(values.get("-webkit-mask-image"), values.get("mask-image"));

    advance(performance.now() + THEME_TRANSITION_DURATION_MS + 100);
    assert.equal(
      completed,
      false,
      "Present the fully erased mask before finishing",
    );
    advance(performance.now() + THEME_TRANSITION_DURATION_MS + 120);
    assert.equal(completed, true);
    assert.equal(values.size, 0);
    assert.equal(callbacks.size, 0);
    assert.equal(canvas.width, 0);
    paint.dispose();
    assert.equal(values.size, 0, "Disposal is idempotent");

    const interrupted = createThemePaint(transition, target);
    interrupted.play(() => assert.fail("Cancelled paint must not finish"));
    interrupted.dispose();
    assert.equal(callbacks.size, 0);
    assert.equal(values.size, 0);
    interrupted.play(() => assert.fail("Disposed paint must not restart"));
    assert.equal(callbacks.size, 0);

    const failed = createThemePaint(transition, target);
    encodeFails = true;
    failed.play(() => failed.dispose());
    advance(performance.now() + 10);
    assert.equal(values.size, 0);
    assert.equal(callbacks.size, 0);

    contextAvailable = false;
    assert.throws(() => createThemePaint(transition, target), /Canvas 2D/);
    assert.equal(values.size, 0);
  } finally {
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalDocument)
      Object.defineProperty(globalThis, "document", originalDocument);
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
    "accessibility.css",
  ]) {
    assert.ok(
      globalStyles.includes(stylesheet),
      `Global styles must include ${stylesheet}`,
    );
  }
});
