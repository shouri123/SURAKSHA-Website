import { NextResponse } from "next/server";
import { getAuthenticatedProfile } from "@/lib/supabase/authorization";
import {
  checkRateLimit,
  getClientIp,
  isValidUuid,
  rateLimitExceededResponse,
  verifySameOrigin,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getAuthenticatedProfile();
  if (!identity) {
    return NextResponse.json(
      { detail: "Sign in required." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Admins & Operators see full queue
  if (["admin", "operator"].includes(identity.profile.role)) {
    const { data, error } = await identity.supabase
      .from("citizen_sos_reports")
      .select("id,citizen_name,contact_phone,location_name,urgency,description,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json(
        { detail: "The assistance queue is unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(data ?? [], { headers: { "Cache-Control": "no-store" } });
  }

  // Citizens see their own submitted requests
  if (identity.profile.role === "citizen") {
    const { data, error } = await identity.supabase
      .from("citizen_sos_reports")
      .select("id,citizen_name,contact_phone,location_name,urgency,description,status,created_at")
      .eq("citizen_id", identity.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { detail: "Your assistance records are unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(data ?? [], { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { detail: "You are not allowed to view the assistance queue." },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const originError = verifySameOrigin(request);
  if (originError) return originError;

  const identity = await getAuthenticatedProfile();
  if (!identity) {
    return NextResponse.json(
      { detail: "Sign in required." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (identity.profile.role !== "citizen") {
    return NextResponse.json(
      { detail: "Only citizen accounts may submit an assistance request." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rateLimit = checkRateLimit(`sos-post:${identity.user.id}:${getClientIp(request)}`, 5, 10 * 60_000);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSec);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Request body must be valid JSON." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ detail: "Request body must be an assistance request." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const input = body as Record<string, unknown>;
  const citizenName = typeof input.citizen_name === "string" ? input.citizen_name.trim() : "";
  const contactPhone = typeof input.contact_phone === "string" ? input.contact_phone.trim() : "";
  const locationName = typeof input.location_name === "string" ? input.location_name.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const urgency = input.urgency;

  if (citizenName.length < 2 || citizenName.length > 120) {
    return NextResponse.json({ detail: "Enter a name between 2 and 120 characters." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const phoneDigits = contactPhone.replace(/\D/g, "");
  if (!/^\+?[0-9 ()-]{7,30}$/.test(contactPhone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    return NextResponse.json({ detail: "Enter a valid contact number." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (locationName.length < 2 || locationName.length > 300) {
    return NextResponse.json({ detail: "Enter a location between 2 and 300 characters." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (description.length < 2 || description.length > 2000) {
    return NextResponse.json({ detail: "Describe the assistance needed in 2 to 2,000 characters." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (urgency !== "LOW" && urgency !== "MEDIUM" && urgency !== "HIGH") {
    return NextResponse.json({ detail: "Choose a valid urgency level." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await identity.supabase
    .from("citizen_sos_reports")
    .insert({
      citizen_id: identity.user.id,
      citizen_name: citizenName,
      contact_phone: contactPhone,
      location_name: locationName,
      urgency,
      description,
      status: "OPEN",
    })
    .select("id,status,created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { detail: "The request could not be saved. Please try again or call emergency services." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(data, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const originError = verifySameOrigin(request);
  if (originError) return originError;

  const identity = await getAuthenticatedProfile();
  if (!identity) {
    return NextResponse.json(
      { detail: "Sign in required." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!["admin", "operator"].includes(identity.profile.role)) {
    return NextResponse.json(
      { detail: "Only operators and admins can update ticket statuses." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rateLimit = checkRateLimit(`sos-patch:${identity.user.id}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfterSec);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Request body must be valid JSON." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ detail: "Request body must be a status update object." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const input = body as Record<string, unknown>;
  const id = typeof input.id === "string" ? input.id.trim() : "";
  const status = typeof input.status === "string" ? input.status.trim() : "";

  if (!id || !isValidUuid(id)) {
    return NextResponse.json({ detail: "Valid ticket ID is required." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const validStatuses = ["OPEN", "IN_REVIEW", "DISPATCHED", "RESOLVED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ detail: `Status must be one of: ${validStatuses.join(", ")}` }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await identity.supabase
    .from("citizen_sos_reports")
    .update({ status })
    .eq("id", id)
    .select("id,status,created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { detail: "Failed to update ticket status." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
