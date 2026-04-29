import { useState } from 'react';
import { Lock, Zap, Eye } from 'lucide-react';
import { api } from '../lib/api';
import RequestAccessModal from './RequestAccessModal.jsx';

export default function Landing() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero onRequestAccess={() => setModalOpen(true)} />
        <ProofStrip />
        <Features />
        <Footer />
      </main>
      <RequestAccessModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function Header() {
  return (
    <header className="px-6 lg:px-12 py-5 flex items-center justify-between border-b border-ink-100">
      <Logo />
      <a
        href="https://github.com/manshusainishab/VaultMail"
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs text-ink-500 hover:text-ink-900 transition-colors"
      >
        github →
      </a>
    </header>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-ink-900 grid place-items-center">
        <Lock size={14} className="text-flame" strokeWidth={2.5} />
      </div>
      <span className="font-display text-lg font-medium tracking-tight">VaultMail</span>
    </div>
  );
}

function Hero({ onRequestAccess }) {
  return (
    <section className="px-6 lg:px-12 pt-20 lg:pt-28 pb-16 max-w-6xl mx-auto">
      <p className="font-mono text-xs text-flame uppercase tracking-widest mb-6">
        AI email triage · zero exfiltration
      </p>
      <h1 className="font-display text-5xl lg:text-7xl font-medium tracking-tightest leading-[0.95] max-w-3xl">
        Your inbox should never be sent to a stranger.
      </h1>
      <p className="mt-8 text-lg lg:text-xl text-ink-500 max-w-2xl leading-relaxed">
        VaultMail uses AI to triage your email — priority, summary, suggested replies — without ever sending a single byte to OpenAI, Anthropic, or Google AI. Inference runs on Cloudflare's edge, audited in real time, encrypted at rest.
      </p>
      <div className="mt-10 flex items-center gap-5">
        <a href={api.authStartUrl()} className="btn-primary text-base px-5 py-3">
          Connect Gmail
          <span className="font-mono text-xs opacity-60">read-only</span>
        </a>
        <button
          onClick={onRequestAccess}
          className="font-mono text-xs text-ink-500 hover:text-flame transition-colors underline underline-offset-4 decoration-ink-300"
        >
          request test user access
        </button>
        <a
          href="#how"
          className="font-mono text-xs text-ink-500 hover:text-ink-900 underline underline-offset-4 decoration-ink-300"
        >
          how it works
        </a>
      </div>
    </section>
  );
}

function ProofStrip() {
  return (
    <section className="border-y border-ink-100 bg-white">
      <div className="px-6 lg:px-12 py-6 max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
        <Stat label="bytes to external AI" value="0" />
        <Stat label="inference latency" value="~600ms" />
        <Stat label="edge POPs" value="330+" />
        <Stat label="OAuth scope" value="readonly" />
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-ink-300 uppercase tracking-widest text-[10px]">{label}</div>
      <div className="text-ink-900 text-2xl font-display tracking-tight mt-1">{value}</div>
    </div>
  );
}

function Features() {
  return (
    <section id="how" className="px-6 lg:px-12 py-20 max-w-6xl mx-auto">
      <p className="font-mono text-xs text-ink-500 uppercase tracking-widest mb-3">
        the architecture
      </p>
      <h2 className="font-display text-3xl lg:text-4xl tracking-tight max-w-2xl">
        Cloudflare is not a CDN here. It's the entire trust boundary.
      </h2>

      <div className="mt-12 grid lg:grid-cols-3 gap-6">
        <Feature
          icon={<Lock size={18} />}
          title="Inference at the edge"
          body="Llama 3.1 8B runs on Cloudflare Workers AI. Email body is processed in-memory in a Worker, summary goes out, body is discarded. No external AI vendor sees your inbox — ever."
          tag="workers ai"
        />
        <Feature
          icon={<Eye size={18} />}
          title="Auditable in real time"
          body="Every AI call is logged in Cloudflare AI Gateway. Provider, latency, cost, prompt, response — all visible to you. The privacy claim is verifiable, not marketing copy."
          tag="ai gateway"
        />
        <Feature
          icon={<Zap size={18} />}
          title="Encrypted at rest"
          body="Summaries are encrypted with AES-GCM-256 before R2 write. OAuth tokens encrypted in KV. Even Cloudflare ops can't read your data."
          tag="r2 + kv"
        />
      </div>
    </section>
  );
}

function Feature({ icon, title, body, tag }) {
  return (
    <div className="card p-6 lg:p-7">
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-md bg-ink-900 text-flame grid place-items-center">
          {icon}
        </div>
        <span className="font-mono text-[10px] text-ink-300 uppercase tracking-widest">
          {tag}
        </span>
      </div>
      <h3 className="font-display text-xl tracking-tight">{title}</h3>
      <p className="mt-2 text-ink-500 text-[15px] leading-relaxed">{body}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="px-6 lg:px-12 py-10 border-t border-ink-100 max-w-6xl mx-auto w-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 font-mono text-xs text-ink-500">
        <p>built on cloudflare workers · workers ai · r2 · kv · ai gateway</p>
        <p className="text-ink-300">read-only · open source · self-hostable</p>
      </div>
    </footer>
  );
}
