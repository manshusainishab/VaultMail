import { useEffect, useState } from 'react';
import { ShieldCheck, ArrowLeft, Lock, Eye, Server, FileCode } from 'lucide-react';
import { api } from '../lib/api';

export default function Transparency({ onBack }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.transparency().then(setData).catch(() => {}); }, []);

  return (
    <div className="min-h-screen px-6 lg:px-12 py-8 max-w-3xl mx-auto">
      <button onClick={onBack} className="btn-ghost mb-6">
        <ArrowLeft size={14} /> back
      </button>

      <p className="font-mono text-xs text-flame uppercase tracking-widest">transparency report</p>
      <h1 className="font-display text-4xl lg:text-5xl tracking-tightest mt-3">
        Don't trust us. Verify.
      </h1>
      <p className="mt-5 text-lg text-ink-500 leading-relaxed">
        VaultMail makes a strong claim — your inbox never leaves Cloudflare. Here's exactly what that means, and how to confirm it independently.
      </p>

      <ol className="mt-12 space-y-6">
        {(data?.guarantees ?? []).map((g, i) => (
          <li key={i} className="card p-6 flex items-start gap-4">
            <div className="w-9 h-9 rounded-md bg-ink-900 text-flame grid place-items-center shrink-0">
              <span className="font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <p className="text-ink-900 leading-relaxed pt-1">{g}</p>
          </li>
        ))}
      </ol>

      <div className="mt-12 grid sm:grid-cols-2 gap-4">
        <a
          href="https://dash.cloudflare.com/?to=/:account/ai/ai-gateway"
          target="_blank"
          rel="noreferrer"
          className="card p-6 hover:ring-flame/40 transition-all"
        >
          <Eye size={18} className="text-flame" />
          <p className="mt-3 font-display text-lg tracking-tight">AI Gateway logs</p>
          <p className="mt-1 text-ink-500 text-sm">See every AI call we made. Provider column proves "workers-ai" only.</p>
        </a>
        <a
          href="https://github.com/YOURNAME/vaultmail"
          target="_blank"
          rel="noreferrer"
          className="card p-6 hover:ring-flame/40 transition-all"
        >
          <FileCode size={18} className="text-flame" />
          <p className="mt-3 font-display text-lg tracking-tight">Source code</p>
          <p className="mt-1 text-ink-500 text-sm">All Worker code, open. Grep for "openai" — there are zero hits.</p>
        </a>
      </div>

      {data?.edge_pop && (
        <p className="mt-12 font-mono text-xs text-ink-300 text-center">
          this page served from cloudflare POP <span className="text-ink-500">{data.edge_pop}</span>
        </p>
      )}
    </div>
  );
}
