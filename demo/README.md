# G-FORCE Gaming Hub — Admin Panel Demo

A standalone, self-contained demo of a gaming cafe management panel (sessions,
bookings, memberships, cafe orders, reports) plus the public marketing site.

React 19 + Vite + Tailwind 4 + React Router.

## Running locally

```bash
cd demo
npm install
npm run dev
```

| Route            | What it is                                      |
| ---------------- | ----------------------------------------------- |
| `/`, `/admin`    | Admin panel (auth is bypassed in demo mode)     |
| `/admin/login`   | Login screen                                     |
| `/website`       | Public marketing site                            |

## No backend

`src/services/supabase.js` is a **localStorage-backed Supabase emulator**. It
makes zero network calls; the `.env` values are inert placeholders. Every
visitor gets their own private copy of the data in their own browser, and
clearing site data resets it.

`src/data/demoSeed.js` generates ~14 months of trading on first load: ~1,650
walk-in sessions, ~1,570 cafe orders, bookings, memberships, live sessions and
notifications. It is generated relative to *now*, so live session timers count
down correctly and report dates stay current whenever the demo is opened. A
seeded PRNG makes it identical on every load.

Reports and cafe daily archives are deliberately **not** seeded — the app
derives both by re-aggregating sessions and orders by business date, so storing
them would risk numbers that disagree with their own source rows.

Two constraints worth knowing before changing the seed:

- Chrome bills localStorage in **UTF-16**, so every JSON character costs two
  bytes against a ~5 MB quota, and `saveTable` swallows quota errors silently.
  An oversized seed appears to work and then vanishes on reload. The current
  seed is ~3.3 MB UTF-16, leaving ~34% headroom.
- Volume is on a growth curve (full density for the recent 60 days, decaying to
  10% at the start of the history). That is what makes 14 months fit.

**Reset All Data** in Reports clears transactional data and restores the seed.

## Deploying

The repo has config for both hosts. The app lives in `demo/`, not the repo root.

### Vercel

`vercel.json` at the **repo root** sets the install/build commands, the output
directory and the SPA rewrite, so importing the repo and deploying works with
no project settings to change.

> Leave **Root Directory** at the repository root. If you point it at `demo/`
> instead, Vercel stops reading the root `vercel.json` and deep links will 404.

The rewrite excludes `/assets/`:

```json
{ "source": "/((?!assets/).*)", "destination": "/index.html" }
```

Without that exclusion a missing hashed chunk after a redeploy would be served
`index.html` instead of a 404, producing a confusing `Unexpected token '<'`
error rather than a clean cache miss.

### Netlify

`netlify.toml` and `public/_redirects` already cover this. Set the base
directory to `demo`; publish directory `dist`, build `npm run build`.
