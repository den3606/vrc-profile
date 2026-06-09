import { normalizeName } from "./validate";

const RATE_LIMIT_TTL_SECONDS = 60 * 60 * 24 * 365;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function isRateLimited(env: Env, ip: string): Promise<boolean> {
  const key = `signal:${ip}`;
  return (await env.RATE_LIMIT.get(key)) !== null;
}

async function markRateLimited(env: Env, ip: string): Promise<void> {
  const key = `signal:${ip}`;
  await env.RATE_LIMIT.put(key, String(Date.now()), {
    expirationTtl: RATE_LIMIT_TTL_SECONDS,
  });
}

async function sendDiscordWebhook(webhookUrl: string, name: string): Promise<boolean> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `**Deep Diver Signal**\n名前: ${name}`,
    }),
  });

  return response.ok;
}

async function handleSignalPost(request: Request, env: Env): Promise<Response> {
  if (!env.DISCORD_WEBHOOK_URL) {
    return jsonResponse({ error: "not_configured" }, 503);
  }

  let payload: { name?: unknown };
  try {
    payload = (await request.json()) as { name?: unknown };
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const name = normalizeName(payload.name);
  if (!name) {
    return jsonResponse({ error: "invalid_name" }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (await isRateLimited(env, ip)) {
    return jsonResponse({ error: "rate_limited" }, 429);
  }

  const sent = await sendDiscordWebhook(env.DISCORD_WEBHOOK_URL, name);
  if (!sent) {
    return jsonResponse({ error: "discord_failed" }, 502);
  }

  await markRateLimited(env, ip);
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
