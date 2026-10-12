export type ThemeMode = "light" | "dark";
export type ThemeDropKind = "sheet" | "splash";

export interface PaintSpeck {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
}

export interface ThemeDrop {
  kind: ThemeDropKind;
  centerX: number;
  centerY: number;
  maxRadius: number;
  impactRadius: number;
  delay: number;
  duration: number;
  shape: number;
  rotation: number;
  stretchX: number;
  stretchY: number;
  specks: PaintSpeck[];
  sheetPath: string | null;
}

export interface ThemeTransition {
  theme: ThemeMode;
  drops: ThemeDrop[];
}

export const THEME_DROP_COLUMNS = 6;
export const THEME_DROP_ROWS = 4;
export const THEME_SPLASH_COUNT = THEME_DROP_COLUMNS * THEME_DROP_ROWS + 8;
export const THEME_DROP_COUNT = THEME_SPLASH_COUNT + 1;
export const THEME_TRANSITION_DURATION_MS = 3_200;

const PAINT_BLOB_PATHS = [
  "M151 17 C173 21 182 44 205 43 C232 40 246 57 252 79 C278 77 288 98 280 120 C302 143 287 168 270 181 C279 205 259 222 236 219 C227 245 206 257 186 244 C166 272 142 276 126 253 C102 267 80 252 80 230 C54 236 39 215 49 193 C24 180 17 155 39 139 C20 115 35 92 60 86 C57 61 81 44 105 54 C119 30 135 12 151 17 Z",
  "M149 13 C174 17 185 36 197 52 C227 35 249 54 246 81 C278 74 293 99 276 125 C305 149 281 172 264 185 C283 212 259 232 233 223 C222 255 197 255 179 240 C159 280 132 267 122 243 C91 267 68 248 79 220 C43 231 29 207 50 181 C14 161 24 133 53 125 C28 96 50 73 77 80 C69 48 101 36 123 55 C127 28 136 10 149 13 Z",
  "M154 20 C176 8 194 34 203 51 C231 36 255 49 250 77 C287 76 292 106 274 127 C297 153 281 177 258 188 C277 217 250 235 226 222 C210 255 187 258 168 237 C146 273 118 259 111 235 C78 254 58 228 75 202 C38 209 24 183 50 159 C18 137 35 111 61 101 C43 68 68 49 98 65 C103 31 128 23 145 50 C146 39 147 28 154 20 Z",
] as const;

const PAINT_SPLATTER_DETAILS = [
  "<path d='M76 87 C58 67 52 51 60 40 C74 50 76 67 89 78Z' />",
  "<path d='M207 54 C224 35 239 27 249 33 C243 48 225 53 215 66Z' />",
  "<path d='M109 234 C100 255 95 276 108 287 C122 293 128 271 131 246Z' />",
  "<path d='M218 210 C241 215 260 226 262 239 C246 242 234 228 213 226Z' />",
  "<circle cx='30' cy='133' r='10' />",
  "<circle cx='276' cy='89' r='8' />",
  "<circle cx='54' cy='256' r='7' />",
  "<ellipse cx='273' cy='250' rx='7' ry='15' transform='rotate(35 273 250)' />",
  "<circle cx='178' cy='279' r='6' />",
] as const;

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }

  return items;
}

function createSpecks(random: () => number): PaintSpeck[] {
  const count = Math.floor(between(random, 7, 15));

  return Array.from({ length: count }, () => {
    const angle = between(random, 0, Math.PI * 2);
    const distance = between(random, 112, 182);

    return {
      x: Math.round((150 + Math.cos(angle) * distance) * 10) / 10,
      y: Math.round((150 + Math.sin(angle) * distance) * 10) / 10,
      radiusX: Math.round(between(random, 3, 17) * 10) / 10,
      radiusY: Math.round(between(random, 2, 9) * 10) / 10,
      rotation: Math.round((angle * 180) / Math.PI + between(random, -40, 40)),
    };
  });
}

function createSheetPath(random: () => number): string {
  const pointCount = 24;
  const phase = between(random, 0, Math.PI * 2);
  const points = Array.from({ length: pointCount }, (_, index) => {
    const angle = phase + (index / pointCount) * Math.PI * 2;
    const radius = between(random, 180, 215);

    return {
      x: Math.round((150 + Math.cos(angle) * radius) * 10) / 10,
      y: Math.round((150 + Math.sin(angle) * radius) * 10) / 10,
    };
  });
  const midpoint = (left: (typeof points)[number], right: (typeof points)[number]) => ({
    x: Math.round(((left.x + right.x) / 2) * 10) / 10,
    y: Math.round(((left.y + right.y) / 2) * 10) / 10,
  });
  const start = midpoint(points[pointCount - 1], points[0]);
  const path = [`M${start.x} ${start.y}`];

  for (let index = 0; index < pointCount; index += 1) {
    const point = points[index];
    const nextPoint = points[(index + 1) % pointCount];
    const end = midpoint(point, nextPoint);
    path.push(`Q${point.x} ${point.y} ${end.x} ${end.y}`);
  }

  path.push("Z");
  return path.join(" ");
}

function createDrop(
  kind: ThemeDropKind,
  centerX: number,
  centerY: number,
  maxRadius: number,
  delay: number,
  duration: number,
  random: () => number,
): ThemeDrop {
  return {
    kind,
    centerX: Math.round(centerX * 10) / 10,
    centerY: Math.round(centerY * 10) / 10,
    maxRadius: Math.ceil(maxRadius),
    impactRadius: Math.max(
      4,
      Math.round(
        maxRadius *
          between(random, kind === "sheet" ? 0.01 : 0.045, kind === "sheet" ? 0.028 : 0.1),
      ),
    ),
    delay: Math.round(delay),
    duration: Math.round(duration),
    shape: Math.floor(random() * PAINT_BLOB_PATHS.length),
    rotation: Math.round(between(random, 0, 360)),
    stretchX: Math.round(between(random, 0.78, 1) * 100) / 100,
    stretchY: Math.round(between(random, 0.72, 1) * 100) / 100,
    specks: createSpecks(random),
    sheetPath: kind === "sheet" ? createSheetPath(random) : null,
  };
}

export function createThemeTransition(
  theme: ThemeMode,
  viewportWidth: number,
  viewportHeight: number,
  random: () => number = Math.random,
): ThemeTransition {
  const width = Math.max(viewportWidth, 1);
  const height = Math.max(viewportHeight, 1);
  const cellWidth = width / THEME_DROP_COLUMNS;
  const cellHeight = height / THEME_DROP_ROWS;
  const cells = shuffle(
    Array.from({ length: THEME_DROP_COLUMNS * THEME_DROP_ROWS }, (_, index) => ({
      column: index % THEME_DROP_COLUMNS,
      row: Math.floor(index / THEME_DROP_COLUMNS),
    })),
    random,
  );

  const splashPositions = cells.map(({ column, row }) => ({
    x: (column + between(random, 0.06, 0.94)) * cellWidth,
    y: (row + between(random, 0.06, 0.94)) * cellHeight,
  }));

  for (let index = 0; index < 8; index += 1) {
    splashPositions.push({
      x: between(random, -0.12 * width, 1.12 * width),
      y: between(random, -0.14 * height, 1.14 * height),
    });
  }

  shuffle(splashPositions, random);

  const splashDiagonal = Math.hypot(cellWidth, cellHeight);
  const splashes = splashPositions.map(({ x, y }) => {
    const spread = between(random, 0.2, 0.95);

    return createDrop(
      "splash",
      x,
      y,
      splashDiagonal * spread,
      between(random, 0, 850),
      between(random, 1_250, 2_200),
      random,
    );
  });

  const sheetCenterX = between(random, -0.08 * width, 1.08 * width);
  const sheetCenterY = between(random, -0.08 * height, 1.08 * height);
  const farthestViewportCorner = Math.max(
    Math.hypot(sheetCenterX, sheetCenterY),
    Math.hypot(width - sheetCenterX, sheetCenterY),
    Math.hypot(sheetCenterX, height - sheetCenterY),
    Math.hypot(width - sheetCenterX, height - sheetCenterY),
  );
  const sheet = createDrop(
    "sheet",
    sheetCenterX,
    sheetCenterY,
    farthestViewportCorner * 2.2,
    between(random, 80, 360),
    between(random, 2_000, 2_550),
    random,
  );

  return { theme, drops: [sheet, ...splashes] };
}

function createPaintMask(drop: ThemeDrop): string {
  const transform = [
    "translate(150 150)",
    `rotate(${drop.rotation})`,
    `scale(${drop.stretchX} ${drop.stretchY})`,
    "translate(-150 -150)",
  ].join(" ");
  const randomSpecks = drop.specks.map(
    (speck) =>
      `<ellipse cx='${speck.x}' cy='${speck.y}' rx='${speck.radiusX}' ry='${speck.radiusY}' transform='rotate(${speck.rotation} ${speck.x} ${speck.y})' />`,
  );
  const svg = [
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='-80 -80 460 460'>",
    `<g fill='white' transform='${transform}'>`,
    `<path d='${drop.sheetPath ?? PAINT_BLOB_PATHS[drop.shape]}' />`,
    ...PAINT_SPLATTER_DETAILS,
    ...randomSpecks,
    "</g>",
    "</svg>",
  ].join("");

  return `url(\"data:image/svg+xml,${encodeURIComponent(svg)}\")`;
}

export function applyThemeDropVariables(
  root: HTMLElement,
  drops: readonly ThemeDrop[],
): void {
  drops.forEach((drop, index) => {
    root.style.setProperty(`--theme-drop-x-${index}`, `${drop.centerX}px`);
    root.style.setProperty(`--theme-drop-y-${index}`, `${drop.centerY}px`);
    root.style.setProperty(`--theme-drop-max-radius-${index}`, `${drop.maxRadius}px`);
    root.style.setProperty(`--theme-drop-impact-radius-${index}`, `${drop.impactRadius}px`);
    root.style.setProperty(`--theme-drop-delay-${index}`, `${drop.delay}ms`);
    root.style.setProperty(`--theme-drop-duration-${index}`, `${drop.duration}ms`);
    root.style.setProperty(`--theme-drop-mask-${index}`, createPaintMask(drop));
  });
}

export function clearThemeDropVariables(
  root: HTMLElement,
  count = THEME_DROP_COUNT,
): void {
  for (let index = 0; index < count; index += 1) {
    root.style.removeProperty(`--theme-drop-x-${index}`);
    root.style.removeProperty(`--theme-drop-y-${index}`);
    root.style.removeProperty(`--theme-drop-max-radius-${index}`);
    root.style.removeProperty(`--theme-drop-impact-radius-${index}`);
    root.style.removeProperty(`--theme-drop-delay-${index}`);
    root.style.removeProperty(`--theme-drop-duration-${index}`);
    root.style.removeProperty(`--theme-drop-mask-${index}`);
  }
}
