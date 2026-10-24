import Button from "@components/button";

export default function CalenderClient () {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 bg-[#F5F6F8] p-4 sm:p-8">
            <h1 className="text-center text-3xl font-bold text-[#1a1a1a] sm:text-4xl">
                ยินดีต้อนรับสู่หน้าปฏิทินการศึกษา
            </h1>
            <p className="max-w-xl text-center text-sm text-gray-500">
                ระบบนี้เป็นตัวอย่างการสร้างเว็บแอปพลิเคชันด้วย Next.js 13 และ Tailwind CSS โดยมีฟีเจอร์พื้นฐาน เช่น การจัดการปฏิทิน การจัดการข้อมูล และการแสดงผลข้อมูลต่าง ๆ
            </p>
        </div>
    );
}