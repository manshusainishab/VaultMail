// AI triage — Workers AI inference at the edge.
// This is the privacy boundary: the email body enters here, the structured
// output leaves here, and nothing else exits the edge.

import type { Env } from './index';

// Both models scaffolded — pick one in production. Llama 3.1 8B is faster
// and cheaper, plenty smart for triage. Llama 3.3 70B for harder reasoning.
const MODEL_FAST = '@cf/meta/llama-3.1-8b-instruct-fast';
const MODEL_SMART = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export interface TriageResult {
  priority: 'urgent' | 'important' | 'normal' | 'low';
  category: 'work' | 'personal' | 'finance' | 'newsletter' | 'spam' | 'other';
  summary: string;        // 1-2 sentences
  action_required: boolean;
  suggested_action: string | null;  // e.g. "reply with availability"
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  latency_ms: number;
}

const SYSTEM_PROMPT = `You are a privacy-respecting email triage assistant.
Analyze the email and return ONLY a JSON object with this exact schema:
{
  "priority": "urgent" | "important" | "normal" | "low",
  "category": "work" | "personal" | "finance" | "newsletter" | "spam" | "other",
  "summary": "one to two sentence neutral summary",
  "action_required": boolean,
  "suggested_action": "short phrase or null",
  "sentiment": "positive" | "neutral" | "negative" | "urgent"
}
Be concise. Do not include explanations outside the JSON.`;

export async function triageEmail(
  env: Env,
  email: { subject: string; from: string; body: string },
  options: { useSmartModel?: boolean } = {}
): Promise<TriageResult> {
  const start = Date.now();
  const model = options.useSmartModel ? MODEL_SMART : MODEL_FAST;

  // Truncate body to keep prompts cheap and fast
  const body = email.body.slice(0, 4000);

  const userPrompt = `From: ${email.from}
Subject: ${email.subject}

${body}`;

  // Route through AI Gateway for auditability + caching.
  // The gateway URL gives us logs that prove no external AI was called.
  const response = await env.AI.run(
    model,
    {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    },
    {
      gateway: {
        id: env.AI_GATEWAY_ID,
        skipCache: false,
        cacheTtl: 3600,
      },
    }
  );

  const raw = (response as any).response ?? '';
  const parsed = safeParseJson(raw);

  return {
    priority: parsed.priority ?? 'normal',
    category: parsed.category ?? 'other',
    summary: parsed.summary ?? 'Could not summarize.',
    action_required: !!parsed.action_required,
    suggested_action: parsed.suggested_action ?? null,
    sentiment: parsed.sentiment ?? 'neutral',
    latency_ms: Date.now() - start,
  };
}

function safeParseJson(s: string): any {
  try {
    // Models sometimes wrap JSON in markdown fences
    const cleaned = s.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

// Encrypt summary before storing in R2. Even Cloudflare ops can't read it.
export async function encryptForR2(plaintext: string, keyB64: string): Promise<ArrayBuffer> {
  const keyBytes = base64ToBytes(keyB64);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  // Pack IV + ciphertext together
  const out = new Uint8Array(iv.length + ct.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ct), iv.length);
  return out.buffer;
}

export async function decryptFromR2(blob: ArrayBuffer, keyB64: string): Promise<string> {
  const keyBytes = base64ToBytes(keyB64);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const data = new Uint8Array(blob);
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
