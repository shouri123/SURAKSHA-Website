const { NextResponse } = require("next/server");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const rateLimitStore = new Map();
const MAX_BUCKETS = 2000;

function isValidUuid(value) {
  return UUID_REGEX.test(value);
}

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp ? realIp.slice(0, 64) : "unknown";
}

function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();

  if (rateLimitStore.size > MAX_BUCKETS) {
    rateLimitStore.forEach((bucket, entryKey) => {
      if (bucket.resetAt <= now) {
        rateLimitStore.delete(entryKey);
      }
    });
  }

  const existing = rateLimitStore.get(key);
  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: Math.ceil(windowMs / 1000) };
  }

  if (existing.count >= maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
}

function verifySameOrigin(request) {
  const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite === "cross-site") {
    return NextResponse.json(
      { detail: "Cross-site requests are not permitted." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const allowedOrigins = new Set();
  try {
    allowedOrigins.add(new URL(request.url).origin);
  } catch {
    // Ignore malformed request URL
  }

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (host && /^[a-zA-Z0-9.-]+(:\d+)?$/.test(host)) {
    allowedOrigins.add(`${proto}://${host}`);
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredSiteUrl) {
    try {
      allowedOrigins.add(new URL(configuredSiteUrl).origin);
    } catch {
      // Ignore invalid site URL
    }
  }

  const originHeader = request.headers.get("origin");
  if (originHeader) {
    try {
      const origin = new URL(originHeader).origin;
      if (!allowedOrigins.has(origin)) {
        return NextResponse.json(
          { detail: "Request origin is not authorized." },
          { status: 403, headers: { "Cache-Control": "no-store" } }
        );
      }
    } catch {
      return NextResponse.json(
        { detail: "Invalid Origin header." },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  return null;
}

function rateLimitExceededResponse(retryAfterSec) {
  return NextResponse.json(
    { detail: "Too many requests. Please wait before trying again." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}

module.exports = {
  isValidUuid,
  getClientIp,
  checkRateLimit,
  verifySameOrigin,
  rateLimitExceededResponse,
};
