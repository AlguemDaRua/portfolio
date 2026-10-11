export type ThemeMode = "light" | "dark";

export interface ThemeDrop {
  x: number;
  y: number;
  maxRadius: number;
  impactRadius: number;
  delay: number;
  duration: number;
}

export interface ThemeTransition {
  theme: ThemeMode;
  drops: ThemeDrop[];
}

export const THEME_DROP_COLUMNS = 4;
export const THEME_DROP_ROWS = 3;
export const THEME_DROP_COUNT = THEME_DROP_COLUMNS * THEME_DROP_ROWS;
export const THEME_TRANSITION_DURATION_MS = 1_100;

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
    Array.from({ length: THEME_DROP_COUNT }, (_, index) => ({
      column: index % THEME_DROP_COLUMNS,
      row: Math.floor(index / THEME_DROP_COLUMNS),
    })),
    random,
  );

  const drops = cells.map(({ column, row }, index) => {
    const cellLeft = column * cellWidth;
    const cellTop = row * cellHeight;
    const x = cellLeft + cellWidth * between(random, 0.36, 0.64);
    const y = cellTop + cellHeight * between(random, 0.36, 0.64);
    const farthestHorizontalEdge = Math.max(x - cellLeft, cellLeft + cellWidth - x);
    const farthestVerticalEdge = Math.max(y - cellTop, cellTop + cellHeight - y);
    const maxRadius = Math.ceil(
      Math.hypot(farthestHorizontalEdge, farthestVerticalEdge) * 1.04,
    );

    return {
      x: Math.round((x / width) * 1_000) / 10,
      y: Math.round((y / height) * 1_000) / 10,
      maxRadius,
      impactRadius: Math.max(5, Math.round(maxRadius * 0.1)),
      delay: Math.round(index * 28 + between(random, 0, 32)),
      duration: Math.round(between(random, 580, 700)),
    };
  });

  return { theme, drops };
}

export function applyThemeDropVariables(
  root: HTMLElement,
  drops: readonly ThemeDrop[],
): void {
  drops.forEach((drop, index) => {
    root.style.setProperty(`--theme-drop-x-${index}`, `${drop.x}%`);
    root.style.setProperty(`--theme-drop-y-${index}`, `${drop.y}%`);
    root.style.setProperty(`--theme-drop-max-radius-${index}`, `${drop.maxRadius}px`);
    root.style.setProperty(`--theme-drop-impact-radius-${index}`, `${drop.impactRadius}px`);
    root.style.setProperty(`--theme-drop-delay-${index}`, `${drop.delay}ms`);
    root.style.setProperty(`--theme-drop-duration-${index}`, `${drop.duration}ms`);
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
  }
}
