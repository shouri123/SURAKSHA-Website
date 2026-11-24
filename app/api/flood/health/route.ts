import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/security";

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(`health:${getClientIp(request)}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSec);
  }

  const backendUrl = process.env.SURAKSHA_BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json(
      { status: "UNAVAILABLE", operational_readiness: "UNKNOWN", notice: "The SURAKSHA service URL is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/v1/flood/health`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ status: "UNAVAILABLE", notice: "The SURAKSHA service returned an unexpected response." }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }
    const raw = (await res.json()) as Record<string, unknown>;
    // Only expose safe non-sensitive summary fields; strip operator_auth, cors_origins, and internal paths.
    const safeHealth = {
      status: typeof raw.status === "string" ? raw.status : "UNKNOWN",
      operational_readiness: typeof raw.operational_readiness === "string" ? raw.operational_readiness : "UNKNOWN",
      notice: typeof raw.notice === "string" ? raw.notice : undefined,
      subsystem: typeof raw.subsystem === "string" ? raw.subsystem : undefined,
      station_catalog: raw.station_catalog && typeof raw.station_catalog === "object" ? raw.station_catalog : undefined,
    };
    return NextResponse.json(safeHealth, { status: res.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      { status: "UNAVAILABLE", operational_readiness: "UNKNOWN", notice: timedOut ? "The SURAKSHA service did not respond in time." : "The SURAKSHA service could not be reached." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

