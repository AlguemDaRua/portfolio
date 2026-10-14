export type ThemeMode = "light" | "dark";

export interface PaintPoint {
  x: number;
  y: number;
}

export interface ThemeDrop {
  centerX: number;
  centerY: number;
  /** Guaranteed interior of the irregular contour, NOT a circle we draw. */
  coreRadius: number;
  delay: number;
  outline: PaintPoint[];
  specks: PaintPoint[][];
}

export interface ThemeTransition {
  theme: ThemeMode;
  width: number;
  height: number;
  drops: ThemeDrop[];
}

export const THEME_DROP_COLUMNS = 16;
export const THEME_DROP_ROWS = 12;
export const THEME_DROP_COUNT = THEME_DROP_COLUMNS * THEME_DROP_ROWS * 2;
export const THEME_TRANSITION_DURATION_MS = 1_600;
const MASK_PIXEL_BUDGET = 2_000_000;

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

function createOutline(
  x: number,
  y: number,
  coreRadius: number,
  random: () => number,
  count = 28,
): PaintPoint[] {
  const step = (Math.PI * 2) / count;
  const phase = random() * Math.PI * 2;
  // Every quadratic segment lies inside the convex hull of three consecutive
  // radial points. This padding keeps that hull outside the guaranteed core,
  // even where rounding cuts into the irregular outline.
  const minimumRadius = coreRadius / Math.cos(step);
  return Array.from({ length: count }, (_, index) => {
    const angle = phase + index * step;
    const lobe = 0.16 * (1 + Math.sin(index * step * 3 + phase));
    const spur = random() < 0.18 ? between(random, 0.5, 1.3) : 0;
    const radius = minimumRadius * (1 + lobe + random() * 0.5 + spur);
    return { x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius };
  });
}

function createDrop(
  centerX: number,
  centerY: number,
  coreRadius: number,
  delay: number,
  random: () => number,
): ThemeDrop {
  return {
    centerX,
    centerY,
    coreRadius,
    delay,
    outline: createOutline(centerX, centerY, coreRadius, random),
    // Detached, asymmetric flecks give each impact a splashed-ink silhouette.
    specks: Array.from({ length: Math.floor(between(random, 5, 10)) }, () => {
      const angle = random() * Math.PI * 2;
      const distance = coreRadius * between(random, 1.8, 3.2);
      return createOutline(
        centerX + Math.cos(angle) * distance,
        centerY + Math.sin(angle) * distance,
        coreRadius * between(random, 0.035, 0.12),
        random,
        8,
      );
    }),
  };
}

export function createThemeTransition(
  theme: ThemeMode,
  viewportWidth: number,
  viewportHeight: number,
  random: () => number = Math.random,
): ThemeTransition {
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  const cellWidth = width / THEME_DROP_COLUMNS;
  const cellHeight = height / THEME_DROP_ROWS;
  const coverageCount = THEME_DROP_COLUMNS * THEME_DROP_ROWS;
  const cells = Array.from({ length: coverageCount }, (_, index) => index);
  for (let index = cells.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [cells[index], cells[swap]] = [cells[swap], cells[index]];
  }

  // Random full-size impacts, not growing blobs. The guaranteed interior of
  // each coverage stamp contains its cell; their union eventually covers the
  // viewport without a giant finishing shape or a last-frame opaque fill.
  const drops = cells.map((cell, arrival) => {
    const x = between(random, 0.1, 0.9) * cellWidth;
    const y = between(random, 0.1, 0.9) * cellHeight;
    return createDrop(
      (cell % THEME_DROP_COLUMNS) * cellWidth + x,
      Math.floor(cell / THEME_DROP_COLUMNS) * cellHeight + y,
      Math.hypot(Math.max(x, cellWidth - x), Math.max(y, cellHeight - y)) + 3,
      350 + ((arrival + random() * 0.8) / coverageCount) * 1_150,
      random,
    );
  });

  // Fine and medium spray falls throughout the effect, including the first
  // frame. Larger coverage stamps join it later, all in shuffled locations.
  for (let index = 0; index < coverageCount; index += 1) {
    drops.push(
      createDrop(
        random() * width,
        random() * height,
        Math.min(cellWidth, cellHeight) * between(random, 0.16, 0.65),
        (index / coverageCount) * 1_500,
        random,
      ),
    );
  }
  drops.sort((left, right) => left.delay - right.delay);
  return { theme, width, height, drops };
}

function drawOutline(
  context: CanvasRenderingContext2D,
  points: PaintPoint[],
): void {
  const last = points[points.length - 1];
  const first = points[0];
  context.beginPath();
  context.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    context.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + next.x) / 2,
      (point.y + next.y) / 2,
    );
  });
  context.closePath();
  context.fill();
}

/** Returns the cursor to pass to the next frame. Each impact is stamped ONCE. */
export function drawThemePaintFrame(
  context: CanvasRenderingContext2D,
  transition: ThemeTransition,
  elapsed: number,
  nextDrop = 0,
): number {
  context.fillStyle = "#ffffff";
  while (
    nextDrop < transition.drops.length &&
    transition.drops[nextDrop].delay <= elapsed
  ) {
    const drop = transition.drops[nextDrop];
    drawOutline(context, drop.outline);
    drop.specks.forEach((points) => drawOutline(context, points));
    nextDrop += 1;
  }
  // Never erase, scale, interpolate, or redraw existing ink. Only new impacts
  // change the alpha mask, so a landed splatter is completely stationary.
  return nextDrop;
}

export interface ThemePaint {
  play: (onComplete: () => void) => void;
  dispose: () => void;
}

export function createThemePaint(
  transition: ThemeTransition,
  target: HTMLElement,
): ThemePaint {
  // Detached HTML canvas: never mounted over content, never an external image.
  const canvas = document.createElement("canvas");
  const scale = Math.min(
    window.devicePixelRatio || 1,
    2,
    Math.sqrt(MASK_PIXEL_BUDGET / (transition.width * transition.height)),
  );
  canvas.width = Math.ceil(transition.width * scale);
  canvas.height = Math.ceil(transition.height * scale);
  // Every frame is read back for PNG encoding; a CPU backing store avoids an
  // expensive GPU readback (especially on mobile and software-rendered GPUs).
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas 2D is unavailable");
  context.scale(
    canvas.width / transition.width,
    canvas.height / transition.height,
  );

  // The mask starts opaque: the old themed DOM copy is initially intact.
  // Each full-size impact punches a hole through it to the real new theme.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, transition.width, transition.height);
  context.globalCompositeOperation = "destination-out";

  let frame: number | null = null;
  let disposed = false;
  let started = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame !== null) window.cancelAnimationFrame(frame);
    target.style.removeProperty("mask-image");
    target.style.removeProperty("-webkit-mask-image");
    // Release the backing store, even when the transition was interrupted.
    canvas.width = canvas.height = 0;
  };

  return {
    dispose,
    play(onComplete) {
      if (disposed || started) return;
      started = true;
      const start = performance.now();
      let nextDrop = 0;
      const tick = (now: number) => {
        if (disposed) return;
        try {
          const elapsed = now - start;
          const previousDrop = nextDrop;
          nextDrop = drawThemePaintFrame(
            context,
            transition,
            elapsed,
            nextDrop,
          );
          if (nextDrop !== previousDrop) {
            const image = canvas.toDataURL("image/png");
            if (!image.startsWith("data:image/png"))
              throw new Error("Invalid canvas mask");
            const mask = `url("${image}")`;
            // Direct properties avoid invalidating inherited variables on the
            // entire copied subtree, and support older prefixed WebKit too.
            target.style.setProperty("-webkit-mask-image", mask);
            target.style.setProperty("mask-image", mask);
          }
          // Give the fully erased mask a paint opportunity before removing the
          // snapshot. No finishing rectangle, crossfade, or color inversion.
          frame = window.requestAnimationFrame(
            elapsed >= THEME_TRANSITION_DURATION_MS ? onComplete : tick,
          );
        } catch {
          // Encoding/context failures should reveal the already committed theme.
          onComplete();
        }
      };
      frame = window.requestAnimationFrame(tick);
    },
  };
}
