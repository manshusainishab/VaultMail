# VaultMail

Privacy-first AI email triage. Your inbox never leaves Cloudflare's edge.

## What it is

VaultMail connects to your Gmail (read-only), pulls recent emails, and uses Workers AI (Llama 3.1 8B) to triage them — priority, category, summary, suggested action — entirely at the edge. The email body is processed inside a Cloudflare Worker, summarized, encrypted with AES-GCM, and stored in R2. **No external AI vendor (OpenAI, Anthropic, Google AI) is ever called.** AI Gateway provides a verifiable audit log proving this.

## Why Cloudflare

This product is impossible without Cloudflare's stack:

- **Workers AI** runs Llama 3.1 8B at the edge — no GPU bills, no vendor lock-in, no data leaving the network. The "smarter, runs everywhere, no vendor in the loop" pitch only exists because Workers AI does.
- **AI Gateway** gives users a real-time audit dashboard. Every AI call is logged with provider, latency, and cost. The transparency claim is verifiable, not marketing.
- **R2 zero-egress** means encrypted summaries are stored cheaply and read instantly without per-GB costs.
- **KV** holds OAuth tokens and email metadata with sub-10ms reads from any POP.
- **Durable Objects** prevent concurrent sync races per user.
- **Pages** hosts the UI on the same edge network — no CORS theater.

A reviewer cannot replace Cloudflare with AWS+OpenAI here without breaking the privacy guarantee.

## Architecture

User → Gmail OAuth → Worker (orchestrator) → Workers AI (triage) → R2 (encrypted summary) + KV (metadata).
AI Gateway sits between Worker and Workers AI for audit + caching.

## 24-hour setup

```bash
# 1. Install
npm install
npm install -g wrangler

# 2. Auth Cloudflare
wrangler login

# 3. Create infrastructure
wrangler kv:namespace create META          # paste id into wrangler.toml
wrangler r2 bucket create vaultmail-summaries

# 4. Create AI Gateway (one-time, in dashboard)
# Dashboard → AI → AI Gateway → Create → name: vaultmail-gateway

# 5. Set secrets
wrangler secret put GOOGLE_CLIENT_SECRET   # from Google Cloud console
wrangler secret put ENCRYPTION_KEY         # paste a base64 32-byte key

# 6. Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 7. Set Google OAuth
# console.cloud.google.com → APIs & Services → OAuth consent (External, Test mode)
# → add yourself as test user → Credentials → Create OAuth client (Web app)
# → Authorized redirect URI: https://vaultmail.YOURNAME.workers.dev/auth/callback
# Paste client ID into wrangler.toml GOOGLE_CLIENT_ID var

# 8. Run locally
wrangler dev

# 9. Deploy
wrangler deploy
```

## Endpoints

- `GET /api/health` — sanity check, returns edge POP
- `GET /auth/start` — kick off Gmail OAuth
- `GET /auth/callback` — OAuth callback
- `GET /api/sync` — pull last 20 emails, triage, store
- `GET /api/inbox` — list triaged emails
- `GET /api/email/:id` — full detail incl. decrypted summary
- `GET /api/transparency` — privacy guarantees + AI Gateway link

## Privacy guarantees

1. Email body never leaves Cloudflare's network
2. No third-party AI vendor is called (verify in AI Gateway logs)
3. Summaries encrypted at rest in R2 (AES-GCM-256)
4. OAuth scope is `gmail.readonly` only — VaultMail cannot send, modify, or delete email
5. Source code public — verify the boundary yourself
