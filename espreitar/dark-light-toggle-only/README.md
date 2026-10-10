# Dark / Light Paint Toggle

A small, standalone Next.js demo of the **actual theme-toggle and paint-transition implementation** used in the portfolio. It contains only the toggle and a little sample interface for checking how the full foreground responds to the paint; it is not the full portfolio.

## Run it

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and use the Light / Dark control in the top-right. The choice persists in `localStorage` under `azam-portfolio-theme`. Reduced-motion preferences switch themes without playing the paint animation.

The reusable toggle logic is in `components/PaintThemeToggle.jsx`; its paint, contrast, and demo styles are in `app/globals.css`.
