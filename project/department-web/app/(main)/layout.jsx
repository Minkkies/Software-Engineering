import Navbar from "@components/navbar";
import { getSessionUser } from "@lib/supabase/auth";

export default async function MainLayout({ children }) {
  const { user, profile } = await getSessionUser();
  const navbarUser = user
    ? {
        name: profile?.full_name || profile?.email || user.email || "ผู้ใช้งาน",
        email: profile?.email || user.email || "",
        role: profile?.role,
      }
    : null;

  return (
    <>
      <Navbar user={navbarUser} />
      {children}
    </>
  );
}
