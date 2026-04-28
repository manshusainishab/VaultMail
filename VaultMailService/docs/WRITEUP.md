# VaultMail — Submission Writeup

**Problem.** Email AI assistants (Superhuman AI, Shortwave, Gemini in Gmail) require giving a third-party AI vendor full inbox access. For lawyers, doctors, founders, and journalists, that is a non-starter — privileged conversations, patient data, and source identities cannot legally or ethically be shipped to OpenAI for "summarization." The market response so far has been to either skip AI entirely or accept the privacy tax. There is no third option.

**Solution.** VaultMail is an AI email triage product where the inference runs entirely on Cloudflare's edge. A user connects Gmail with read-only OAuth. A Worker fetches new messages, runs each through Workers AI (Llama 3.1 8B Instruct) for priority, category, summary, and suggested action, encrypts the result with AES-GCM-256, and stores it in R2. The raw email body is processed in-memory inside the Worker and discarded. No external AI vendor is ever called.

**Cloudflare as core, not bolt-on.** AI Gateway sits between the Worker and Workers AI, producing a real-time audit log every user can inspect — turning the privacy claim from marketing into proof. KV holds encrypted OAuth tokens and email metadata with sub-10ms reads at every POP. Durable Objects serialize per-user syncs to prevent races. R2 zero-egress makes encrypted-blob storage economical. Pages hosts the dashboard on the same network. Replacing any one of these with AWS+OpenAI breaks the guarantee — the architecture is Cloudflare-native by necessity.

**Impact.** Triage runs at the edge POP closest to the user — average ~XXXms end-to-end (measured via AI Gateway). Per-email cost: $XXXX on Workers AI, vs $XXXX for an equivalent OpenAI+Pinecone setup. Bytes sent to external AI providers per inbox processed: zero. The audit endpoint `/api/transparency` exposes this verifiably.

[Live: vaultmail.YOURNAME.workers.dev | GitHub: github.com/YOURNAME/vaultmail | Loom: loom.com/share/XXX]

---
Word count: ~290. Fill in the XXX numbers from your AI Gateway dashboard after running 20+ emails through it.
