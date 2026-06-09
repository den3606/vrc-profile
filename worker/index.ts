import { normalizeMessage, normalizeName } from "./validate";

const RATE_LIMIT_TTL_SECONDS = 60 * 60 * 24 * 30;
const MAX_SENDS_PER_IP = 5;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function rateLimitKey(ip: string): string {
  return `signal:${ip}`;
}

async function getSendCount(env: Env, ip: string): Promise<number> {
  const raw = await env.RATE_LIMIT.get(rateLimitKey(ip));
  if (!raw) return 0;

  const count = Number.parseInt(raw, 10);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

async function isRateLimited(env: Env, ip: string): Promise<boolean> {
  return (await getSendCount(env, ip)) >= MAX_SENDS_PER_IP;
}

async function recordSend(env: Env, ip: string): Promise<void> {
  const count = await getSendCount(env, ip);
  await env.RATE_LIMIT.put(rateLimitKey(ip), String(count + 1), {
    expirationTtl: RATE_LIMIT_TTL_SECONDS,
  });
}

async function sendDiscordWebhook(
  webhookUrl: string,
  name: string,
  message: string
): Promise<boolean> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: name,
      content: message,
    }),
  });

  return response.ok;
}

async function handleSignalPost(request: Request, env: Env): Promise<Response> {
  if (!env.DISCORD_WEBHOOK_URL) {
    return jsonResponse({ error: "not_configured" }, 503);
  }

  let payload: { name?: unknown; message?: unknown };
  try {
    payload = (await request.json()) as { name?: unknown; message?: unknown };
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const name = normalizeName(payload.name);
  if (!name) {
    return jsonResponse({ error: "invalid_name" }, 400);
  }

  const message = normalizeMessage(payload.message);
  if (!message) {
    return jsonResponse({ error: "invalid_message" }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (await isRateLimited(env, ip)) {
    return jsonResponse({ error: "rate_limited" }, 429);
  }

  const sent = await sendDiscordWebhook(env.DISCORD_WEBHOOK_URL, name, message);
  if (!sent) {
    return jsonResponse({ error: "discord_failed" }, 502);
  }

  await recordSend(env, ip);
  return jsonResponse({ ok: true });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/signal" && request.method === "POST") {
      return handleSignalPost(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
