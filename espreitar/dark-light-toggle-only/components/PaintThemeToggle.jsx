"use client";

import { useEffect, useRef, useState } from "react";

const paintBlobPaths = [
  "M151 17 C173 21 182 44 205 43 C232 40 246 57 252 79 C278 77 288 98 280 120 C302 143 287 168 270 181 C279 205 259 222 236 219 C227 245 206 257 186 244 C166 272 142 276 126 253 C102 267 80 252 80 230 C54 236 39 215 49 193 C24 180 17 155 39 139 C20 115 35 92 60 86 C57 61 81 44 105 54 C119 30 135 12 151 17 Z",
  "M149 13 C174 17 185 36 197 52 C227 35 249 54 246 81 C278 74 293 99 276 125 C305 149 281 172 264 185 C283 212 259 232 233 223 C222 255 197 255 179 240 C159 280 132 267 122 243 C91 267 68 248 79 220 C43 231 29 207 50 181 C14 161 24 133 53 125 C28 96 50 73 77 80 C69 48 101 36 123 55 C127 28 136 10 149 13 Z",
  "M154 20 C176 8 194 34 203 51 C231 36 255 49 250 77 C287 76 292 106 274 127 C297 153 281 177 258 188 C277 217 250 235 226 222 C210 255 187 258 168 237 C146 273 118 259 111 235 C78 254 58 228 75 202 C38 209 24 183 50 159 C18 137 35 111 61 101 C43 68 68 49 98 65 C103 31 128 23 145 50 C146 39 147 28 154 20 Z",
];

function ThemeIcon({ mode }) {
  return mode === "light" ? (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 1.8v2M10 16.2v2M18.2 10h-2M3.8 10h-2m14.01-5.81-1.42 1.42M5.61 14.39l-1.42 1.42m11.62 0-1.42-1.42M5.61 5.61 4.19 4.19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ) : (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.8 12.3A7.2 7.2 0 0 1 7.7 3.2a7.2 7.2 0 1 0 9.1 9.1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function PaintBlob({ className, style, variant = 0 }) {
  return (
    <svg className={className} style={style} viewBox="0 0 300 300" aria-hidden="true" focusable="false">
      <path d={paintBlobPaths[variant % paintBlobPaths.length]} />
      <path d="M76 87 C58 67 52 51 60 40 C74 50 76 67 89 78Z" />
      <path d="M207 54 C224 35 239 27 249 33 C243 48 225 53 215 66Z" />
      <path d="M109 234 C100 255 95 276 108 287 C122 293 128 271 131 246Z" />
      <path d="M218 210 C241 215 260 226 262 239 C246 242 234 228 213 226Z" />
      <circle cx="30" cy="133" r="10" />
      <circle cx="276" cy="89" r="8" />
      <circle cx="54" cy="256" r="7" />
      <ellipse cx="273" cy="250" rx="7" ry="15" transform="rotate(35 273 250)" />
      {variant % 2 === 0 ? <circle cx="178" cy="279" r="6" /> : <ellipse cx="33" cy="70" rx="6" ry="12" transform="rotate(-38 33 70)" />}
    </svg>
  );
}

export default function PaintThemeToggle({ children }) {
  const [theme, setTheme] = useState("light");
  const [paintTarget, setPaintTarget] = useState(null);
  const paintTimers = useRef([]);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("azam-portfolio-theme");
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    } catch {}
  }, []);

  useEffect(() => () => {
    paintTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const applyTheme = (nextTheme) => {
    setTheme(nextTheme);
    try { window.localStorage.setItem("azam-portfolio-theme", nextTheme); } catch {}
  };

  const changeTheme = (nextTheme) => {
    if (nextTheme === theme || paintTarget) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reduceMotion) {
      applyTheme(nextTheme);
      return;
    }

    const cells = Array.from({ length: 24 }, (_, index) => ({ column: index % 6, row: Math.floor(index / 6) }));
    for (let i = cells.length - 1; i > 0; i -= 1) {
      const swap = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[swap]] = [cells[swap], cells[i]];
    }
    const positions = cells.map(({ column, row }) => ({
      x: Math.round((column + 0.5 + (Math.random() - 0.5) * 0.92) * (100 / 6) * 10) / 10,
      y: Math.round((row + 0.5 + (Math.random() - 0.5) * 0.92) * 25 * 10) / 10,
    }));
    for (let i = 0; i < 8; i += 1) {
      positions.push({ x: -12 + Math.random() * 124, y: -14 + Math.random() * 128 });
    }
    const splashes = positions.map(({ x, y }) => ({
      x,
      y,
      size: Math.round(6 + Math.random() * 15),
      grow: Number((2.2 + Math.random() * 4.8).toFixed(2)),
      turn: Math.round(Math.random() * 360),
      delay: Math.round(Math.random() * 700),
      duration: Math.round(1200 + Math.random() * 550),
      variant: Math.floor(Math.random() * paintBlobPaths.length),
    }));
    const sheet = {
      x: Math.round(-8 + Math.random() * 116),
      y: Math.round(-8 + Math.random() * 116),
      size: Math.round(56 + Math.random() * 14),
      grow: Number((5 + Math.random() * 1.1).toFixed(2)),
      turn: Math.round(Math.random() * 360),
      delay: Math.round(80 + Math.random() * 300),
      variant: Math.floor(Math.random() * paintBlobPaths.length),
    };

    setPaintTarget({ theme: nextTheme, splashes, sheet });
    const switchTimer = window.setTimeout(() => applyTheme(nextTheme), 2300);
    const finishTimer = window.setTimeout(() => setPaintTarget(null), 2980);
    paintTimers.current = [switchTimer, finishTimer];
  };

  return (
    <div className={`demo-shell ${paintTarget ? "is-painting" : ""}`} data-theme={theme}>
      <div className="demo-interface">
        <header className="demo-header">
          <a className="demo-brand" href="#top" aria-label="Paint toggle demo home">
            <span className="brand-mark">AU<span>.</span></span>
            <span className="brand-caption">PAINT TOGGLE</span>
          </a>
          <div className="theme-switch" role="group" aria-label="Choose appearance">
            <button type="button" className={theme === "light" ? "active" : ""} aria-label="Switch to light theme" aria-pressed={theme === "light"} disabled={paintTarget !== null} onClick={() => changeTheme("light")}>
              <ThemeIcon mode="light" /><span>Light</span>
            </button>
            <button type="button" className={theme === "dark" ? "active" : ""} aria-label="Switch to dark theme" aria-pressed={theme === "dark"} disabled={paintTarget !== null} onClick={() => changeTheme("dark")}>
              <ThemeIcon mode="dark" /><span>Dark</span>
            </button>
          </div>
        </header>
        <div className="demo-page-content" id="top">{children}</div>
        <footer className="demo-shell-footer"><span>THEME TEST / 01</span><span>LIGHT ⇄ DARK</span></footer>
      </div>

      {paintTarget && (
        <div className={`theme-paint paint-to-${paintTarget.theme}`} aria-hidden="true">
          <PaintBlob className="paint-sheet" variant={paintTarget.sheet.variant} style={{ left: `${paintTarget.sheet.x}%`, top: `${paintTarget.sheet.y}%`, width: `${paintTarget.sheet.size}vmax`, height: `${paintTarget.sheet.size}vmax`, "--paint-turn": `${paintTarget.sheet.turn}deg`, "--sheet-delay": `${paintTarget.sheet.delay}ms`, "--sheet-grow": paintTarget.sheet.grow }} />
          {paintTarget.splashes.map((splash, index) => (
            <PaintBlob key={index} className="paint-splash" variant={splash.variant} style={{ left: `${splash.x}%`, top: `${splash.y}%`, width: `${splash.size}vmax`, height: `${splash.size}vmax`, "--paint-turn": `${splash.turn}deg`, "--paint-grow": splash.grow, "--paint-delay": `${splash.delay}ms`, "--paint-duration": `${splash.duration}ms` }} />
          ))}
        </div>
      )}
    </div>
  );
}
