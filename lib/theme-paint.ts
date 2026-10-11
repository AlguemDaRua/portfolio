export type ThemeMode = "light" | "dark";

export interface PaintSplash {
  x: number;
  y: number;
  size: number;
  grow: number;
  turn: number;
  delay: number;
  duration: number;
  variant: number;
}

export interface PaintSheet {
  x: number;
  y: number;
  size: number;
  grow: number;
  turn: number;
  delay: number;
  duration: number;
  variant: number;
}

export interface PaintTarget {
  theme: ThemeMode;
  splashes: PaintSplash[];
  sheet: PaintSheet;
}

export const PAINT_ANIMATION_DURATION_MS = 1_200;
export const PAINT_BLOB_PATHS = [
  "M151 17 C173 21 182 44 205 43 C232 40 246 57 252 79 C278 77 288 98 280 120 C302 143 287 168 270 181 C279 205 259 222 236 219 C227 245 206 257 186 244 C166 272 142 276 126 253 C102 267 80 252 80 230 C54 236 39 215 49 193 C24 180 17 155 39 139 C20 115 35 92 60 86 C57 61 81 44 105 54 C119 30 135 12 151 17 Z",
  "M149 13 C174 17 185 36 197 52 C227 35 249 54 246 81 C278 74 293 99 276 125 C305 149 281 172 264 185 C283 212 259 232 233 223 C222 255 197 255 179 240 C159 280 132 267 122 243 C91 267 68 248 79 220 C43 231 29 207 50 181 C14 161 24 133 53 125 C28 96 50 73 77 80 C69 48 101 36 123 55 C127 28 136 10 149 13 Z",
  "M154 20 C176 8 194 34 203 51 C231 36 255 49 250 77 C287 76 292 106 274 127 C297 153 281 177 258 188 C277 217 250 235 226 222 C210 255 187 258 168 237 C146 273 118 259 111 235 C78 254 58 228 75 202 C38 209 24 183 50 159 C18 137 35 111 61 101 C43 68 68 49 98 65 C103 31 128 23 145 50 C146 39 147 28 154 20 Z",
] as const;

const GRID_COLUMNS = 4;
const GRID_ROWS = 3;
const EDGE_SPLASH_COUNT = 4;

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function randomVariant(random: () => number): number {
  return Math.min(
    PAINT_BLOB_PATHS.length - 1,
    Math.floor(random() * PAINT_BLOB_PATHS.length),
  );
}

function createSplash(
  x: number,
  y: number,
  random: () => number,
): PaintSplash {
  return {
    x: roundToTenth(x),
    y: roundToTenth(y),
    size: Math.round(between(random, 6, 13)),
    grow: Number(between(random, 2.4, 4.6).toFixed(2)),
    turn: Math.round(between(random, 0, 360)),
    delay: Math.round(between(random, 0, 240)),
    duration: Math.round(between(random, 430, 680)),
    variant: randomVariant(random),
  };
}

export function createPaintTarget(
  theme: ThemeMode,
  random: () => number = Math.random,
): PaintTarget {
  const splashes: PaintSplash[] = [];

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      const jitterX = between(random, -0.32, 0.32);
      const jitterY = between(random, -0.32, 0.32);
      const x = ((column + 0.5 + jitterX) / GRID_COLUMNS) * 100;
      const y = ((row + 0.5 + jitterY) / GRID_ROWS) * 100;
      splashes.push(createSplash(x, y, random));
    }
  }

  for (let index = 0; index < EDGE_SPLASH_COUNT; index += 1) {
    splashes.push(
      createSplash(
        between(random, -10, 110),
        between(random, -10, 110),
        random,
      ),
    );
  }

  return {
    theme,
    splashes,
    sheet: {
      x: Math.round(between(random, 8, 92)),
      y: Math.round(between(random, 8, 92)),
      size: Math.round(between(random, 58, 70)),
      grow: Number(between(random, 5.4, 6.2).toFixed(2)),
      turn: Math.round(between(random, 0, 360)),
      delay: Math.round(between(random, 0, 40)),
      duration: Math.round(between(random, 960, 1_010)),
      variant: randomVariant(random),
    },
  };
}
