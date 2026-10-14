import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createThemePaint,
  drawThemePaintFrame,
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
    assert.ok(
      tokens.includes(variable),
      `Theme tokens must define '${variable}'`,
    );
  }

  assert.ok(
    tokens.includes(":root {"),
    "Light tokens must be the root defaults",
  );
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

test("Paint drops are reproducible, varied, scattered, and arrive throughout the viewport", () => {
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
  assert.equal(first.drops.length, THEME_DROP_COUNT);
  assert.ok(THEME_DROP_COUNT >= 48);
  assert.ok(new Set(first.drops.map((drop) => drop.coreRadius)).size > 32);
  assert.ok(
    new Set(first.drops.map((drop) => JSON.stringify(drop.outline))).size > 32,
  );

  const cells = new Set<string>();
  for (const drop of first.drops) {
    assert.ok(drop.centerX >= 0 && drop.centerX < first.width);
    assert.ok(drop.centerY >= 0 && drop.centerY < first.height);
    assert.ok(drop.coreRadius > 0);
    assert.ok(drop.delay >= 0 && drop.delay < THEME_TRANSITION_DURATION_MS);
    assert.equal(drop.outline.length, 28);
    assert.ok(drop.specks.length >= 5 && drop.specks.length <= 9);
    cells.add(
      `${Math.floor(drop.centerX / (1440 / THEME_DROP_COLUMNS))}-${Math.floor(drop.centerY / (900 / THEME_DROP_ROWS))}`,
    );
  }
  assert.equal(cells.size, THEME_DROP_COLUMNS * THEME_DROP_ROWS);
  assert.ok(first.drops.filter((drop) => drop.delay <= 250).length >= 24);
  assert.ok(first.drops.some((drop) => drop.delay > 450));
});

test("Static splatters guarantee full coverage without growth or a finishing sheet, even at extreme RNG/viewport sizes", () => {
  for (const [width, height] of [
    [1, 1],
    [390, 844],
    [1440, 900],
    [3840, 2160],
    [4000, 300],
    [300, 4000],
  ]) {
    for (const random of [
      seededRandom(42),
      seededRandom(99),
      () => 0,
      () => 0.999999,
    ]) {
      const transition = createThemeTransition("light", width, height, random);
      for (let row = 0; row < THEME_DROP_ROWS; row += 1) {
        for (let column = 0; column < THEME_DROP_COLUMNS; column += 1) {
          const left = (column * width) / THEME_DROP_COLUMNS;
          const right = ((column + 1) * width) / THEME_DROP_COLUMNS;
          const top = (row * height) / THEME_DROP_ROWS;
          const bottom = ((row + 1) * height) / THEME_DROP_ROWS;
          // A disk is convex: containing all four corners proves it contains
          // the entire cell, not merely sampled pixels or an estimated percent.
          assert.ok(
            transition.drops.some((drop) =>
              [
                [left, top],
                [right, top],
                [left, bottom],
                [right, bottom],
              ].every(
                ([x, y]) =>
                  Math.hypot(x - drop.centerX, y - drop.centerY) + 1 <
                  drop.coreRadius,
              ),
            ),
          );
        }
      }
    }
  }
});

test("Rounded irregular contours enclose their guaranteed coverage core", () => {
  const transition = createThemeTransition("dark", 1440, 900, seededRandom(8));
  for (const drop of transition.drops) {
    const points = drop.outline;
    const distances = points.map((point) =>
      Math.hypot(point.x - drop.centerX, point.y - drop.centerY),
    );
    assert.ok(
      Math.max(...distances) / Math.min(...distances) > 1.3,
      "A splatter is not a circular disk",
    );
    for (let index = 0; index < points.length; index += 1) {
      const previous = points[(index + points.length - 1) % points.length];
      const control = points[index];
      const next = points[(index + 1) % points.length];
      for (let t = 0; t <= 1; t += 0.05) {
        const x =
          ((1 - t) ** 2 * (previous.x + control.x)) / 2 +
          2 * (1 - t) * t * control.x +
          (t ** 2 * (control.x + next.x)) / 2;
        const y =
          ((1 - t) ** 2 * (previous.y + control.y)) / 2 +
          2 * (1 - t) * t * control.y +
          (t ** 2 * (control.y + next.y)) / 2;
        assert.ok(
          Math.hypot(x - drop.centerX, y - drop.centerY) >= drop.coreRadius,
        );
      }
    }
  }
});

test("Ink accumulates only through new full-size impacts; landed splatters never grow or redraw", () => {
  const transition = createThemeTransition("dark", 800, 600, seededRandom(7));
  const original = structuredClone(transition);
  let cursor = 0;
  let fills = 0;
  const context = {
    fillStyle: "",
    beginPath() {},
    moveTo() {},
    quadraticCurveTo() {},
    closePath() {},
    fill() {
      fills += 1;
    },
    arc() {
      assert.fail("No circular drops");
    },
    scale() {
      assert.fail("No growth or scaling of splatters");
    },
    clearRect() {
      assert.fail("Cumulative ink must never be erased");
    },
    fillRect() {
      assert.fail("No opaque finishing rectangle");
    },
  } as unknown as CanvasRenderingContext2D;

  for (
    let elapsed = 0;
    elapsed <= THEME_TRANSITION_DURATION_MS;
    elapsed += 16
  ) {
    const previous = cursor;
    const before = fills;
    cursor = drawThemePaintFrame(context, transition, elapsed, cursor);
    assert.equal(
      cursor,
      transition.drops.filter((drop) => drop.delay <= elapsed).length,
    );
    assert.equal(
      fills - before,
      transition.drops
        .slice(previous, cursor)
        .reduce((sum, drop) => sum + 1 + drop.specks.length, 0),
    );
    drawThemePaintFrame(context, transition, elapsed, cursor);
    const after = fills;
    drawThemePaintFrame(context, transition, elapsed, cursor);
    assert.equal(
      fills,
      after,
      "A repeated frame must not change existing ink, even its antialiased edges",
    );
  }
  assert.equal(cursor, THEME_DROP_COUNT);
  assert.deepEqual(transition, original, "Geometry never changes with time");
  assert.equal(context.fillStyle, "#ffffff");
});

test("An individual splatter has the exact same full-size path at impact and later", () => {
  const transition = createThemeTransition("light", 800, 600, seededRandom(18));
  const drop = transition.drops[20];
  transition.drops = [drop];
  const commands: number[][] = [];
  const context = {
    beginPath() {},
    closePath() {},
    fill() {},
    moveTo(...args: number[]) {
      commands.push(args);
    },
    quadraticCurveTo(...args: number[]) {
      commands.push(args);
    },
  } as unknown as CanvasRenderingContext2D;
  assert.equal(drawThemePaintFrame(context, transition, drop.delay - 1), 0);
  assert.equal(commands.length, 0);
  assert.equal(drawThemePaintFrame(context, transition, drop.delay), 1);
  const impact = commands.splice(0);
  drawThemePaintFrame(context, transition, THEME_TRANSITION_DURATION_MS);
  assert.deepEqual(commands, impact);
});

test("Canvas masks advance via rAF, remain detached, and release frames/styles on completion or interruption", () => {
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
      canvas.width * canvas.height < 2_005_000,
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
    "responsive.css",
    "accessibility.css",
  ]) {
    assert.ok(
      globalStyles.includes(stylesheet),
      `Global styles must include ${stylesheet}`,
    );
  }
});
