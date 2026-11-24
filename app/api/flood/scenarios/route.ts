import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  rateLimitExceededResponse,
  verifySameOrigin,
} from "../../../../lib/security";

const timeoutMs = 30_000;

function backendUrl() {
  return (process.env.SURAKSHA_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

async function proxy(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const operatorKey = process.env.SURAKSHA_OPERATOR_API_KEY?.trim();
  const authHeaders: Record<string, string> = operatorKey ? { authorization: `Bearer ${operatorKey}` } : {};

  try {
    const response = await fetch(`${backendUrl()}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        ...authHeaders,
        ...(init?.headers as Record<string, string> | undefined),
      },
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { detail: "The SURAKSHA service returned an unexpected response." },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }
    const body = await response.json();
    return NextResponse.json(body, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timeout = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      { detail: timeout ? "The SURAKSHA service did not respond in time." : "The SURAKSHA service could not be reached." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const rateLimit = checkRateLimit(`scenarios-get:${getClientIp(request)}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSec);
  }
  return proxy("/api/v1/flood/demo/scenarios");
}

export async function POST(request: Request) {
  const originError = verifySameOrigin(request);
  if (originError) return originError;

  const rateLimit = checkRateLimit(`scenarios-post:${getClientIp(request)}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSec);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ detail: "Request body must be a scenario object." }, { status: 400 });
  }

  const data = payload as Record<string, unknown>;
  const allowedKeys = new Set(["scenario_id", "river_discharge_multiplier", "precipitation_anomaly_mm"]);
  if (Object.keys(data).some((key) => !allowedKeys.has(key))) {
    return NextResponse.json({ detail: "Request contains unsupported scenario options." }, { status: 400 });
  }
  if (typeof data.scenario_id !== "string" || !/^[A-Z0-9_-]{1,100}$/.test(data.scenario_id)) {
    return NextResponse.json({ detail: "Choose a valid scenario." }, { status: 400 });
  }
  if (typeof data.river_discharge_multiplier !== "number" || !Number.isFinite(data.river_discharge_multiplier) || data.river_discharge_multiplier < 0.5 || data.river_discharge_multiplier > 3) {
    return NextResponse.json({ detail: "Starting river discharge must be scaled between 0.5× and 3.0×." }, { status: 400 });
  }
  if (typeof data.precipitation_anomaly_mm !== "number" || !Number.isFinite(data.precipitation_anomaly_mm) || data.precipitation_anomaly_mm < 0 || data.precipitation_anomaly_mm > 500) {
    return NextResponse.json({ detail: "Added rainfall must be between 0 and 500 mm." }, { status: 400 });
  }

  const catalogResponse = await proxy("/api/v1/flood/demo/scenarios");
  if (!catalogResponse.ok) return catalogResponse;

  const catalog = await catalogResponse.json();
  if (catalog?.synthetic_data_only !== true || !Array.isArray(catalog?.scenarios)) {
    return NextResponse.json({ detail: "The SURAKSHA service returned an invalid synthetic scenario catalog." }, { status: 502 });
  }
  const scenario = catalog?.scenarios?.find((entry: { id?: string }) => entry.id === data.scenario_id);
  if (!scenario?.input || typeof scenario.input !== "object" || Array.isArray(scenario.input)) {
    return NextResponse.json({ detail: "That scenario is not available from the SURAKSHA service." }, { status: 400 });
  }

  const input = JSON.parse(JSON.stringify(scenario.input)) as {
    current_condition?: { river_discharge_m3s?: unknown; rainfall_24h_mm?: unknown };
  };
  const conditions = input.current_condition;
  if (!conditions || typeof conditions !== "object") {
    return NextResponse.json({ detail: "The selected scenario is missing its starting conditions." }, { status: 502 });
  }
  if (typeof conditions.river_discharge_m3s !== "number" || !Number.isFinite(conditions.river_discharge_m3s)) {
    return NextResponse.json({ detail: "The selected scenario does not provide a usable starting river discharge." }, { status: 502 });
  }
  if (typeof conditions.rainfall_24h_mm !== "number" || !Number.isFinite(conditions.rainfall_24h_mm)) {
    return NextResponse.json({ detail: "The selected scenario does not provide usable 24-hour rainfall." }, { status: 502 });
  }

  conditions.river_discharge_m3s = Number((conditions.river_discharge_m3s * data.river_discharge_multiplier).toFixed(2));
  conditions.rainfall_24h_mm = Number((conditions.rainfall_24h_mm + data.precipitation_anomaly_mm).toFixed(2));

  return proxy(`/api/v1/flood/demo/scenarios/${encodeURIComponent(data.scenario_id)}/run?mode=static`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
}
