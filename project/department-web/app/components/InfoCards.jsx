function InfoCard({ title, accent, children }) {
    return (
        <div className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${accent}`}>
            <h3 className="text-lg font-bold text-[#1a1a1a]">{title}</h3>
            {children}
        </div>
    );
}

/**
 * การ์ดข้อมูลด้านล่างหน้า (ความปลอดภัยของระบบ / ฝ่ายสนับสนุนด้านเทคนิค)
 * ใช้ซ้ำได้ทั้งหน้ารายการและหน้าฟอร์มเพิ่ม/แก้ไข
 */
export default function InfoCards({ className = "mt-8" }) {
    return (
        <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
            <InfoCard title="ความปลอดภัยของระบบ" accent="border-[#0A2FA3]">
                <p className="mt-2 text-sm text-gray-500">
                    การจัดการสิทธิ์เข้าถึง (ACL) เป็นสิ่งสำคัญ กรุณาตรวจสอบให้แน่ใจว่าการให้สิทธิ์ <strong>Admin</strong> นั้นจำกัดเฉพาะผู้ที่จำเป็นต้องจัดการระบบจริง ๆ เท่านั้น
                </p>
                <a href="#" className="mt-3 inline-block text-sm font-medium text-[#0A2FA3] hover:underline">
                    อ่านคู่มือความปลอดภัยเพิ่มเติม
                </a>
            </InfoCard>

            <InfoCard title="ฝ่ายสนับสนุนด้านเทคนิค" accent="border-amber-400">
                <p className="mt-2 text-sm text-gray-500">
                    หากพบปัญหาในการเข้าใช้งานของผู้ใช้งานจำนวนมาก หรือระบบเชื่อมต่อฐานข้อมูลนักศึกษามีปัญหา กรุณาติดต่อหน่วยงาน IT ส่วนกลาง
                </p>
                <p className="mt-3 font-mono text-xs text-gray-500">เบอร์โทร: 02-XXX-XXXX · helpdesk@university.ac.th</p>
            </InfoCard>
        </div>
    );
}
