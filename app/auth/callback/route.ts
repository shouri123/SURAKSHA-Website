import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next === "/" && data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        const role = profile?.role;
        next = role === "admin" || role === "operator" || role === "hydrologist"
          ? "/admin"
          : "/citizen";
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const allowedHosts = new Set<string>([new URL(origin).host]);
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        try {
          allowedHosts.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).host);
        } catch {
          // Ignore malformed site URL
        }
      }
      if (process.env.VERCEL_URL) allowedHosts.add(process.env.VERCEL_URL);
      if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        allowedHosts.add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
      }

      if (
        isLocalEnv ||
        !forwardedHost ||
        !/^[a-zA-Z0-9.-]+(:\d+)?$/.test(forwardedHost) ||
        !allowedHosts.has(forwardedHost)
      ) {
        return NextResponse.redirect(new URL(next, origin));
      }
      return NextResponse.redirect(new URL(next, `https://${forwardedHost}`));
    }
  }

  // Recovery links need a restart path of their own; OAuth keeps its login error route.
  const failurePath = next === "/auth/reset-password"
    ? "/auth/forgot-password?error=reset_link_invalid"
    : "/auth/login?error=oauth_exchange_failed";
  return NextResponse.redirect(new URL(failurePath, origin));
}

