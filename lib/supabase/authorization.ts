import { redirect } from "next/navigation";
import { createClient } from "./server";
import type { UserProfile } from "./auth-context";

type WorkspaceRole = UserProfile["role"];

export async function getAuthenticatedProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) return null;

  const validRoles: WorkspaceRole[] = ["admin", "hydrologist", "operator", "citizen"];
  if (!validRoles.includes(profile.role as WorkspaceRole)) return null;

  return { supabase, user, profile: profile as Pick<UserProfile, "role"> };
}

export async function requireWorkspaceRole(
  allowedRoles: WorkspaceRole[],
  pathname: "/admin" | "/citizen"
) {
  const identity = await getAuthenticatedProfile();
  if (!identity) redirect(`/auth/login?next=${encodeURIComponent(pathname)}`);

  const role = identity.profile.role;
  if (!allowedRoles.includes(role)) {
    redirect(role === "citizen" ? "/citizen" : "/admin");
  }

  return { user: identity.user, role };
}
