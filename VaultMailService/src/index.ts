import { UserState } from './durable-object';
import { handleAuthStart, handleAuthCallback } from './auth';
import { handleSync } from './sync';
import { handleInbox, handleEmailDetail } from './inbox';

export { UserState };

export interface Env {
  AI: any;
  VAULT: R2Bucket;
  META: KVNamespace;
  USER_STATE: DurableObjectNamespace;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ENCRYPTION_KEY: string;
  AI_GATEWAY_ID: string;
  APP_URL: string;
  FRONTEND_URL?: string;
}

function corsFor(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = new Set([
    'http://localhost:5173',
    'http://localhost:8787',
    env.APP_URL,
    env.FRONTEND_URL,
  ].filter(Boolean) as string[]);
  const allow = allowed.has(origin) ? origin : 'http://localhost:5173';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const cors = corsFor(req, env);
    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data, null, 2), {
        status,
        headers: { 'Content-Type': 'application/json', ...cors },
      });

    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      if (url.pathname === '/api/health') {
        return json({
          ok: true,
          ts: Date.now(),
          colo: req.cf?.colo,
          message: 'Running entirely on Cloudflare edge',
        });
      }

      if (url.pathname === '/auth/start') return handleAuthStart(req, env);
      if (url.pathname === '/auth/callback') return handleAuthCallback(req, env);

      if (url.pathname === '/api/sync') {
        const res = await handleSync(req, env, ctx);
        // re-add CORS to the response (handleSync uses Response.json)
        const headers = new Headers(res.headers);
        for (const [k, v] of Object.entries(cors)) headers.set(k, v);
        return new Response(res.body, { status: res.status, headers });
      }
      if (url.pathname === '/api/inbox') {
        const res = await handleInbox(req, env);
        const headers = new Headers(res.headers);
        for (const [k, v] of Object.entries(cors)) headers.set(k, v);
        return new Response(res.body, { status: res.status, headers });
      }
      if (url.pathname.startsWith('/api/email/')) {
        const res = await handleEmailDetail(req, env);
        const headers = new Headers(res.headers);
        for (const [k, v] of Object.entries(cors)) headers.set(k, v);
        return new Response(res.body, { status: res.status, headers });
      }

      if (url.pathname === '/api/transparency') {
        return json({
          guarantees: [
            'No email body is ever sent to any third-party AI provider',
            'All inference runs on Cloudflare Workers AI (Llama 3.1 8B) at the edge',
            'AI Gateway logs every AI call — verifiable audit trail',
            'Email summaries encrypted with AES-GCM before R2 write',
            'Gmail OAuth tokens encrypted at rest in KV',
            'Worker source is open — verify yourself',
          ],
          ai_gateway_dashboard: `https://dash.cloudflare.com/?to=/:account/ai/ai-gateway/${env.AI_GATEWAY_ID}`,
          edge_pop: req.cf?.colo,
          source: 'https://github.com/YOURNAME/vaultmail',
        });
      }

      return new Response('Not found', { status: 404, headers: cors });
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  },
};