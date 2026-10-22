export type ThemeMode = "light" | "dark";

export interface PaintPoint {
  x: number;
  y: number;
}

export interface ThemeSplash {
  /** Guaranteed interior of the central impact, never a drawn circle. */
  coreRadius: number;
  /** One irregular impact plus a handful of detached flecks. */
  shapes: PaintPoint[][];
}

export interface ThemeTransition {
  theme: ThemeMode;
  width: number;
  height: number;
  /** The single point where the theme change lands: the viewport centre. */
  origin: PaintPoint;
  splash: ThemeSplash;
  /** Distance the wave must travel to clear the farthest corner. */
  maxRadius: number;
}

export interface WaveCursor {
  radius: number;
  splashed: boolean;
}

/** Total time for the impact plus the wavefront that follows it. */
export const THEME_TRANSITION_DURATION_MS = 900;

/** The impact lands alone for a beat before the wave starts moving. */
export const THEME_WAVE_HOLD_MS = 110;

/** Resolution of the wavefront outline. */
export const THEME_WAVE_SEGMENTS = 180;

/** Two harmonics keep the front liquid rather than circular. */
export const THEME_WAVE_WOBBLE = 0.03;
export const THEME_WAVE_DETAIL = 0.018;

/** Smallest radius multiplier the wavefront can have at any angle. */
export const THEME_WAVE_MIN_FACTOR =
  1 - THEME_WAVE_WOBBLE - THEME_WAVE_DETAIL;

/** Headroom so the wave always clears the corners at full progress. */
const CORNER_HEADROOM = 1.08;

const MASK_PIXEL_BUDGET = 1_400_000;

export const THEME_WAVE_START: WaveCursor = { radius: 0, splashed: false };

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

function createOutline(
  x: number,
  y: number,
  coreRadius: number,
  random: () => number,
  count: number,
): PaintPoint[] {
  const step = (Math.PI * 2) / count;
  const phase = random() * Math.PI * 2;
  // Every quadratic segment sits inside the hull of three radial points, so
  // this padding keeps the rounded contour outside its guaranteed interior.
  const minimumRadius = coreRadius / Math.cos(step);
  return Array.from({ length: count }, (_, index) => {
    const angle = phase + index * step;
    const lobe = 0.14 * (1 + Math.sin(index * step * 3 + phase));
    const spur = random() < 0.16 ? between(random, 0.35, 0.9) : 0;
    const radius = minimumRadius * (1 + lobe + random() * 0.32 + spur);
    return { x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius };
  });
}

function createSplash(
  origin: PaintPoint,
  unit: number,
  random: () => number,
): ThemeSplash {
  const coreRadius = unit * 0.062;
  const shapes: PaintPoint[][] = [
    createOutline(origin.x, origin.y, coreRadius, random, 26),
  ];
  const flecks = Math.floor(between(random, 5, 8));
  for (let index = 0; index < flecks; index += 1) {
    const angle = (index / flecks) * Math.PI * 2 + random() * 0.9;
    const distance = coreRadius * between(random, 1.35, 2.5);
    shapes.push(
      createOutline(
        origin.x + Math.cos(angle) * distance,
        origin.y + Math.sin(angle) * distance,
        coreRadius * between(random, 0.16, 0.3),
        random,
        10,
      ),
    );
  }
  return { coreRadius, shapes };
}

/** Geometry only: a single central impact and the distance its wave must cover. */
export function createThemeTransition(
  theme: ThemeMode,
  viewportWidth: number,
  viewportHeight: number,
  random: () => number = Math.random,
): ThemeTransition {
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  const origin = { x: width / 2, y: height / 2 };
  const corner = Math.hypot(
    Math.max(origin.x, width - origin.x),
    Math.max(origin.y, height - origin.y),
  );
  return {
    theme,
    width,
    height,
    origin,
    splash: createSplash(origin, Math.min(width, height), random),
    maxRadius: corner * CORNER_HEADROOM + 2,
  };
}

/** Eased 0→1 progress of the wavefront, after the impact has been seen. */
export function themeWaveProgress(elapsed: number): number {
  const travel = THEME_TRANSITION_DURATION_MS - THEME_WAVE_HOLD_MS;
  const t = Math.min(
    1,
    Math.max(0, (elapsed - THEME_WAVE_HOLD_MS) / travel),
  );
  // Smooth acceleration out of the impact, then a calm settle at the edges.
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Radius the wavefront has reached at a given elapsed time. */
export function themeWaveRadius(elapsed: number, maxRadius: number): number {
  return themeWaveProgress(elapsed) * maxRadius;
}

/**
 * Angular shape of the front. The wobble fades in as the front grows, so the
 * first rings look like liquid rather than a star; full amplitude is reached
 * well before the wave leaves the viewport.
 */
export function themeWaveFactor(angle: number, amplitude = 1): number {
  return (
    1 +
    amplitude * THEME_WAVE_WOBBLE * Math.sin(angle * 3 + 1.7) +
    amplitude * THEME_WAVE_DETAIL * Math.sin(angle * 7 - 0.4)
  );
}

/** 0.35 → 1 over the first fifth of the travel. */
export function themeWaveAmplitude(progress: number): number {
  return 0.35 + 0.65 * Math.min(1, Math.max(0, progress / 0.2));
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

function drawWave(
  context: CanvasRenderingContext2D,
  transition: ThemeTransition,
  radius: number,
  amplitude: number,
): void {
  const { origin } = transition;
  context.beginPath();
  for (let index = 0; index < THEME_WAVE_SEGMENTS; index += 1) {
    const angle = (index / THEME_WAVE_SEGMENTS) * Math.PI * 2;
    const distance = radius * themeWaveFactor(angle, amplitude);
    const x = origin.x + Math.cos(angle) * distance;
    const y = origin.y + Math.sin(angle) * distance;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
}

/**
 * Erases the old-theme mask for one frame. The impact is stamped once; from
 * there only the wavefront advances, so the reveal is always monotonic.
 */
export function drawThemePaintFrame(
  context: CanvasRenderingContext2D,
  transition: ThemeTransition,
  elapsed: number,
  cursor: WaveCursor = THEME_WAVE_START,
): WaveCursor {
  context.fillStyle = "#ffffff";
  let next = cursor;

  if (!cursor.splashed) {
    transition.splash.shapes.forEach((points) => drawOutline(context, points));
    next = { radius: 0, splashed: true };
  }

  const radius = themeWaveRadius(elapsed, transition.maxRadius);
  if (radius <= next.radius) return next;

  drawWave(context, transition, radius, themeWaveAmplitude(themeWaveProgress(elapsed)));
  return { radius, splashed: true };
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
  // The impact and wave punch through it to reveal the real, new theme.
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
      let cursor: WaveCursor = THEME_WAVE_START;

      const tick = (now: number) => {
        if (disposed) return;
        try {
          const elapsed = now - start;
          const previous = cursor;
          cursor = drawThemePaintFrame(context, transition, elapsed, cursor);
          if (
            cursor.radius !== previous.radius ||
            cursor.splashed !== previous.splashed
          ) {
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
          // snapshot. No finishing rectangle, crossfade, or colour inversion.
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
