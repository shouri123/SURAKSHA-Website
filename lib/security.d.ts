import type { NextResponse } from "next/server";

export function isValidUuid(value: string): boolean;
export function getClientIp(request: Request): string;
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number };
export function verifySameOrigin(request: Request): NextResponse | null;
export function rateLimitExceededResponse(retryAfterSec: number): NextResponse;
