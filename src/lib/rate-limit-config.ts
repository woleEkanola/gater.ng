import { NextRequest, NextResponse } from "next/server";

interface RateLimitResult {
  success: boolean;
  headers: Record<string, string>;
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface RequestCount {
  count: number;
  resetTime: number;
}

const rateLimits: Record<string, RateLimitConfig> = {
  default: { limit: 100, windowMs: 60000 },
  auth: { limit: 5, windowMs: 60000 },
  authLogin: { limit: 10, windowMs: 900000 },
  payment: { limit: 20, windowMs: 3600000 },
  upload: { limit: 10, windowMs: 60000 },
};

const requestCounts = new Map<string, RequestCount>();

export async function rateLimit(
  limiterName: string,
  request: NextRequest
): Promise<RateLimitResult> {
  const config = rateLimits[limiterName] || rateLimits.default;
  const clientIp = getClientIp(request);
  const key = `${limiterName}:${clientIp}`;
  
  const now = Date.now();
  const existing = requestCounts.get(key);
  
  if (!existing || now > existing.resetTime) {
    requestCounts.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    
    return {
      success: true,
      headers: {
        "X-RateLimit-Limit": String(config.limit),
        "X-RateLimit-Remaining": String(config.limit - 1),
        "X-RateLimit-Reset": String(now + config.windowMs),
      },
    };
  }
  
  if (existing.count >= config.limit) {
    return {
      success: false,
      headers: {
        "X-RateLimit-Limit": String(config.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(existing.resetTime),
        "Retry-After": String(Math.ceil((existing.resetTime - now) / 1000)),
      },
    };
  }
  
  existing.count++;
  
  return {
    success: true,
    headers: {
      "X-RateLimit-Limit": String(config.limit),
      "X-RateLimit-Remaining": String(config.limit - existing.count),
      "X-RateLimit-Reset": String(existing.resetTime),
    },
  };
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000);