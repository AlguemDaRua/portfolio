# Azam Usman portfolio

A clean, responsive Next.js portfolio with a numbered side index, scroll progress, a floating back-to-top control, a persistent light/dark theme switch with randomized paint splashes, and an English / Portuguese toggle. During the transition, paint spreads behind the interface and the full foreground—including text, icons, borders, and controls—automatically switches to a contrasting color. The effect respects reduced-motion settings. Work details are based on the newest attached CV; personal details such as age, home address, phone numbers, and family information are intentionally omitted.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Add the CV later

The page has a small CV placeholder. When you are ready, add your PDF as `public/cv-azam-usman.pdf` and replace the placeholder in `app/page.jsx` with a link to `/cv-azam-usman.pdf`. This frontend does not upload files to a server.

## Edit content

Update bilingual text and the short project list in `app/page.jsx`. Styles are in `app/globals.css`; page title and description are in `app/layout.jsx`.
