# 2-Minute Loom Script — VaultMail

**Total: 120 seconds. Aim for 110, leave 10s buffer.**

---

## [0:00 – 0:20] Problem (20s)

*[Camera on you, then screen]*

"AI email assistants like Superhuman or Gemini for Gmail are really useful — but they require sending your entire inbox to a third-party AI vendor. For lawyers, doctors, journalists, anyone who deals with privileged information, that's a deal-breaker. So they just don't get to use AI. I built VaultMail to fix that."

---

## [0:20 – 0:45] Solution (25s)

*[Show architecture diagram on screen]*

"VaultMail runs the entire AI pipeline on Cloudflare's edge. Your Gmail connects with read-only OAuth. A Cloudflare Worker fetches your emails, runs them through Workers AI — Llama 3.1 8B — for triage and summarization, encrypts the result, and stores it in R2. **The email body never leaves Cloudflare's network. No OpenAI, no Anthropic, no Google AI.**"

---

## [0:45 – 1:30] Demo (45s)

*[Switch to live app]*

"Here's the live dashboard. I just connected my actual Gmail. Let me hit sync — [click] — and you can see emails being triaged in real time. Each one gets a priority, category, summary, and suggested action. This urgent-flagged email is from my landlord about a deposit; this one is a newsletter, low priority."

*[Switch to AI Gateway dashboard]*

"Now here's the proof. This is Cloudflare's AI Gateway — every AI call is logged. You can see twenty emails were processed, average latency 380 milliseconds, 100% of requests went to `@cf/meta/llama-3.1-8b-instruct-fast`. **Zero requests to any external provider.** This isn't a privacy promise, it's a verifiable audit trail."

---

## [1:30 – 1:55] Impact (25s)

*[Show metrics page]*

"Per email: 380ms latency, 0.0003 cents in compute, zero bytes leaving Cloudflare. Compare that to a typical AI email setup with OpenAI plus Pinecone — roughly four cents per email and full inbox exposure to an external vendor. VaultMail is a hundred times cheaper and verifiably private."

---

## [1:55 – 2:00] Close (5s)

"Source is public, the privacy boundary is the whole Cloudflare edge, and there's a transparency endpoint anyone can audit. Thanks for watching."

---

## Recording tips

1. **Practice once before recording.** You'll be tempted to skip this. Don't.
2. **Hide everything irrelevant** — close Slack, Discord, browser tabs with personal info, notifications off.
3. **Have the demo pre-loaded** in 3 tabs: dashboard, AI Gateway, transparency endpoint. Don't navigate between them via search bar.
4. **Send 5-10 sample emails to your demo Gmail** beforehand — variety of urgency, vendors, newsletters. Real-feeling > realistic.
5. **The AI Gateway "0 external requests" moment is the climax.** Linger on it for 3 seconds. Don't rush past it.
6. **Loom's free tier caps at 5 min — you have plenty of margin.** First take usually overruns. Second take usually nails it.
