import { createClient } from "./server";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const { data: faculty, error: facultyError } = await supabase
    .from("faculty_members")
    .select("photo_url")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (facultyError) throw new Error(facultyError.message);

  return {
    supabase,
    user,
    profile,
    profilePhotoUrl:
      faculty?.photo_url ||
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      "",
  };
}
