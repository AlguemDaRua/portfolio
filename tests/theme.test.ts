import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createWaterPalette,
  createWaterReveal,
  createWaterTransition,
  drawWaterOverlayFrame,
  waterClipPath,
  waterFrontRadius,
  waterHighlightStrength,
  waterRippleProgress,
  WATER_DURATION_MS,
  WATER_IMPACT_MS,
} from "../lib/theme-water";

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

/** Records every drawing call so the water can be inspected frame by frame. */
function fakeContext() {
  const calls: string[] = [];
  const colours: string[] = [];
  const context = {
    calls,
    colours,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    globalAlpha: 1,
    beginPath: () => calls.push("beginPath"),
    closePath: () => calls.push("closePath"),
    moveTo: () => calls.push("moveTo"),
    lineTo: () => calls.push("lineTo"),
    arc: (x: number, y: number, r: number) => calls.push(`arc:${r.toFixed(2)}`),
    fill: () => calls.push("fill"),
    stroke() {
      calls.push("stroke");
      colours.push(String(this.strokeStyle));
    },
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    scale: () => calls.push("scale"),
    clearRect: () => calls.push("clearRect"),
    fillRect: () => calls.push("fillRect"),
    createRadialGradient: () => {
      calls.push("radialGradient");
      return {
        addColorStop: (_stop: number, colour: string) => colours.push(colour),
      };
    },
    createLinearGradient: () => {
      calls.push("linearGradient");
      return { addColorStop: () => {} };
    },
  };
  return context as unknown as CanvasRenderingContext2D & {
    calls: string[];
    colours: string[];
  };
}

test("Theme tokens are centralized and cover both color schemes", () => {
  const tokens = readProjectFile("styles/tokens.css");
  const requiredVariables = [
    "--paper",
    "--text",
    "--muted",
    "--line",
    "--accent",
    "--soft",
    "--strong",
    "--body-text",
    "--control",
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

test("One water engine drives the theme and the language", () => {
  const revealStyles = readProjectFile("styles/water-transition.css");
  const accessibilityStyles = readProjectFile("styles/accessibility.css");
  const runner = readProjectFile("lib/water-change.ts");
  const provider = readProjectFile("context/ThemeContext.tsx");
  const language = readProjectFile("context/LanguageContext.tsx");
  const shell = readProjectFile("components/layout/PortfolioShell.tsx");
  const nextConfig = readProjectFile("next.config.ts");
  const water = readProjectFile("lib/theme-water.ts");

  assert.match(revealStyles, /\.water-snapshot\s*\{/);
  assert.match(revealStyles, /z-index:\s*0/);
  assert.match(revealStyles, /pointer-events:\s*none/);
  assert.match(revealStyles, /\.water-reveal\s*\{/);
  assert.match(
    revealStyles,
    /html\.water-transitioning[\s\S]*?transition:\s*none/,
  );
  // The reveal is a clip, not a mask: clips stay on the fast path.
  assert.doesNotMatch(revealStyles, /mask-image|mask-mode/);
  assert.doesNotMatch(
    revealStyles,
    /mix-blend-mode|opacity:\s*0\.\d+|::view-transition/,
  );

  // The runner owns the copy, the clip, the commit and the cleanup.
  assert.match(runner, /createPageSnapshot/);
  assert.match(runner, /supportsWaterClip/);
  assert.match(runner, /createWaterReveal/);
  assert.match(runner, /cancelWaterChange/);
  assert.match(runner, /reveal\?\.dispose\(\)/);
  assert.match(runner, /snapshot\?\.dispose\(\)/);
  assert.match(runner, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(water, /toDataURL|mask-image|destination-out/);

  assert.match(provider, /runWaterChange/);
  assert.match(provider, /departing: departingTheme/);
  assert.match(provider, /arriving: nextTheme/);
  assert.match(provider, /flushSync\(\(\) => applyTheme\(nextTheme\)\)/);
  assert.doesNotMatch(
    provider,
    /document\.startViewTransition|root\.animate|navigator\.userAgent/,
  );
  assert.match(language, /runWaterChange/);
  assert.match(language, /flushSync\(\(\) => commitLocale\(nextLocale\)\)/);
  assert.doesNotMatch(shell, /WaterOverlay|ThemePaintOverlay/);
  assert.match(accessibilityStyles, /prefers-reduced-motion:\s*reduce/);
  assert.match(nextConfig, /allowedDevOrigins:\s*\["\*\.e2b\.app"\]/);
  assert.match(nextConfig, /turbopack:\s*\{\s*root:\s*projectRoot/);

  // Every trace of the old splatter engine is gone.
  assert.equal(
    fs.existsSync(path.join(rootDir, "lib/theme-paint.ts")),
    false,
    "The old splatter engine must be deleted, not renamed around",
  );
  assert.doesNotMatch(water, /ink|splatter|splash-ink|speck/i);

  // Seen from above: nothing falls through the page before the impact.
  assert.doesNotMatch(water, /dropDistance|dropRadius|fallProgress|DropOffset/);
  assert.doesNotMatch(water, /linearGradient\(/, "No motion streak in the air");
});

test("The water lands in the exact centre and comes from the arriving theme", () => {
  const first = createWaterTransition("dark", 1440, 900, seededRandom(42));
  assert.deepEqual(
    first,
    createWaterTransition("dark", 1440, 900, seededRandom(42)),
  );
  assert.notDeepEqual(
    first,
    createWaterTransition("dark", 1440, 900, seededRandom(99)),
  );
  assert.equal(first.theme, "dark");
  assert.deepEqual(first.origin, { x: 720, y: 450 });
  assert.equal(first.crests.length, 5);
  for (const crest of first.crests) {
    assert.ok(
      Math.abs(crest) > 0 && Math.abs(crest) < 90,
      "Ripples sit around the front, measured in pixels",
    );
  }

  // Going dark the water is the dark surface; going light it is the light one.
  const toDark = createWaterPalette("light", "dark");
  const toLight = createWaterPalette("dark", "light");
  assert.equal(toDark.front, "13, 14, 17");
  assert.equal(toLight.front, "250, 250, 247");
  assert.notEqual(toDark.front, toLight.front);
  assert.equal(toDark.ahead, toLight.behind);
  assert.equal(toDark.behind, toLight.ahead);

  // Switching language changes no surface, so the front needs contrast to be
  // seen at all: it uses the page's own neutral tone, never a brand colour.
  assert.deepEqual(
    createWaterPalette("light", "light"),
    createWaterPalette("light"),
  );
  assert.equal(createWaterPalette("light", "light").front, "72, 75, 84");
  assert.equal(createWaterPalette("dark", "dark").front, "224, 228, 236");
});

test("Every water tone is neutral: no stray blue drop", () => {
  for (const [departing, arriving] of [
    ["light", "dark"],
    ["dark", "light"],
    ["light", "light"],
    ["dark", "dark"],
  ] as const) {
    const palette = createWaterPalette(departing, arriving);
    for (const [name, value] of Object.entries(palette)) {
      const [red, green, blue] = value.split(",").map(Number);
      assert.equal(
        value.split(",").length,
        3,
        `${name} must be an "r, g, b" triplet`,
      );
      assert.ok(
        blue <= red + 12,
        `${name} (${value}) must stay neutral, not blue`,
      );
      assert.ok(Math.abs(blue - green) <= 20, `${name} must not be icy`);
    }
  }

  const water = readProjectFile("lib/theme-water.ts");
  const literals = water.match(/rgba?\([^)]*\)/g) ?? [];
  assert.ok(literals.length > 0);
  for (const literal of literals) {
    const match = /\((\d+),\s*(\d+),\s*(\d+)/.exec(literal);
    if (!match) continue;
    const [red, , blue] = match.slice(1).map(Number);
    assert.ok(
      blue <= red + 12,
      `No hard-coded blue tones in the water: ${literal}`,
    );
  }
});

test("Ripples start at the impact point and only expand, then stop", () => {
  assert.equal(waterRippleProgress(0), 0);
  assert.equal(waterFrontRadius(0, 1_000), 0, "The first frame is a point");
  assert.equal(waterRippleProgress(WATER_DURATION_MS), 1);
  assert.equal(waterHighlightStrength(WATER_DURATION_MS), 0);

  let previousRadius = -1;
  let previousGrowth = Infinity;
  for (let elapsed = 0; elapsed <= WATER_DURATION_MS; elapsed += 10) {
    const radius = waterFrontRadius(elapsed, 1000);
    assert.ok(radius >= previousRadius, "The front never retreats");
    const growth = radius - previousRadius;
    if (previousRadius >= 0 && growth > 0) {
      assert.ok(
        growth <= previousGrowth + 1e-9,
        "A real wave decelerates as it spreads",
      );
      previousGrowth = growth;
    }
    previousRadius = radius;
  }
  assert.equal(waterFrontRadius(WATER_DURATION_MS, 1000), 1000);

  // Smooth: no single frame anywhere in the life of the ripple jumps the edge.
  assert.ok(
    waterFrontRadius(16, 850) < 24,
    "The first frame moves less than 24px on a laptop",
  );
  assert.ok(
    waterFrontRadius(16, 850) > waterFrontRadius(16, 400),
    "A bigger viewport moves faster, as real water would",
  );
});

test("Every viewport is fully covered by the final frame", () => {
  for (const [width, height] of [
    [1, 1],
    [390, 844],
    [1440, 900],
    [3840, 2160],
    [4000, 300],
    [300, 4000],
  ]) {
    for (const random of [seededRandom(42), () => 0, () => 0.999999]) {
      const transition = createWaterTransition("light", width, height, random);
      assert.equal(transition.origin.x, width / 2);
      assert.equal(transition.origin.y, height / 2);

      const finalRadius = waterFrontRadius(
        WATER_DURATION_MS,
        transition.maxRadius,
      );
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
        assert.ok(
          finalRadius >= distance,
          "The last frame must clear the whole viewport",
        );
      }
    }
  }

  assert.equal(waterClipPath(120.44, { x: 720, y: 450 }), "circle(120.4px at 720.0px 450.0px)");
  assert.equal(waterClipPath(-5, { x: 0, y: 0 }), "circle(0.0px at 0.0px 0.0px)");
});

test("The visible layer draws the impact and ripples in theme tones", () => {
  const transition = createWaterTransition(
    "dark",
    1280,
    800,
    seededRandom(3),
    createWaterPalette("light", "dark"),
  );
  const context = fakeContext();

  drawWaterOverlayFrame(context, transition, 8);
  const impact = context.calls.join(",");
  assert.match(impact, /clearRect/);
  assert.match(impact, /radialGradient/, "The impact point glows");
  assert.match(impact, /arc/, "The disturbance is round, seen from above");
  assert.doesNotMatch(impact, /linearGradient/, "Nothing streaks across the page");
  assert.doesNotMatch(impact, /fillRect/, "Nothing opaque is laid over the page");

  context.calls.length = 0;
  drawWaterOverlayFrame(context, transition, WATER_IMPACT_MS + 60);
  const ripples = context.calls.join(",");
  assert.match(ripples, /stroke/, "Ripples are strokes, not filled blobs");
  assert.doesNotMatch(ripples, /fillRect/);

  for (const colour of context.colours) {
    const match = /\((\d+),\s*(\d+),\s*(\d+)/.exec(colour);
    if (!match) continue;
    const [red, , blue] = match.slice(1).map(Number);
    assert.ok(blue <= red + 12, `Every drawn tone stays neutral: ${colour}`);
  }

  context.calls.length = 0;
  drawWaterOverlayFrame(context, transition, WATER_DURATION_MS);
  assert.deepEqual(
    context.calls,
    ["clearRect"],
    "Highlights are gone when the water is still",
  );
});

test("Reveal lifecycle: clipped live page, 60 fps canvas, fully released", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const callbacks = new Map<number, FrameRequestCallback>();
  const clips = new Map<string, string>();
  const created: FakeCanvas[] = [];
  const attached: FakeCanvas[] = [];
  let frameId = 0;
  let canvasContextAvailable = true;

  type FakeCanvas = {
    width: number;
    height: number;
    className?: string;
    style: Record<string, string>;
    setAttribute: () => void;
    remove: () => void;
    getContext: (id: string) => unknown;
  };

  const appendChild = (node: FakeCanvas) => {
    attached.push(node);
    return node;
  };

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
      body: { appendChild },
      createElement: () => {
        const canvas: FakeCanvas = {
          width: 0,
          height: 0,
          style: {},
          setAttribute: () => {},
          remove: () => {
            const index = attached.indexOf(canvas);
            if (index >= 0) attached.splice(index, 1);
          },
          getContext: () =>
            canvasContextAvailable
              ? {
                  scale() {},
                  clearRect() {},
                  beginPath() {},
                  arc() {},
                  fill() {},
                  stroke() {},
                  fillRect() {},
                  createRadialGradient: () => ({ addColorStop: () => {} }),
                }
              : null,
        };
        created.push(canvas);
        return canvas;
      },
    },
  });

  const page = {
    style: {
      setProperty: (key: string, value: string) => clips.set(key, value),
      removeProperty: (key: string) => clips.delete(key),
    },
    getBoundingClientRect: () => ({ left: 12, top: -40 }),
  } as unknown as HTMLElement;
  const advance = (time: number) => {
    const [id, callback] = [...callbacks.entries()][0];
    callbacks.delete(id);
    callback(time);
  };

  try {
    const transition = createWaterTransition(
      "dark",
      3840,
      2160,
      seededRandom(4),
    );
    const reveal = createWaterReveal(transition, page);
    assert.equal(created.length, 1, "One canvas: the water, nothing else");
    const [overlay] = created;
    assert.equal(overlay.className, "water-reveal");
    assert.equal(
      overlay.width,
      3840 * 1.5,
      "The visible layer follows the display, capped for cost",
    );
    assert.equal(
      clips.get("clip-path"),
      "circle(0px at 0px 0px)",
      "The live page is hidden before its state changes",
    );
    assert.equal(clips.get("-webkit-clip-path"), clips.get("clip-path"));

    const startedAt = performance.now();
    let completed = false;
    reveal.play(() => {
      completed = true;
      reveal.dispose();
    });
    reveal.play(() => assert.fail("Cannot start two loops"));
    assert.equal(callbacks.size, 1);

    // First frame: the surface is already open, so the water responds instantly.
    advance(startedAt + 16);
    const firstClip = clips.get("clip-path")!;
    assert.match(firstClip, /^circle\([\d.]+px at 1908\.0px 1120\.0px\)$/);
    const firstRadius = Number(/circle\(([\d.]+)px/.exec(firstClip)![1]);
    assert.ok(firstRadius > 0 && firstRadius < 80);

    // Every frame updates the clip: display rate, not coarse steps.
    const radii: number[] = [firstRadius];
    for (let time = 32; time <= 320; time += 16) {
      advance(startedAt + time);
      const clip = clips.get("clip-path")!;
      radii.push(Number(/circle\(([\d.]+)px/.exec(clip)![1]));
    }
    for (let index = 1; index < radii.length; index += 1) {
      assert.ok(radii[index] > radii[index - 1], "The front keeps advancing");
    }

    advance(startedAt + WATER_DURATION_MS + 16);
    assert.equal(
      completed,
      false,
      "Present the fully open clip before finishing",
    );
    assert.ok(
      Number(/circle\(([\d.]+)px/.exec(clips.get("clip-path")!)![1]) >=
        transition.maxRadius - 0.1,
      "The last frame clears the viewport",
    );
    advance(startedAt + WATER_DURATION_MS + 32);
    assert.equal(completed, true);
    assert.equal(clips.size, 0, "The clip is removed with the reveal");
    assert.equal(callbacks.size, 0);
    assert.equal(attached.length, 0, "The water canvas leaves the DOM");
    assert.equal(overlay.width, 0);
    reveal.dispose();
    assert.equal(clips.size, 0, "Disposal is idempotent");

    const interrupted = createWaterReveal(transition, page);
    interrupted.play(() => assert.fail("Cancelled water must not finish"));
    interrupted.dispose();
    assert.equal(callbacks.size, 0);
    assert.equal(clips.size, 0);
    assert.equal(attached.length, 0, "An interrupted reveal leaves nothing");
    interrupted.play(() => assert.fail("Disposed reveal must not restart"));
    assert.equal(callbacks.size, 0);

    canvasContextAvailable = false;
    const failed = createWaterReveal(transition, page);
    let failedComplete = false;
    failed.play(() => {
      failedComplete = true;
      failed.dispose();
    });
    assert.equal(failedComplete, true, "No canvas means no animation, no error");
    assert.equal(clips.size, 0);
    assert.equal(attached.length, 0);
    canvasContextAvailable = true;
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
    "water-transition.css",
    "accessibility.css",
  ]) {
    assert.ok(
      globalStyles.includes(stylesheet),
      `Global styles must include ${stylesheet}`,
    );
  }
});
