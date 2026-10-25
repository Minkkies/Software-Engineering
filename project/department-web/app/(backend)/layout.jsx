import Sidebar from "@components/sidebar";
import Navbar from "@components/navbar";
import { getSessionUser } from "@lib/supabase/auth";

export default async function BackendLayout({ children }) {
  const { user, profile } = await getSessionUser();
  const navbarUser = user
    ? {
        name: profile?.full_name || profile?.email || user.email || "ผู้ใช้งาน",
        email: profile?.email || user.email || "",
      }
    : null;

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <Navbar user={navbarUser} />
      <div className="min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="ml-64 min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}