export type ThemeMode = "light" | "dark";

export interface WaterPoint {
  x: number;
  y: number;
}

export interface WaterTransition {
  theme: ThemeMode;
  width: number;
  height: number;
  /** Where the drop lands: the exact centre of the viewport. */
  origin: WaterPoint;
  /** How far above the impact the drop begins its fall. */
  dropDistance: number;
  /** Cosmetic radius of the falling droplet. */
  dropRadius: number;
  /** Distance the outermost ripple must travel to clear the viewport. */
  maxRadius: number;
  /** Phase of the organic shape shared by every ripple. */
  phase: number;
  /** Ripple offsets around the front, in pixels (negative = ahead). */
  crests: number[];
}

export interface WaterMaskCursor {
  radius: number;
  settle: number;
}

export const WATER_MASK_START: WaterMaskCursor = { radius: 0, settle: 0 };

/** The drop falls, hits, and the ripples die out. */
export const WATER_DURATION_MS = 1_150;

/** Time the droplet spends in the air before it touches the surface. */
export const WATER_FALL_MS = 250;

/** Final fade that clears the very last film of the old theme. */
export const WATER_SETTLE_MS = 150;

/** Ripples around the leading front, in pixels (negative = ahead of it). */
const WATER_CREST_GAPS = [-24, 16, 42, 74];

/** Angular distortion of a ripple. Kept small: water, not a star. */
const WATER_WOBBLE = 0.026;
const WATER_WOBBLE_DETAIL = 0.015;

/** Smallest possible wobble factor, used to prove the final coverage. */
export const WATER_MIN_WOBBLE = 1 - WATER_WOBBLE - WATER_WOBBLE_DETAIL;

/** Budget for the mask, in device pixels. Soft edges hide the scale. */
const MASK_PIXEL_BUDGET = 430_000;

/** The mask is encoded at 25 fps; the highlight layer runs every frame. */
const MASK_FRAME_MS = 40;

/** Headroom over the farthest corner, before the settling fade. */
const CORNER_HEADROOM = 1.06;

const TAU = Math.PI * 2;

/** Thin highlight bands inside the water, in pixels, so it reads as a surface. */
const CREST_GAPS = [10, 26, 46];

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

/** Gravity: the drop accelerates into the surface. */
export function waterFallProgress(elapsed: number): number {
  const t = clamp(elapsed / WATER_FALL_MS);
  return t * t;
}

/** How far above the impact the droplet still is. */
export function waterDropOffset(elapsed: number, dropDistance: number): number {
  return dropDistance * (1 - waterFallProgress(elapsed));
}

/** 0 → 1 across the ripple's life. */
export function waterRippleProgress(elapsed: number): number {
  return clamp(
    (elapsed - WATER_FALL_MS) / (WATER_DURATION_MS - WATER_SETTLE_MS - WATER_FALL_MS),
  );
}

/**
 * Radius of the reveal front. A fast crown leaves the impact point and then
 * slows down the way a real wave does, instead of moving at a constant speed.
 */
export function waterFrontRadius(elapsed: number, maxRadius: number): number {
  const t = waterRippleProgress(elapsed);
  return (1 - (1 - t) ** 2.4) * maxRadius;
}

/** Brightness of the highlights: strong at impact, gone when the water is still. */
export function waterHighlightStrength(elapsed: number): number {
  return (1 - waterRippleProgress(elapsed)) ** 1.15;
}

/** 0 → 1 fade that removes the last film of the old theme. */
export function waterSettleProgress(elapsed: number): number {
  return clamp((elapsed - (WATER_DURATION_MS - WATER_SETTLE_MS)) / WATER_SETTLE_MS);
}

/** Angular shape of one ripple. Always ≥ WATER_MIN_WOBBLE. */
export function waterWobble(angle: number, phase: number): number {
  return (
    1 +
    WATER_WOBBLE * Math.sin(angle * 3 + phase) +
    WATER_WOBBLE_DETAIL * Math.sin(angle * 5 - phase * 1.7)
  );
}

/** A closed, gently irregular ring, ready to stroke. */
function waterRingPath(radius: number, phase: number): WaterPoint[] {
  const segments = 132;
  return Array.from({ length: segments }, (_, index) => {
    const angle = (index / segments) * TAU;
    const distance = radius * waterWobble(angle, phase);
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  });
}

/** Geometry only: one drop, one surface, one set of ripples. */
export function createWaterTransition(
  theme: ThemeMode,
  viewportWidth: number,
  viewportHeight: number,
  random: () => number = Math.random,
): WaterTransition {
  const width = Math.max(1, viewportWidth);
  const height = Math.max(1, viewportHeight);
  const unit = Math.min(width, height);
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
    dropDistance: Math.max(96, unit * 0.3),
    dropRadius: Math.max(6, Math.min(17, unit * 0.017)),
    maxRadius: (corner / WATER_MIN_WOBBLE) * CORNER_HEADROOM + 2,
    phase: between(random, 0, TAU),
    crests: WATER_CREST_GAPS.map((gap) =>
      gap * between(random, 0.92, 1.08),
    ),
  };
}

function radialAlpha(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  stops: Array<[number, number]>,
): CanvasGradient {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  stops.forEach(([offset, alpha]) =>
    gradient.addColorStop(offset, `rgba(255, 255, 255, ${alpha})`),
  );
  return gradient;
}

function fillLobe(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  // Almost a hard edge: water has a crisp meniscus, not a fog bank.
  context.fillStyle = radialAlpha(context, x, y, radius, [
    [0, 1],
    [0.982, 1],
    [0.996, 0.88],
    [1, 0],
  ]);
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.fill();
}

function fillCrest(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  width: number,
  alpha: number,
): void {
  context.fillStyle = radialAlpha(context, x, y, radius + width, [
    [0, 0],
    [Math.min(0.985, (radius - width) / (radius + width)), 0],
    [radius / (radius + width), alpha],
    [1, 0],
  ]);
  context.beginPath();
  context.arc(x, y, radius + width, 0, TAU);
  context.fill();
}

/**
 * Erases the old-theme mask for one frame. Only ever removes alpha, so the
 * reveal can never move backwards no matter how frames are dropped.
 */
export function drawWaterMaskFrame(
  context: CanvasRenderingContext2D,
  transition: WaterTransition,
  elapsed: number,
  cursor: WaterMaskCursor = WATER_MASK_START,
): WaterMaskCursor {
  const radius = waterFrontRadius(elapsed, transition.maxRadius);
  const settle = waterSettleProgress(elapsed);
  if (radius <= cursor.radius && settle <= cursor.settle) return cursor;

  const { x, y } = transition.origin;
  context.fillStyle = "#ffffff";

  if (radius > cursor.radius) {
    // Four overlapping soft discs read as one slightly uneven water front,
    // without a polygon seam or a hard circular edge.
    for (let lobe = 0; lobe < 4; lobe += 1) {
      const angle = transition.phase + (lobe / 4) * TAU;
      const lobeRadius = radius * waterWobble(angle, transition.phase) * 0.998;
      fillLobe(
        context,
        x + Math.cos(angle) * radius * 0.004,
        y + Math.sin(angle) * radius * 0.004,
        lobeRadius,
      );
    }

    const strength = waterHighlightStrength(elapsed);
    if (strength > 0.04) {
      CREST_GAPS.forEach((gap, index) => {
        const crestRadius = radius - gap;
        if (crestRadius <= 0) return;
        fillCrest(
          context,
          x,
          y,
          crestRadius,
          Math.max(1.5, 2 + index * 1.5),
          0.3 * strength * (1 - index * 0.26),
        );
      });
    }
  }

  if (settle > 0) {
    // Liquid still moving over the far corners: fade the residue instead of
    // leaving a film behind or popping the last frame.
    context.fillStyle = `rgba(255, 255, 255, ${settle})`;
    context.fillRect(0, 0, transition.width, transition.height);
  }

  return { radius: Math.max(radius, cursor.radius), settle };
}

interface WaterPalette {
  core: string;
  body: string;
  rim: string;
  glint: string;
  /** "r, g, b" for rings drawn with an alpha. */
  ring: string;
  /** Near-white rim, used where the water catches the light. */
  glintRing: string;
  glow: string;
}

/** The drop is read against the surface it is about to hit (the old theme). */
function waterPalette(theme: ThemeMode): WaterPalette {
  if (theme === "dark") {
    // Going dark: the current page is light, so the water needs depth.
    return {
      core: "rgba(255, 255, 255, 0.96)",
      body: "rgba(150, 192, 255, 0.5)",
      rim: "rgba(58, 104, 190, 0.55)",
      glint: "rgba(255, 255, 255, 0.98)",
      ring: "47, 92, 178",
      glintRing: "235, 245, 255",
      glow: "rgba(60, 110, 200, 0.16)",
    };
  }
  // Going light: the current page is dark, so the water catches the light.
  return {
    core: "rgba(236, 246, 255, 0.98)",
    body: "rgba(196, 224, 255, 0.62)",
    rim: "rgba(168, 208, 255, 0.7)",
    glint: "rgba(255, 255, 255, 1)",
    ring: "198, 226, 255",
    glintRing: "255, 255, 255",
    glow: "rgba(160, 205, 255, 0.22)",
  };
}

/** Six droplets thrown out by the impact, falling back under gravity. */
function drawSpray(
  context: CanvasRenderingContext2D,
  transition: WaterTransition,
  since: number,
  palette: WaterPalette,
): void {
  const life = 620;
  if (since <= 0 || since >= life) return;
  const t = since / 1000;
  const fade = 1 - since / life;
  const gravity = 1_380;
  const { x: originX, y: originY } = transition.origin;

  for (let index = 0; index < 6; index += 1) {
    const angle = transition.phase + index * 1.07;
    const speed = transition.dropRadius * (9 + (index % 3) * 3.5);
    const x = originX + Math.cos(angle) * speed * t;
    const y =
      originY +
      Math.sin(angle) * speed * t * 0.55 +
      0.5 * gravity * t * t;
    const radius =
      transition.dropRadius * 0.22 * (0.7 + ((index * 37) % 10) / 18) * fade;
    if (radius < 0.4) continue;
    context.globalAlpha = fade * 0.85;
    context.fillStyle = palette.core;
    context.beginPath();
    context.arc(x, y, radius, 0, TAU);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawDroplet(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  stretch: number,
  palette: WaterPalette,
): void {
  context.save();
  context.translate(x, y);
  context.scale(1, stretch);

  const body = context.createRadialGradient(
    -radius * 0.35,
    -radius * 0.4,
    radius * 0.1,
    0,
    0,
    radius,
  );
  body.addColorStop(0, palette.core);
  body.addColorStop(0.55, palette.body);
  body.addColorStop(1, palette.glow);
  context.fillStyle = body;
  context.beginPath();
  context.arc(0, 0, radius, 0, TAU);
  context.fill();

  context.strokeStyle = palette.rim;
  context.lineWidth = Math.max(0.75, radius * 0.09);
  context.stroke();

  // Specular highlight and the small caustic under the drop.
  context.fillStyle = palette.glint;
  context.beginPath();
  context.ellipse(
    -radius * 0.32,
    -radius * 0.36,
    radius * 0.24,
    radius * 0.16,
    -0.6,
    0,
    TAU,
  );
  context.fill();

  context.globalAlpha = 0.45;
  context.beginPath();
  context.ellipse(
    radius * 0.22,
    radius * 0.34,
    radius * 0.16,
    radius * 0.1,
    -0.4,
    0,
    TAU,
  );
  context.fill();
  context.globalAlpha = 1;

  context.restore();
}

function strokeRing(
  context: CanvasRenderingContext2D,
  origin: WaterPoint,
  radius: number,
  phase: number,
  width: number,
  color: string,
  alpha: number,
): void {
  if (alpha <= 0.01 || radius <= 0) return;
  const points = waterRingPath(radius, phase);
  context.beginPath();
  points.forEach((point, index) => {
    const x = origin.x + point.x;
    const y = origin.y + point.y;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
  context.lineWidth = width;
  context.strokeStyle = `rgba(${color}, ${alpha})`;
  context.stroke();
}

/**
 * The visible water: the falling droplet, the splash, and the highlights that
 * travel with the ripples. This layer is purely cosmetic and is removed when
 * the reveal ends.
 */
export function drawWaterOverlayFrame(
  context: CanvasRenderingContext2D,
  transition: WaterTransition,
  elapsed: number,
): void {
  context.clearRect(0, 0, transition.width, transition.height);
  const palette = waterPalette(transition.theme);
  const { origin } = transition;

  if (elapsed < WATER_FALL_MS) {
    const fall = waterFallProgress(elapsed);
    const y = origin.y - waterDropOffset(elapsed, transition.dropDistance);
    // Long exposure while it falls; round again on contact.
    const stretch = 1.06 + 1.5 * (1 - fall);
    const trail = transition.dropRadius * (1.2 + fall * 6);

    const streak = context.createLinearGradient(
      origin.x,
      y - trail,
      origin.x,
      y,
    );
    streak.addColorStop(0, "rgba(160, 200, 255, 0)");
    streak.addColorStop(0.55, `rgba(200, 226, 255, ${0.1 + fall * 0.16})`);
    streak.addColorStop(1, `rgba(214, 236, 255, ${0.3 + fall * 0.4})`);
    context.fillStyle = streak;
    context.fillRect(
      origin.x - transition.dropRadius * 0.42,
      y - trail,
      transition.dropRadius * 0.84,
      trail,
    );

    drawDroplet(
      context,
      origin.x,
      y,
      transition.dropRadius,
      stretch,
      palette,
    );
    return;
  }

  const since = elapsed - WATER_FALL_MS;
  const radius = waterFrontRadius(elapsed, transition.maxRadius);
  const strength = waterHighlightStrength(elapsed);

  // Crown splash: a flattened ring that snaps out at contact and dies fast.
  if (since < 280) {
    const crown = clamp(since / 280);
    const crownRadius = transition.dropRadius * (1 + crown * 6.5);
    context.strokeStyle = `rgba(${palette.ring}, ${(1 - crown) ** 1.6 * 0.85})`;
    context.lineWidth = Math.max(0.6, 2.4 * (1 - crown));
    context.beginPath();
    context.ellipse(
      origin.x,
      origin.y,
      crownRadius,
      crownRadius * 0.55,
      0,
      0,
      TAU,
    );
    context.stroke();
  }

  // Ripples that travel with the front.
  // A soft penumbra plus a bright edge on the wavefront itself.
  strokeRing(
    context,
    origin,
    radius,
    transition.phase,
    2 + 3 * strength,
    palette.ring,
    0.09 * strength,
  );
  strokeRing(
    context,
    origin,
    radius,
    transition.phase,
    0.8 + 0.6 * strength,
    palette.ring,
    0.46 * strength,
  );

  // Inner meniscus: a bright rim just inside the front, like light caught in
  // the surface tension of a spreading wave.
  strokeRing(
    context,
    origin,
    radius * 0.988,
    transition.phase,
    1 + 1.2 * strength,
    palette.glintRing,
    0.4 * strength,
  );

  // Spray thrown up by the impact: small droplets on a ballistic arc.
  drawSpray(context, transition, since, palette);

  // Waves around the front: one leads it over the still surface, the rest
  // trail behind at a fixed wavelength, like real ripples.
  transition.crests.forEach((gap, index) => {
    const crestRadius = radius + gap;
    if (crestRadius <= 0) return;
    const fade = strength * (1 - index * 0.2);
    strokeRing(
      context,
      origin,
      crestRadius,
      transition.phase + index * 0.55,
      0.5 + 0.9 * fade,
      palette.ring,
      (gap < 0 ? 0.42 : 0.34) * fade,
    );
  });

  // Lingering rings inside the water, fading as the surface calms.
  if (since < 620) {
    const glow = (1 - clamp(since / 620)) ** 1.4;
    [0.32, 0.58, 0.8].forEach((scale, index) => {
      strokeRing(
        context,
        origin,
        radius * scale,
        transition.phase + 0.9 + index,
        0.6 + index * 0.4,
        palette.ring,
        0.16 * glow * (1 - index * 0.22),
      );
    });
  }
}

export interface WaterReveal {
  play: (onComplete: () => void) => void;
  dispose: () => void;
}

/**
 * Two detached canvases: one encodes the mask that peels away the old theme,
 * the other draws the visible drop and ripples above everything. Neither is
 * part of the React tree and both are removed on completion or interruption.
 */
export function createWaterReveal(
  transition: WaterTransition,
  maskTarget: HTMLElement,
): WaterReveal {
  const mask = document.createElement("canvas");
  const maskScale = Math.min(
    1,
    Math.sqrt(MASK_PIXEL_BUDGET / (transition.width * transition.height)),
  );
  mask.width = Math.max(1, Math.round(transition.width * maskScale));
  mask.height = Math.max(1, Math.round(transition.height * maskScale));
  const maskContext = mask.getContext("2d", { willReadFrequently: true });
  if (!maskContext) throw new Error("Canvas 2D is unavailable");
  maskContext.scale(
    mask.width / transition.width,
    mask.height / transition.height,
  );
  maskContext.fillStyle = "#ffffff";
  maskContext.fillRect(0, 0, transition.width, transition.height);
  maskContext.globalCompositeOperation = "destination-out";

  const overlay = document.createElement("canvas");
  overlay.className = "water-reveal";
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("inert", "");
  const overlayScale = Math.min(window.devicePixelRatio || 1, 1.5);
  overlay.width = Math.max(1, Math.round(transition.width * overlayScale));
  overlay.height = Math.max(1, Math.round(transition.height * overlayScale));
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  const overlayContext = overlay.getContext("2d");
  overlayContext?.scale(
    overlay.width / transition.width,
    overlay.height / transition.height,
  );
  document.body.appendChild(overlay);

  let frame: number | null = null;
  let disposed = false;
  let started = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frame !== null) window.cancelAnimationFrame(frame);
    maskTarget.style.removeProperty("mask-image");
    maskTarget.style.removeProperty("-webkit-mask-image");
    overlay.remove();
    mask.width = mask.height = 0;
    overlay.width = overlay.height = 0;
  };

  return {
    dispose,
    play(onComplete) {
      if (disposed || started) return;
      if (!overlayContext) {
        onComplete();
        return;
      }
      started = true;
      const start = performance.now();
      let cursor = WATER_MASK_START;
      let lastMask = -Infinity;

      const tick = (now: number) => {
        if (disposed) return;
        try {
          const elapsed = now - start;
          drawWaterOverlayFrame(overlayContext, transition, elapsed);

          if (elapsed - lastMask >= MASK_FRAME_MS || elapsed >= WATER_DURATION_MS) {
            lastMask = elapsed;
            const previous = cursor;
            cursor = drawWaterMaskFrame(maskContext, transition, elapsed, cursor);
            if (cursor.radius !== previous.radius || cursor.settle !== previous.settle) {
              const image = mask.toDataURL("image/png");
              if (!image.startsWith("data:image/png"))
                throw new Error("Invalid canvas mask");
              const maskValue = `url("${image}")`;
              // Direct properties avoid invalidating inherited variables on the
              // entire copied subtree, and support older prefixed WebKit too.
              maskTarget.style.setProperty("-webkit-mask-image", maskValue);
              maskTarget.style.setProperty("mask-image", maskValue);
            }
          }

          // Let the fully erased mask composite before the snapshot leaves, so
          // the last frame never shows a flash. No crossfade or colour inversion.
          frame = window.requestAnimationFrame(
            elapsed >= WATER_DURATION_MS ? onComplete : tick,
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
