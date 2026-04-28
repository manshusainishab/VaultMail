# VaultMail Frontend

React + Vite + Tailwind. Single-page app with hash routing.

## Setup

```bash
cd vaultmail-frontend   # or whatever you named the folder
npm install
npm run dev
```

Open http://localhost:5173

Vite proxies `/api` and `/auth` to your Worker on `localhost:8787`, so cookies work cross-port. Make sure `wrangler dev` is also running.

## Before running for the first time

Apply the three Worker patches in `PATCHES.md`. They're small but required.

## Routes

- `/` — landing page
- `#/inbox` — main inbox view
- `#/email/<id>` — email detail with AI summary + draft reply
- `#/transparency` — privacy proof page

## Build

```bash
npm run build       # outputs to dist/
npm run preview     # preview the production build
```

## Deploy to Cloudflare Pages

```bash
npm run deploy      # uses wrangler pages deploy dist
```

Then set environment variable in Pages dashboard:
- `VITE_API_BASE` = `https://vaultmail.YOURNAME.workers.dev`

And update the Worker's `wrangler.toml`:
- `FRONTEND_URL` = your Pages URL (e.g. `https://vaultmail.pages.dev`)

And update Google OAuth redirect URIs to include the production callback:
- `https://vaultmail.YOURNAME.workers.dev/auth/callback`
