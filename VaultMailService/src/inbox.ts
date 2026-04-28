// Inbox endpoints — list and detail views

import type { Env } from './index';
import { getUserIdFromCookie } from './auth';
import { decryptFromR2 } from './ai';

export async function handleInbox(req: Request, env: Env): Promise<Response> {
  const userId = getUserIdFromCookie(req);
  if (!userId) return new Response('Not authenticated', { status: 401 });

  // List all email metadata for this user
  const listed = await env.META.list({ prefix: `email:${userId}:` });
  const emails = await Promise.all(
    listed.keys.map(async (k) => {
      const raw = await env.META.get(k.name);
      return raw ? JSON.parse(raw) : null;
    })
  );

  const filtered = emails
    .filter(e => e)
    .sort((a, b) => (b.processed_at ?? 0) - (a.processed_at ?? 0));

  const metricsRaw = await env.META.get(`metrics:${userId}`);
  const metrics = metricsRaw ? JSON.parse(metricsRaw) : null;

  return Response.json({ emails: filtered, metrics });
}

export async function handleEmailDetail(req: Request, env: Env): Promise<Response> {
  const userId = getUserIdFromCookie(req);
  if (!userId) return new Response('Not authenticated', { status: 401 });

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  if (!id) return new Response('Bad request', { status: 400 });

  const metaRaw = await env.META.get(`email:${userId}:${id}`);
  if (!metaRaw) return new Response('Not found', { status: 404 });

  // Decrypt summary from R2
  const obj = await env.VAULT.get(`${userId}/${id}.bin`);
  if (!obj) return Response.json(JSON.parse(metaRaw));

  const buf = await obj.arrayBuffer();
  const summaryJson = await decryptFromR2(buf, env.ENCRYPTION_KEY);

  return Response.json({
    ...JSON.parse(metaRaw),
    ...JSON.parse(summaryJson),
  });
}
