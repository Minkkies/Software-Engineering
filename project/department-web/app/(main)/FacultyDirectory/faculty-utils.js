// "AI, Machine Learning" -> ["AI", "Machine Learning"]
// ไม่ตัดที่เครื่องหมายคอมมาที่อยู่ในวงเล็บ เช่น "COS3401 ... (DIGITAL IMAGE PROCESSING, 2D)"
export function parseExpertise(text) {
    if (!text) return [];
    return text
        .split(/[,;\n](?![^(]*\))/)
        .map((s) => s.trim())
        .filter(Boolean);
}

// "COS3401 การประมวลผลภาพดิจิทัล (DIGITAL IMAGE PROCESSING)"
//   -> { code: "COS3401", name: "การประมวลผลภาพดิจิทัล (DIGITAL IMAGE PROCESSING)" }
// ถ้าไม่ขึ้นต้นด้วยรหัสวิชา -> { code: "", name: <ข้อความเดิม> }
export function splitExpertise(item) {
    const m = item.match(/^([A-Za-z]{2,4}\s?\d{3,4})\s+(.+)$/);
    return m ? { code: m[1].replace(/\s/g, ""), name: m[2] } : { code: "", name: item };
}
