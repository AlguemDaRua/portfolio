export type ThemeMode = "light" | "dark";

export interface ThemeDrop {
  centerX: number;
  centerY: number;
  impactRadius: number;
  maxRadius: number;
  delay: number;
  duration: number;
}

export interface ThemeTransition {
  theme: ThemeMode;
  width: number;
  height: number;
  drops: ThemeDrop[];
}

export const THEME_DROP_COLUMNS = 8;
export const THEME_DROP_ROWS = 6;
export const THEME_DROP_COUNT = THEME_DROP_COLUMNS * THEME_DROP_ROWS + 16;
export const THEME_TRANSITION_DURATION_MS = 1_600;
const MASK_PIXEL_BUDGET = 2_000_000;

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
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

  // Stratified randomness: one independently placed drop per cell guarantees
  // coverage without a giant finishing circle or an abrupt opaque fill.
  const drops = Array.from({ length: THEME_DROP_COUNT }, (_, index) => {
    const column = index % THEME_DROP_COLUMNS;
    const row = Math.floor(index / THEME_DROP_COLUMNS);
    const coversCell = row < THEME_DROP_ROWS;
    const x = between(random, 0.05, 0.95) * cellWidth;
    const y = between(random, 0.05, 0.95) * cellHeight;
    const maxRadius = coversCell
      ? Math.hypot(Math.max(x, cellWidth - x), Math.max(y, cellHeight - y)) + 2
      : between(random, 0.2, 0.7) * Math.hypot(cellWidth, cellHeight);

    return {
      centerX: coversCell ? column * cellWidth + x : random() * width,
      centerY: coversCell ? row * cellHeight + y : random() * height,
      impactRadius: Math.min(maxRadius * 0.15, between(random, 3, 12)),
      maxRadius,
      delay: 0,
      duration: between(random, 650, 1_050),
    };
  });

  // Arrival order must not reveal the underlying coverage grid.
  for (let index = drops.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [drops[index], drops[swap]] = [drops[swap], drops[index]];
  }
  drops.forEach((drop, index) => {
    drop.delay = index === 0 ? 0 : (index / drops.length) * 500 + random() * 5;
  });

  return { theme, width, height, drops };
}

export function themeDropRadius(drop: ThemeDrop, elapsed: number): number {
  if (elapsed < drop.delay) return 0;
  const progress = Math.min(1, Math.max(0, (elapsed - drop.delay) / drop.duration));
  // Small impacts swell increasingly quickly as more droplets arrive.
  return drop.impactRadius + (drop.maxRadius - drop.impactRadius) * progress ** 1.5;
}

export function drawThemePaintFrame(
  context: CanvasRenderingContext2D,
  transition: ThemeTransition,
  elapsed: number,
): void {
  context.fillStyle = "#ffffff";
  // Never clear: every previous ink pixel remains revealed (including the
  // antialiased rims). White is mask alpha, not paint laid over the page text.
  for (const drop of transition.drops) {
    const radius = themeDropRadius(drop, elapsed);
    if (radius === 0) continue;
    context.beginPath();
    context.arc(drop.centerX, drop.centerY, radius, 0, Math.PI * 2);
    context.fill();
  }
}

export interface ThemePaint {
  play: (onComplete: () => void) => void;
  dispose: () => void;
}

export function createThemePaint(transition: ThemeTransition): ThemePaint {
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
  context.scale(canvas.width / transition.width, canvas.height / transition.height);

  // Update only the pseudo-element's rule, not an inherited variable on <html>
  // (which would invalidate styles throughout the portfolio on every frame).
  const stylesheet = document.createElement("style");
  stylesheet.textContent = "html.theme-transitioning::view-transition-new(root) {}";
  document.head.appendChild(stylesheet);
  const rule = stylesheet.sheet?.cssRules[0] as CSSStyleRule | undefined;
  if (!rule) {
    stylesheet.remove();
    throw new Error("Canvas mask stylesheet is unavailable");
  }

  let frame: number | null = null;
  let disposed = false;
  let started = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame !== null) window.cancelAnimationFrame(frame);
    stylesheet.remove();
    // Release the backing store, even when the transition was interrupted.
    canvas.width = canvas.height = 0;
  };

  return {
    dispose,
    play(onComplete) {
      if (disposed || started) return;
      started = true;
      const start = performance.now();
      const tick = (now: number) => {
        if (disposed) return;
        try {
          const elapsed = now - start;
          drawThemePaintFrame(context, transition, elapsed);
          rule.style.setProperty("--theme-paint-mask", `url("${canvas.toDataURL("image/png")}")`);
          // Give the fully covered mask a paint opportunity before removing the
          // snapshots. No finishing rectangle, crossfade, or color inversion.
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
