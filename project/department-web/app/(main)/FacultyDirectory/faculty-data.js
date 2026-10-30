import { createClient } from "@supabase/supabase-js";

// Supabase client ฝั่ง server (อ่านข้อมูลสาธารณะด้วย publishable key)
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false } }
    );
}

const LIST_COLUMNS =
    "id, kind, full_name, position, education, expertise, email, phone, office_room, photo_url, sort_order";

export async function getFacultyList() {
    const { data, error } = await getSupabase()
        .from("faculty_members")
        .select(LIST_COLUMNS)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("full_name", { ascending: true });

    if (error) {
        console.error("getFacultyList:", error.message);
        return [];
    }
    return data ?? [];
}

export async function getFacultyById(id) {
    const { data, error } = await getSupabase()
        .from("faculty_members")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();

    if (error) {
        console.error("getFacultyById:", error.message);
        return null;
    }
    return data;
}
