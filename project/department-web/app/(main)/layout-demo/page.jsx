import Button from "@components/button";
import Sidebar from "@components/sidebar";

export default function LayoutExamplesPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F6F8]">
      <div className="min-h-[calc(100vh-4rem)]">
        <Sidebar />

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-[#1a1a1a]">
                ตัวอย่างคอมโพเนนต์
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                กดปุ่มเพื่อเปิดดูตัวอย่างแต่ละหน้า
              </p>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#1a1a1a]">Button</h2>
                <p className="mb-5 mt-1 text-sm text-gray-500">
                  ดูรูปแบบและขนาดของปุ่มทั้งหมด
                </p>
                <Button href="/button" variant="primary" icon="arrowRight">
                  เปิดดูตัวอย่าง Button
                </Button>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#1a1a1a]">Icon</h2>
                <p className="mb-5 mt-1 text-sm text-gray-500">
                  ดูไอคอนทั้งหมดที่ใช้ในระบบ
                </p>
                <Button href="/icon" variant="outline" icon="image">
                  เปิดดูตัวอย่าง Icon
                </Button>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
