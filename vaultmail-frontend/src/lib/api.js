// API base — empty string in dev (Vite proxies /api and /auth to localhost:8787),
// set via VITE_API_BASE in production (e.g. https://vaultmail.YOURNAME.workers.dev)
const BASE = import.meta.env.VITE_API_BASE ?? '';

async function jsonFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const api = {
  health: () => jsonFetch('/api/health'),
  inbox: () => jsonFetch('/api/inbox'),
  email: (id) => jsonFetch(`/api/email/${id}`),
  sync: (max = 20) => jsonFetch(`/api/sync?max=${max}`),
  transparency: () => jsonFetch('/api/transparency'),
  authStartUrl: () => `${BASE}/auth/start`,
};

export function isAuthenticated() {
  // The vm_user cookie is HttpOnly so we can't read it directly.
  // We use the inbox endpoint as a probe.
  return api.inbox().then(() => true).catch(() => false);
}
