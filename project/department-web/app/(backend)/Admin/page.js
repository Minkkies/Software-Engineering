// app/(backend)/Admin/page.js  ->  /Admin
// หน้าแรกของหลังบ้าน = แดชบอร์ด (ไม่ redirect)

import DashBoard from "./DashBoard";

export const metadata = {
  title: "ภาพรวมระบบ | CS Info Portal",
};

export default function AdminPage() {
  return <DashBoard />;
}