import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createWaterReveal,
  createWaterTransition,
  drawWaterMaskFrame,
  drawWaterOverlayFrame,
  waterDropOffset,
  waterFallProgress,
  waterFrontRadius,
  waterHighlightStrength,
  waterRippleProgress,
  waterSettleProgress,
  waterWobble,
  WATER_DURATION_MS,
  WATER_FALL_MS,
  WATER_MASK_START,
  WATER_MIN_WOBBLE,
  WATER_SETTLE_MS,
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
  const context = {
    calls,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    globalAlpha: 1,
    beginPath: () => calls.push("beginPath"),
    closePath: () => calls.push("closePath"),
    moveTo: () => calls.push("moveTo"),
    lineTo: () => calls.push("lineTo"),
    arc: (x: number, y: number, r: number) => calls.push(`arc:${r.toFixed(2)}`),
    ellipse: () => calls.push("ellipse"),
    fill: () => calls.push("fill"),
    stroke: () => calls.push("stroke"),
    save: () => calls.push("save"),
    restore: () => calls.push("restore"),
    translate: () => calls.push("translate"),
    scale: () => calls.push("scale"),
    clearRect: () => calls.push("clearRect"),
    fillRect: () => calls.push("fillRect"),
    createRadialGradient: () => {
      calls.push("radialGradient");
      return { addColorStop: () => {} };
    },
    createLinearGradient: () => {
      calls.push("linearGradient");
      return { addColorStop: () => {} };
    },
  };
  return context as unknown as CanvasRenderingContext2D & { calls: string[] };
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

test("The theme change is a water reveal: one drop in the centre, nothing scattered", () => {
  const revealStyles = readProjectFile("styles/theme-transition.css");
  const accessibilityStyles = readProjectFile("styles/accessibility.css");
  const provider = readProjectFile("context/ThemeContext.tsx");
  const shell = readProjectFile("components/layout/PortfolioShell.tsx");
  const nextConfig = readProjectFile("next.config.ts");
  const water = readProjectFile("lib/theme-water.ts");

  assert.match(revealStyles, /\.theme-snapshot\s*\{/);
  assert.match(revealStyles, /mask-image:\s*linear-gradient\(black, black\)/);
  assert.match(revealStyles, /-webkit-mask-image:/);
  assert.match(revealStyles, /mask-size:\s*100% 100%/);
  assert.match(revealStyles, /mask-mode:\s*alpha/);
  assert.match(revealStyles, /pointer-events:\s*none/);
  assert.match(revealStyles, /\.water-reveal\s*\{/);
  assert.match(
    revealStyles,
    /html\.theme-transitioning[\s\S]*?transition:\s*none/,
  );
  assert.doesNotMatch(
    revealStyles,
    /mix-blend-mode|opacity:\s*0\.\d+|::view-transition/,
  );

  assert.doesNotMatch(
    provider,
    /document\.startViewTransition|root\.animate|navigator\.userAgent/,
  );
  assert.match(provider, /createThemeSnapshot/);
  assert.match(provider, /supportsWaterMask/);
  assert.match(provider, /createWaterReveal/);
  assert.match(provider, /flushSync\(\(\) => applyTheme\(nextTheme\)\)/);
  assert.match(provider, /prefers-reduced-motion:\s*reduce/);
  assert.match(provider, /reveal\.dispose\(\)/);
  assert.match(provider, /snapshot\?\.dispose\(\)/);
  assert.match(provider, /version !== activeTransitionVersion/);
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
});

test("The drop lands in the exact centre and nothing is scattered", () => {
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
  assert.ok(first.dropDistance > 0);
  assert.ok(first.dropRadius > 0);
  assert.ok(first.crests.length >= 2);
  for (const crest of first.crests) {
    assert.ok(
      Math.abs(crest) > 0 && Math.abs(crest) < 90,
      "Ripples sit around the front, measured in pixels",
    );
  }
});

test("The drop falls under gravity and stops exactly on the surface", () => {
  assert.equal(waterFallProgress(0), 0);
  assert.equal(waterFallProgress(WATER_FALL_MS), 1);
  assert.equal(waterFallProgress(WATER_FALL_MS * 3), 1);

  let previous = Infinity;
  for (let elapsed = 0; elapsed <= WATER_FALL_MS; elapsed += 6) {
    const offset = waterDropOffset(elapsed, 200);
    assert.ok(offset <= previous, "The drop never travels upwards");
    previous = offset;
  }
  assert.equal(waterDropOffset(WATER_FALL_MS, 200), 0);
  assert.equal(waterDropOffset(0, 200), 200);

  // Accelerating, not linear: it covers more ground in the second half.
  const firstHalf = 200 - waterDropOffset(WATER_FALL_MS / 2, 200);
  assert.ok(firstHalf < 100);
});

test("Ripples only expand, slow down, and settle to a still surface", () => {
  assert.equal(waterRippleProgress(0), 0);
  assert.equal(waterRippleProgress(WATER_FALL_MS), 0);
  assert.equal(
    waterRippleProgress(WATER_DURATION_MS - WATER_SETTLE_MS),
    1,
  );
  assert.equal(waterHighlightStrength(WATER_DURATION_MS), 0);
  assert.equal(waterSettleProgress(WATER_FALL_MS), 0);
  assert.equal(waterSettleProgress(WATER_DURATION_MS), 1);

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
  assert.equal(
    waterFrontRadius(WATER_DURATION_MS - WATER_SETTLE_MS, 1000),
    1000,
  );
});

test("Every viewport is fully covered, even at the smallest wobble", () => {
  assert.ok(WATER_MIN_WOBBLE > 0.94 && WATER_MIN_WOBBLE < 1);
  for (let step = 0; step < 720; step += 1) {
    assert.ok(waterWobble((step / 720) * Math.PI * 2, 1.3) >= WATER_MIN_WOBBLE);
  }

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
        WATER_DURATION_MS - WATER_SETTLE_MS,
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
        for (let step = 0; step < 64; step += 1) {
          const factor = waterWobble((step / 64) * Math.PI * 2, transition.phase);
          assert.ok(
            finalRadius * factor >= distance,
            "The last frame must clear the whole viewport",
          );
        }
      }
      assert.equal(
        waterSettleProgress(WATER_DURATION_MS),
        1,
        "The final frame fades away the last film",
      );
    }
  }
});

test("The mask only ever erases: ripples advance and the front never redraws backwards", () => {
  const transition = createWaterTransition("dark", 800, 600, seededRandom(7));
  const context = fakeContext();
  let cursor = WATER_MASK_START;
  let previousRadius = 0;

  for (
    let elapsed = WATER_FALL_MS + 16;
    elapsed <= WATER_DURATION_MS;
    elapsed += 16
  ) {
    const before = context.calls.length;
    const grew = cursor.radius;
    cursor = drawWaterMaskFrame(context, transition, elapsed, cursor);
    assert.ok(cursor.radius >= previousRadius, "The reveal never retreats");
    const drawn = context.calls.slice(before);
    if (cursor.radius > grew) {
      assert.ok(drawn.includes("fill"), "A growing front erases new water");
    } else {
      assert.deepEqual(drawn, ["fillRect"], "Only the settling fade remains");
    }
    previousRadius = cursor.radius;
  }

  // The final frame removes the last film of the old theme.
  cursor = drawWaterMaskFrame(context, transition, WATER_DURATION_MS, cursor);
  assert.equal(cursor.settle, 1);

  // Once the surface is still, a stray frame cannot change anything.
  const settled = context.calls.length;
  const result = drawWaterMaskFrame(context, transition, 0, cursor);
  assert.equal(result.radius, cursor.radius);
  assert.equal(context.calls.length, settled);
});

test("The visible layer draws a drop, a splash and ripples, then clears itself", () => {
  const transition = createWaterTransition("light", 1280, 800, seededRandom(3));
  const context = fakeContext();

  drawWaterOverlayFrame(context, transition, WATER_FALL_MS * 0.5);
  const falling = context.calls.join(",");
  assert.match(falling, /clearRect/);
  assert.match(falling, /linearGradient/, "The drop has a motion streak");
  assert.match(falling, /arc/, "The droplet is round");
  assert.match(falling, /ellipse/, "Specular highlight");

  context.calls.length = 0;
  drawWaterOverlayFrame(context, transition, WATER_FALL_MS + 40);
  const impact = context.calls.join(",");
  assert.match(impact, /ellipse/, "Crown splash on contact");
  assert.match(impact, /stroke/, "Ripples are strokes, not filled blobs");
  assert.doesNotMatch(impact, /fillRect/, "Nothing opaque is laid over the page");

  context.calls.length = 0;
  drawWaterOverlayFrame(context, transition, WATER_DURATION_MS);
  assert.ok(
    (context.calls.join(",").match(/stroke/g) ?? []).length < 4,
    "Highlights fade out as the water settles",
  );

  // The layer always starts from a clean frame: no ghost trails.
  assert.equal(context.calls[0], "clearRect");
});

test("Reveal lifecycle: rAF driven, detached, and fully released", () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const callbacks = new Map<number, FrameRequestCallback>();
  const values = new Map<string, string>();
  const created: FakeCanvas[] = [];
  const attached: FakeCanvas[] = [];
  let frameId = 0;
  let initialFills = 0;
  let encodeFails = false;
  let maskContextAvailable = true;

  type FakeCanvas = {
    width: number;
    height: number;
    className?: string;
    style: Record<string, string>;
    setAttribute: () => void;
    remove: () => void;
    getContext: (id: string) => unknown;
    toDataURL: () => string;
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
      getElementById: () => null,
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
          getContext: (id: string) => {
            if (id === "2d" && canvas.className !== "water-reveal") {
              if (!maskContextAvailable) return null;
              return {
                globalCompositeOperation: "source-over",
                fillStyle: "",
                fillRect() {
                  initialFills += 1;
                },
                scale() {},
                beginPath() {},
                arc() {},
                fill() {},
                createRadialGradient: () => ({ addColorStop: () => {} }),
                fillRectRaw() {},
              };
            }
            return {
              scale() {},
              clearRect() {},
              beginPath() {},
              moveTo() {},
              lineTo() {},
              closePath() {},
              arc() {},
              ellipse() {},
              fill() {},
              stroke() {},
              save() {},
              restore() {},
              translate() {},
              fillRect() {},
              createRadialGradient: () => ({ addColorStop: () => {} }),
              createLinearGradient: () => ({ addColorStop: () => {} }),
            };
          },
          toDataURL: () => {
            if (encodeFails) throw new Error("Encoding failed");
            return "data:image/png;base64,water";
          },
        };
        created.push(canvas);
        return canvas;
      },
    },
  });

  const target = {
    style: {
      setProperty: (key: string, value: string) => values.set(key, value),
      removeProperty: (key: string) => values.delete(key),
    },
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
    const reveal = createWaterReveal(transition, target);
    const [mask, overlay] = created;
    assert.equal(overlay.className, "water-reveal");
    assert.ok(
      mask.width * mask.height < 435_000,
      "Bound the mask encoding cost",
    );
    assert.equal(
      initialFills,
      1,
      "Initialize the old snapshot mask as fully opaque",
    );
    assert.equal(
      values.size,
      0,
      "The opaque CSS fallback preserves the old snapshot before the first frame",
    );

    const startedAt = performance.now();
    let completed = false;
    reveal.play(() => {
      completed = true;
      reveal.dispose();
    });
    reveal.play(() => assert.fail("Cannot start two loops"));
    assert.equal(callbacks.size, 1);

    advance(startedAt + 30);
    assert.equal(
      values.size,
      0,
      "While the drop is still in the air the old theme stays untouched",
    );

    advance(startedAt + WATER_FALL_MS + 60);
    assert.equal(
      values.get("mask-image"),
      'url("data:image/png;base64,water")',
    );
    assert.equal(values.get("-webkit-mask-image"), values.get("mask-image"));

    advance(startedAt + WATER_DURATION_MS + 100);
    assert.equal(
      completed,
      false,
      "Present the fully erased mask before finishing",
    );
    advance(startedAt + WATER_DURATION_MS + 120);
    assert.equal(completed, true);
    assert.equal(values.size, 0);
    assert.equal(callbacks.size, 0);
    assert.equal(attached.length, 0, "Both canvases leave the DOM");
    assert.equal(mask.width, 0);
    assert.equal(overlay.width, 0);
    reveal.dispose();
    assert.equal(values.size, 0, "Disposal is idempotent");

    const interrupted = createWaterReveal(transition, target);
    interrupted.play(() => assert.fail("Cancelled water must not finish"));
    interrupted.dispose();
    assert.equal(callbacks.size, 0);
    assert.equal(values.size, 0);
    assert.equal(attached.length, 0, "An interrupted reveal leaves nothing");
    interrupted.play(() => assert.fail("Disposed reveal must not restart"));
    assert.equal(callbacks.size, 0);

    const failed = createWaterReveal(transition, target);
    encodeFails = true;
    failed.play(() => failed.dispose());
    advance(performance.now() + WATER_FALL_MS + 40);
    assert.equal(values.size, 0);
    assert.equal(callbacks.size, 0);

    encodeFails = false;
    maskContextAvailable = false;
    assert.throws(() => createWaterReveal(transition, target), /Canvas 2D/);
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
