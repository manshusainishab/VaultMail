# VaultMail — Cloudflare Internship Submission

## Project + Problem Statement

**VaultMail** is a privacy-first AI email triage product. The problem: every existing AI email assistant (Superhuman AI, Shortwave, Gemini in Gmail) requires sending your inbox to a third-party AI vendor. For lawyers, doctors, journalists, founders — anyone with privileged information — that's a non-starter. The market response so far has been to skip AI entirely or accept the privacy tax. There's no third option, until now.

## Cloudflare Usage

VaultMail runs the entire pipeline on Cloudflare's edge. A user connects Gmail with read-only OAuth. A Worker fetches new messages, runs each through **Workers AI (Llama 3.1 8B Instruct)** for triage — priority, category, summary, suggested action. Summaries are encrypted with AES-GCM-256 and stored in **R2**. Email metadata lives in **KV** for sub-10ms reads. **Durable Objects** serialize per-user syncs. **AI Gateway** sits between the Worker and Workers AI — every AI call is logged, providing a verifiable third-party audit trail proving no external AI vendor (OpenAI, Anthropic, Google AI) was ever called. The frontend (React/Vite/Tailwind) is served as static assets directly from the same Worker, eliminating cross-domain cookie issues. Replacing any of these components with AWS+OpenAI breaks the privacy guarantee — the architecture is Cloudflare-native by necessity, not convenience.

## Impact / Metrics

- **41 AI calls processed end-to-end with zero bytes leaving Cloudflare** (verified in AI Gateway logs)
- **Worker CPU time (p90): 1.7ms** — efficient enough for free-tier sustainability
- **20 emails triaged in 48.8 seconds** end-to-end (Gmail fetch + AI inference + AES encrypt + R2 write)
- **Cost: $0.00** for 20.18k tokens (Workers AI free tier vs ~$0.40 on OpenAI gpt-4o)
- **0 errors** across 126 Worker invocations
- **OAuth scope: gmail.readonly** — VaultMail cannot send, modify, or delete email

## Links

- **Live:** https://vaultmail.manshupallav.workers.dev
- **GitHub:** https://github.com/manshusainishab/VaultMail _(update if different)_
- **2-min Loom:** https://drive.google.com/file/d/19uH9ANvl0Wz7VaTZRF6lMIDBZlSYmi7j/view?usp=sharing

---

