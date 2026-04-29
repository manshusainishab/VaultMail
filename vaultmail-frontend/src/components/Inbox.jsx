import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Search, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { Logo } from './Landing';

const PAGE_SIZE = 10;

const PRIORITY_ORDER = { urgent: 0, important: 1, normal: 2, low: 3 };
const CATEGORIES = ['work', 'personal', 'finance', 'newsletter', 'spam', 'other'];
const PRIORITIES = ['urgent', 'important', 'normal', 'low'];

export default function Inbox({ onOpen, onLogout }) {
  const [emails, setEmails] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(20);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [error, setError] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.inbox();
      setEmails(data.emails ?? []);
      setMetrics(data.metrics);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function sync() {
    setSyncing(true);
    setError(null);
    // Show a heads-up toast for the first sync — cold edge + sequential AI calls
    // means it can take 30-60 seconds. Subsequent syncs are fast.
    const isFirstSync = (metrics?.total_synced ?? 0) === 0;
    if (isFirstSync) {
      setSyncMessage(`First sync warms up the edge and runs ${syncCount} AI calls — this can take ${Math.ceil(syncCount * 2.5)}s. After this, syncs are fast.`);
    } else {
      setSyncMessage(null);
    }
    try {
      await api.sync(syncCount);
      await load();
      setSyncMessage(null);
    } catch (e) {
      setError(e.message);
      setSyncMessage(null);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let out = emails;
    if (filterPriority !== 'all') out = out.filter(e => e.priority === filterPriority);
    if (filterCategory !== 'all') out = out.filter(e => e.category === filterCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(e =>
        (e.subject ?? '').toLowerCase().includes(q) ||
        (e.from ?? '').toLowerCase().includes(q) ||
        (e.snippet ?? '').toLowerCase().includes(q)
      );
    }
    out = [...out].sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 9;
      const pb = PRIORITY_ORDER[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      return (b.processed_at ?? 0) - (a.processed_at ?? 0);
    });
    return out;
  }, [emails, filterPriority, filterCategory, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEmails = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => { setPage(0); }, [filterPriority, filterCategory, search]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="px-6 lg:px-12 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <Logo />
          <div className="flex items-center gap-3">
            <select
              value={syncCount}
              onChange={e => setSyncCount(Number(e.target.value))}
              className="font-mono text-xs bg-ink-50 ring-1 ring-ink-100 rounded-md px-2 py-1.5 text-ink-700"
              disabled={syncing}
            >
              <option value={5}>5 emails</option>
              <option value={10}>10 emails</option>
              <option value={20}>20 emails</option>
              <option value={50}>50 emails</option>
            </select>
            <button onClick={sync} disabled={syncing} className="btn-primary disabled:opacity-50 disabled:cursor-wait">
              {syncing
                ? <><Loader2 size={14} className="animate-spin" /> syncing…</>
                : <><RefreshCw size={14} /> sync</>}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 lg:px-12 py-8 max-w-7xl mx-auto w-full grid lg:grid-cols-[minmax(0,1fr)_280px] gap-10">
        <main>
          <div className="flex items-baseline justify-between mb-6">
            <h1 className="font-display text-3xl tracking-tight">Inbox</h1>
            <p className="font-mono text-xs text-ink-500">
              {filtered.length} of {emails.length} emails
            </p>
          </div>

          <Filters
            filterPriority={filterPriority} setFilterPriority={setFilterPriority}
            filterCategory={filterCategory} setFilterCategory={setFilterCategory}
            search={search} setSearch={setSearch}
          />

          {error && (
            <div className="mt-6 p-4 rounded-md bg-red-50 ring-1 ring-red-200 text-sm text-red-900">
              {error.includes('401') ? 'Not authenticated. ' : ''}
              {error}
              {error.includes('401') && (
                <a href={api.authStartUrl()} className="ml-2 underline">Connect Gmail</a>
              )}
            </div>
          )}

          {syncMessage && (
            <div className="mt-6 p-4 rounded-md bg-flame-bg ring-1 ring-flame/30 text-sm text-flame-dim flex items-start gap-3">
              <Loader2 size={16} className="animate-spin mt-0.5 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          {loading ? (
            <SkeletonList />
          ) : pageEmails.length === 0 ? (
            <EmptyState onSync={sync} hasFilters={filterPriority !== 'all' || filterCategory !== 'all' || search.trim() !== ''} />
          ) : (
            <ul className="mt-6 divide-y divide-ink-100 ring-1 ring-ink-100 rounded-lg bg-white">
              {pageEmails.map(e => <EmailRow key={e.id} email={e} onOpen={() => onOpen(e.id)} />)}
            </ul>
          )}

          {pageCount > 1 && (
            <Pager page={page} pageCount={pageCount} setPage={setPage} />
          )}
        </main>

        <Sidebar metrics={metrics} />
      </div>
    </div>
  );
}

function Filters({ filterPriority, setFilterPriority, filterCategory, setFilterCategory, search, setSearch }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          type="text"
          placeholder="search subject, sender, snippet…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white ring-1 ring-ink-100 rounded-md focus:ring-flame focus:outline-none"
        />
      </div>
      <SelectChip label="priority" value={filterPriority} onChange={setFilterPriority} options={['all', ...PRIORITIES]} />
      <SelectChip label="category" value={filterCategory} onChange={setFilterCategory} options={['all', ...CATEGORIES]} />
    </div>
  );
}

function SelectChip({ label, value, onChange, options }) {
  return (
    <label className="font-mono text-xs flex items-center gap-1.5 bg-white ring-1 ring-ink-100 rounded-md px-2.5 py-1.5">
      <span className="text-ink-300 uppercase tracking-widest text-[10px]">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="bg-transparent text-ink-900 outline-none cursor-pointer">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function EmailRow({ email, onOpen }) {
  return (
    <li
      onClick={onOpen}
      className="px-5 py-4 cursor-pointer hover:bg-ink-50/60 transition-colors flex items-start gap-4 group"
    >
      <div className="flex flex-col items-center gap-1.5 pt-1 min-w-[80px]">
        <span className={`pill pill-${email.priority}`}>{email.priority}</span>
        {email.action_required && <span className="pill pill-action">action</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-ink-500 truncate">{cleanFrom(email.from)}</p>
          <p className="font-mono text-[11px] text-ink-300 shrink-0">{formatDate(email.date)}</p>
        </div>
        <p className="font-medium text-ink-900 truncate mt-0.5 group-hover:text-flame-dim transition-colors">
          {email.subject || '(no subject)'}
        </p>
        <p className="text-sm text-ink-500 truncate mt-0.5">{stripHtml(email.snippet)}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className={`pill pill-cat-${email.category}`}>{email.category}</span>
          {email.latency_ms > 0 && (
            <span className="font-mono text-[10px] text-ink-300">{email.latency_ms}ms · workers ai</span>
          )}
        </div>
      </div>
    </li>
  );
}

function SkeletonList() {
  return (
    <div className="mt-6 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-[88px] rounded-lg bg-white ring-1 ring-ink-100 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ onSync, hasFilters }) {
  return (
    <div className="mt-6 card p-12 text-center">
      <p className="font-display text-xl tracking-tight">
        {hasFilters ? 'No matches.' : 'No emails yet.'}
      </p>
      <p className="text-ink-500 mt-2 text-sm">
        {hasFilters ? 'Try clearing filters.' : 'Sync your inbox to get started.'}
      </p>
      {!hasFilters && (
        <button onClick={onSync} className="btn-primary mt-6">
          <RefreshCw size={14} /> sync now
        </button>
      )}
    </div>
  );
}

function Pager({ page, pageCount, setPage }) {
  return (
    <div className="mt-6 flex items-center justify-between font-mono text-xs">
      <button
        onClick={() => setPage(p => Math.max(0, p - 1))}
        disabled={page === 0}
        className="btn-ghost disabled:opacity-30"
      >
        <ChevronLeft size={14} /> prev
      </button>
      <span className="text-ink-500">page {page + 1} of {pageCount}</span>
      <button
        onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
        disabled={page === pageCount - 1}
        className="btn-ghost disabled:opacity-30"
      >
        next <ChevronRight size={14} />
      </button>
    </div>
  );
}

function Sidebar({ metrics }) {
  return (
    <aside className="space-y-5">
      <div className="card p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-sage" />
          <h3 className="font-display text-lg tracking-tight">Privacy proof</h3>
        </div>
        <dl className="mt-4 space-y-3 font-mono text-xs">
          <Row label="bytes to external AI" value={metrics?.bytes_to_external_ai ?? 0} highlight />
          <Row label="emails processed" value={metrics?.total_processed ?? 0} />
          <Row label="syncs" value={metrics?.total_synced ?? 0} />
          <Row label="last sync (ms)" value={metrics?.last_sync_duration_ms ?? '—'} />
        </dl>
        <a
          href="https://dash.cloudflare.com/?to=/:account/ai/ai-gateway"
          target="_blank"
          rel="noreferrer"
          className="mt-4 block font-mono text-xs text-flame underline underline-offset-4 decoration-flame/40"
        >
          view ai gateway logs →
        </a>
      </div>
      <a href="/transparency" className="block card p-5 hover:ring-flame/40 transition-all">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-300">about</p>
        <p className="font-display text-lg tracking-tight mt-1">Transparency report</p>
        <p className="text-ink-500 text-sm mt-1">Read the privacy guarantees and verify them yourself.</p>
      </a>
    </aside>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-300 uppercase tracking-widest text-[10px]">{label}</dt>
      <dd className={highlight ? 'text-sage font-medium tabular-nums' : 'text-ink-900 tabular-nums'}>{value}</dd>
    </div>
  );
}

function cleanFrom(from) {
  if (!from) return '';
  const m = from.match(/^"?([^"<]+?)"?\s*<.+>$/);
  return m ? m[1].trim() : from;
}

function formatDate(d) {
  if (!d) return '';
  try {
    const date = new Date(d);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    if (sameDay) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

function stripHtml(s) {
  if (!s) return '';
  return s.replace(/&[a-z]+;/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
