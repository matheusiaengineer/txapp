import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "./rate-limit";

type ApiHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse;

interface RateLimitConfig {
  requests: number;
  windowMs: number;
}

const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { requests: 30, windowMs: 60000 },
  auth: { requests: 5, windowMs: 60000 },
  heartbeat: { requests: 60, windowMs: 60000 },
  nearby: { requests: 30, windowMs: 60000 },
  upload: { requests: 10, windowMs: 60000 },
  dispatch: { requests: 20, windowMs: 60000 },
  payment: { requests: 10, windowMs: 60000 },
  webhook: { requests: 100, windowMs: 60000 },
};

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

export function withRateLimit(handler: ApiHandler, tier: keyof typeof DEFAULT_RATE_LIMITS = "default"): ApiHandler {
  return async (req: NextRequest, ...args: any[]) => {
    const config = DEFAULT_RATE_LIMITS[tier] || DEFAULT_RATE_LIMITS.default;
    const ip = getClientIp(req);
    const url = new URL(req.url);
    const key = `${tier}:${ip}:${url.pathname}`;

    const rl = await rateLimit(key, config.requests, config.windowMs);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Muitas requisições. Aguarde um momento." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(config.requests),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const response = await handler(req, ...args);
    if (response instanceof NextResponse) {
      response.headers.set("X-RateLimit-Limit", String(config.requests));
      response.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    }
    return response;
  };
}
