export type ThemeMode = "light" | "dark";

export interface WaterPoint {
  x: number;
  y: number;
}

/**
 * Neutral tones of the water, expressed as "r, g, b" so each ripple can pick
 * its own alpha. Every tone comes from the arriving theme: nothing here is a
 * fixed brand colour, so the same water works in light and in dark.
 */
export interface WaterPalette {
  /** The arriving surface, seen at the wavefront as it sweeps the page. */
  front: string;
  /** Ripples travelling over the page that is leaving. */
  ahead: string;
  /** Ripples travelling over the page that has arrived. */
  behind: string;
  /** Specular glint, always nearly white. */
  glint: string;
}

export interface WaterTransition {
  theme: ThemeMode;
  width: number;
  height: number;
  /** Where the surface is struck: the exact centre of the viewport. */
  origin: WaterPoint;
  /** Distance the front must travel to clear the viewport. */
  maxRadius: number;
  /** Ripple offsets around the front, in pixels (negative = behind it). */
  crests: number[];
  palette: WaterPalette;
}

/** Impact and ripples until the new surface covers the viewport. */
export const WATER_DURATION_MS = 900;

/** How long the disturbance at the impact point stays visible. */
export const WATER_IMPACT_MS = 320;

/** Ripples around the leading front, in pixels (negative = behind it). */
const WATER_CREST_GAPS = [-64, -32, 20, 54, 88];

/** Headroom over the farthest corner, so the last frame always covers it. */
const CORNER_HEADROOM = 1.06;

const TAU = Math.PI * 2;

/** Tokens mirrored from styles/tokens.css, as "r, g, b". */
const SURFACES: Record<ThemeMode, { paper: string; contrast: string }> = {
  light: { paper: "250, 250, 247", contrast: "72, 75, 84" },
  dark: { paper: "13, 14, 17", contrast: "224, 228, 236" },
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

/**
 * The water takes its colour from the theme it is bringing in. Going dark the
 * front is the dark surface; going light it is the light one. Switching
 * language changes no surface, so the front uses that theme's own contrast
 * tone instead — the same neutral, never a brand colour.
 */
export function createWaterPalette(
  departing: ThemeMode = "light",
  arriving: ThemeMode = departing,
): WaterPalette {
  const sameSurface = departing === arriving;
  return {
    front: sameSurface ? SURFACES[arriving].contrast : SURFACES[arriving].paper,
    ahead: SURFACES[departing].contrast,
    behind: SURFACES[arriving].contrast,
    glint: "255, 255, 255",
  };
}

/** 0 → 1 across the ripple's life. The impact is the first frame. */
export function waterRippleProgress(elapsed: number): number {
  return clamp(elapsed / WATER_DURATION_MS);
}

/**
 * Radius of the front, viewed from above: a ring that leaves the impact point
 * at speed and eases off as it spreads. The slight quadratic term keeps the
 * first frames calm and the tail soft, so the edge never jumps.
 */
export function waterFrontRadius(elapsed: number, maxRadius: number): number {
  const t = waterRippleProgress(elapsed);
  return maxRadius * (1.45 * t - 0.45 * t * t);
}

/** Brightness of the highlights: strong at impact, gone when the water is still. */
export function waterHighlightStrength(elapsed: number): number {
  return (1 - waterRippleProgress(elapsed)) ** 1.15;
}

/**
 * The CSS clip that reveals the new page. A circle is the cheapest shape a
 * browser can clip at display rate, which keeps the wave at 60 fps even on
 * modest hardware; all the water detail rides on the canvas above it.
 */
export function waterClipPath(radius: number, point: WaterPoint): string {
  return `circle(${Math.max(0, radius).toFixed(1)}px at ${point.x.toFixed(1)}px ${point.y.toFixed(1)}px)`;
}

/** Geometry only: one surface, one front, one set of ripples. */
export function createWaterTransition(
  theme: ThemeMode,
  viewportWidth: number,
  viewportHeight: number,
  random: () => number = Math.random,
  palette: WaterPalette = createWaterPalette(theme, theme),
): WaterTransition {
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
    maxRadius: corner * CORNER_HEADROOM + 2,
    crests: WATER_CREST_GAPS.map((gap) => gap * between(random, 0.9, 1.12)),
    palette,
  };
}

function strokeCircle(
  context: CanvasRenderingContext2D,
  origin: WaterPoint,
  radius: number,
  width: number,
  color: string,
  alpha: number,
): void {
  if (alpha <= 0.008 || radius <= 0) return;
  context.beginPath();
  context.arc(origin.x, origin.y, radius, 0, TAU);
  context.lineWidth = width;
  context.strokeStyle = `rgba(${color}, ${alpha})`;
  context.stroke();
}

/** Droplets thrown out by the impact, seen from above: a radial scatter. */
function drawSpray(
  context: CanvasRenderingContext2D,
  transition: WaterTransition,
  elapsed: number,
): void {
  const life = 560;
  if (elapsed >= life) return;
  const t = elapsed / life;
  const fade = (1 - t) ** 1.4;
  const travel = 46 + Math.min(transition.width, transition.height) * 0.09;
  const { x: originX, y: originY } = transition.origin;
  context.fillStyle = `rgba(${transition.palette.front}, 1)`;

  for (let index = 0; index < 9; index += 1) {
    const angle = index * 2.399;
    // Not all droplets fly equally far; a fixed spread keeps it organic.
    const reach = travel * (0.45 + ((index * 53) % 11) / 16);
    const distance = reach * (1 - (1 - t) ** 2.2);
    const radius = 2.1 * fade * (0.7 + ((index * 31) % 9) / 14);
    if (radius < 0.25) continue;
    context.globalAlpha = fade * 0.6;
    context.beginPath();
    context.arc(
      originX + Math.cos(angle) * distance,
      originY + Math.sin(angle) * distance,
      radius,
      0,
      TAU,
    );
    context.fill();
  }
  context.globalAlpha = 1;
}

/**
 * The visible water, seen from above: a burst at the impact point, the front,
 * and the ripples that ride with it. Purely cosmetic; removed when the reveal
 * ends. Every shape is a circle, so a frame costs a handful of arcs.
 */
export function drawWaterOverlayFrame(
  context: CanvasRenderingContext2D,
  transition: WaterTransition,
  elapsed: number,
): void {
  context.clearRect(0, 0, transition.width, transition.height);

  const { origin, palette } = transition;
  const radius = waterFrontRadius(elapsed, transition.maxRadius);
  const strength = waterHighlightStrength(elapsed);
  if (strength <= 0.004) return;

  // The point of impact: a small glow and a hairline ring snapping outwards.
  if (elapsed < WATER_IMPACT_MS) {
    const burst = clamp(elapsed / WATER_IMPACT_MS);
    const fade = (1 - burst) ** 2;
    const glowRadius = 30 + 150 * (1 - (1 - burst) ** 3);

    const glow = context.createRadialGradient(
      origin.x,
      origin.y,
      0,
      origin.x,
      origin.y,
      glowRadius,
    );
    glow.addColorStop(0, `rgba(${palette.front}, ${0.1 * fade})`);
    glow.addColorStop(0.55, `rgba(${palette.front}, ${0.045 * fade})`);
    glow.addColorStop(1, `rgba(${palette.front}, 0)`);
    context.fillStyle = glow;
    context.beginPath();
    context.arc(origin.x, origin.y, glowRadius, 0, TAU);
    context.fill();

    strokeCircle(
      context,
      origin,
      3 + 26 * (1 - (1 - burst) ** 2.4),
      1.6 * fade + 0.3,
      palette.front,
      0.5 * fade,
    );
  }

  drawSpray(context, transition, elapsed);

  // Ripples ride with the front: the ones ahead of it read against the page
  // that is leaving, the ones behind read against the page that has arrived.
  transition.crests.forEach((gap, index) => {
    const crestRadius = radius + gap;
    if (crestRadius <= 0) return;
    const fade = strength * (1 - index * 0.14);
    strokeCircle(
      context,
      origin,
      crestRadius,
      gap < 0 ? 0.9 : 0.75,
      gap < 0 ? palette.behind : palette.ahead,
      (gap < 0 ? 0.22 : 0.3) * fade,
    );
  });

  // The front itself: a crisp line in the colour the wave is bringing in, a
  // specular glint just inside, and a whisper of shade just outside. Together
  // they read as water in both directions and mark the edge when only the
  // words change, not the surface.
  strokeCircle(context, origin, radius, 1.6, palette.front, 0.5 * strength);
  strokeCircle(context, origin, radius - 1, 1.2, palette.glint, 0.24 * strength);
  strokeCircle(context, origin, radius + 2.4, 4, palette.ahead, 0.1 * strength);

  // Rings inside the water, fading as the surface calms.
  if (elapsed < WATER_IMPACT_MS + 420) {
    const glow = (1 - clamp((elapsed - WATER_IMPACT_MS) / 420)) ** 1.6;
    [0.46, 0.72].forEach((scale, index) => {
      strokeCircle(
        context,
        origin,
        radius * scale,
        0.7,
        palette.behind,
        (0.12 + index * 0.03) * glow,
      );
    });
  }
}

export interface WaterReveal {
  play: (onComplete: () => void) => void;
  dispose: () => void;
}

/**
 * The reveal itself: the live page is clipped to a growing circle, so the copy
 * of the previous state shows through around it, while a detached canvas draws
 * the water above everything. Both are released on completion or interruption.
 */
export function createWaterReveal(
  transition: WaterTransition,
  page: HTMLElement,
): WaterReveal {
  const overlay = document.createElement("canvas");
  overlay.className = "water-reveal";
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("inert", "");
  // 60 fps on a full-resolution layer: the visible edge lives here.
  const scale = Math.min(window.devicePixelRatio || 1, 1.5);
  overlay.width = Math.max(1, Math.round(transition.width * scale));
  overlay.height = Math.max(1, Math.round(transition.height * scale));
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  const context = overlay.getContext("2d");
  context?.scale(
    overlay.width / transition.width,
    overlay.height / transition.height,
  );
  document.body.appendChild(overlay);

  // Hide the live page before its state changes, so the copy is what shows.
  page.style.setProperty("-webkit-clip-path", "circle(0px at 0px 0px)");
  page.style.setProperty("clip-path", "circle(0px at 0px 0px)");

  let frame: number | null = null;
  let disposed = false;
  let started = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame !== null) window.cancelAnimationFrame(frame);
    page.style.removeProperty("clip-path");
    page.style.removeProperty("-webkit-clip-path");
    overlay.remove();
    overlay.width = overlay.height = 0;
  };

  return {
    dispose,
    play(onComplete) {
      if (disposed || started) return;
      if (!context) {
        onComplete();
        return;
      }
      started = true;
      const bounds = page.getBoundingClientRect();
      const centre = {
        x: transition.origin.x - bounds.left,
        y: transition.origin.y - bounds.top,
      };
      const start = performance.now();
      let applied = -1;

      const tick = (now: number) => {
        if (disposed) return;
        try {
          const elapsed = now - start;
          const finished = elapsed >= WATER_DURATION_MS;
          const radius = finished
            ? transition.maxRadius
            : waterFrontRadius(elapsed, transition.maxRadius);

          drawWaterOverlayFrame(context, transition, elapsed);

          if (radius !== applied) {
            applied = radius;
            const clip = waterClipPath(radius, centre);
            // Direct properties avoid invalidating inherited variables on the
            // whole subtree, and support older prefixed WebKit too.
            page.style.setProperty("-webkit-clip-path", clip);
            page.style.setProperty("clip-path", clip);
          }

          frame = window.requestAnimationFrame(finished ? onComplete : tick);
        } catch {
          // A clipping failure should still reveal the committed state.
          onComplete();
        }
      };
      frame = window.requestAnimationFrame(tick);
    },
  };
}
