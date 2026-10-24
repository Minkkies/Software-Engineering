import Sidebar from "@components/sidebar";
import Navbar from "@components/navbar";

export default function BackendLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="ml-64 min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}