# สรุปบทเรียน: User Interface Design (การออกแบบส่วนติดต่อผู้ใช้)

## 1. นิยามสำคัญ (Key Definitions)
- **User Interface:** กำหนดวิธีที่ระบบจะโต้ตอบกับสิ่งภายนอก (external entities)
- **Navigation mechanism:** วิธีที่ผู้ใช้บอกระบบว่าต้องการให้ทำอะไร
- **Input mechanism:** วิธีที่ระบบรับข้อมูล
- **Output mechanism:** วิธีที่ระบบแสดงข้อมูลให้ผู้ใช้หรือระบบอื่น

## 2. ข้อผิดพลาดทั่วไปในการออกแบบ Interface
- ขาดความสม่ำเสมอ (lack of consistency)
- ต้องจำมากเกินไป (too much memorization)
- ไม่มีคำแนะนำ/ความช่วยเหลือ
- ไม่คำนึงถึงบริบท (no context sensitivity)
- ตอบสนองช้า/ไม่ดี
- ดูเข้าใจยาก/ไม่เป็นมิตร

## 3. กฎทอง 3 ข้อ (Golden Rules)
### 3.1 ให้ผู้ใช้เป็นผู้ควบคุม (Place the User in Control)
- ไม่บังคับให้ผู้ใช้ทำสิ่งที่ไม่ต้องการ
- ให้การโต้ตอบยืดหยุ่น, สามารถขัดจังหวะและยกเลิกได้
- ปรับให้เหมาะกับระดับทักษะที่เพิ่มขึ้น และปรับแต่งได้
- ซ่อนรายละเอียดทางเทคนิคจากผู้ใช้ทั่วไป
- ออกแบบให้โต้ตอบโดยตรงกับวัตถุบนหน้าจอ

### 3.2 ลดภาระความจำของผู้ใช้ (Reduce the User's Memory Load)
- ลดการพึ่งพา short-term memory
- กำหนดค่าเริ่มต้น (default) ที่มีความหมาย
- กำหนด shortcut ที่เข้าใจง่าย
- ใช้ metaphor จากโลกจริงในการออกแบบ layout
- เปิดเผยข้อมูลแบบค่อยเป็นค่อยไป (progressive disclosure)

### 3.3 ทำให้ Interface มีความสม่ำเสมอ (Make the Interface Consistent)
- ให้ผู้ใช้เข้าใจบริบทของงานปัจจุบัน
- รักษาความสม่ำเสมอในกลุ่มแอปพลิเคชัน
- ไม่เปลี่ยนรูปแบบที่ผู้ใช้คุ้นเคยโดยไม่มีเหตุผลที่ชัดเจน

## 4. หลักการออกแบบ UI (Principles for UI Design)
Layout, Content awareness, Aesthetics, User experience, Consistency, Minimal user effort

### Layout Concepts
- แบ่งจอเป็น 3 ส่วน: **Navigation area** (บน), **Work area** (กลาง), **Status area** (ล่าง)
- พื้นที่ที่คล้ายกันควรจัดกลุ่มไว้ด้วยกัน
- ลดการเคลื่อนไหวของผู้ใช้ระหว่างพื้นที่ต่างๆ
- รักษาความสม่ำเสมอด้าน ขนาด รูปร่าง ตำแหน่งการกรอกข้อมูล และการแสดงรายงาน
- ตัวอย่าง flow ที่ดี: จัดเรียงฟิลด์ตามลำดับการกรอกแบบเป็นเส้นตรง (good flow) เทียบกับ flow ที่สับสน กระโดดไปมา (bad flow)

### Content Awareness
- ทุก interface ควรมีชื่อเรื่อง (title)
- เมนูควรบอกว่าผู้ใช้อยู่ที่ไหนและมาจากไหน
- ข้อมูลในแต่ละพื้นที่ต้องชัดเจน
- เลือก field และ label อย่างระมัดระวัง
- ใช้วันที่และเลขเวอร์ชันช่วยผู้ใช้งาน

### Aesthetics
- ต้องใช้งานได้จริงและดึงดูดใจ
- หลีกเลี่ยงการยัดข้อมูลแน่นเกินไป โดยเฉพาะสำหรับผู้ใช้มือใหม่
- ระวังเรื่องฟอนต์และขนาด หลีกเลี่ยงตัวพิมพ์ใหญ่ทั้งหมด
- ใช้สีและลวดลายอย่างระมัดระวัง (ทดสอบบนจอขาวดำเพื่อดูคุณภาพ)

### User Experience
- พิจารณาความง่ายในการเรียนรู้และการใช้งานสำหรับผู้เชี่ยวชาญ
- เพิ่ม shortcut สำหรับผู้เชี่ยวชาญ

### Consistency
- ช่วยให้ผู้ใช้คาดเดาสิ่งที่จะเกิดขึ้นได้ ลด learning curve
- ครอบคลุมทั้งภายในแอปเดียวกันและข้ามแอป (navigation, terminology, report/form design)

### Minimize Effort
- **กฎ 3 คลิก (Three clicks rule):** ผู้ใช้ควรไปถึงข้อมูล/การกระทำที่ต้องการได้ภายในไม่เกิน 3 คลิกหรือ 3 การกดปุ่ม จากเมนูหลัก

## 5. กระบวนการออกแบบ User Interface (5-Step Process)
วนเป็นวงจร: **Use/Scenario Development → Interface Structure Design → Interface Standards Design → Interface Design Prototyping → Interface Evaluation** (แล้ววนกลับ)

1. **Use Scenario Development:** ร่างขั้นตอนการทำงาน นำเสนอเป็น narrative ที่เชื่อมโยงกับ DFD บันทึกเส้นทางที่พบบ่อยที่สุด
2. **Interface Structure Design:** แผนภาพแสดงความสัมพันธ์ของหน้าจอ/ฟอร์ม/รายงานทั้งหมด และการเคลื่อนที่ระหว่างกัน (คล้าย DFD แต่ไม่มีรูปแบบมาตรฐานตายตัว)
3. **Interface Standards Design:** องค์ประกอบพื้นฐานที่ใช้ร่วมกันทั่วทั้งแอป เช่น interface metaphor (desktop, shopping cart), interface objects, actions, icons, templates
4. **Interface Design Prototyping:** การจำลองหน้าจอ/ฟอร์ม/รายงาน เช่น Storyboarding, HTML prototype, Language prototype
5. **Interface Evaluation:** ประเมินคุณภาพ ได้แก่
   - Heuristic evaluation (เทียบกับ checklist)
   - Walkthrough evaluation (ทีมจำลองการใช้งาน)
   - Interactive evaluation (ผู้ใช้ทดลองใช้จริง)
   - Formal usability testing (ค่าใช้จ่ายสูง ทดสอบในแล็บ)

**Design Evaluation Cycle:** ออกแบบเบื้องต้น → สร้าง prototype → ประเมิน → ปรับปรุง → ทำซ้ำจนออกแบบเสร็จสมบูรณ์

## 6. การออกแบบระบบนำทาง (Navigation Design)
### หลักการพื้นฐาน
- สมมติว่าผู้ใช้ไม่เคยอ่านคู่มือ ไม่เคยผ่านการอบรม และไม่มีความช่วยเหลือใกล้ตัว
- **ป้องกันความผิดพลาด:** จำกัดตัวเลือก, ไม่แสดงคำสั่งที่ใช้ไม่ได้ (หรือทำให้จาง), ยืนยันการกระทำที่ยกเลิกยาก
- ทำให้การกู้คืนจากข้อผิดพลาดง่าย
- ใช้ลำดับไวยากรณ์ที่สม่ำเสมอ

### ประเภทของการควบคุมนำทาง (Types of Navigation Control)
- **Languages:** Command language, Natural language
- **Menus:** เน้น broad shallow menu, ใช้ hot keys
- **Direct Manipulation:** ใช้ไอคอนเริ่มโปรแกรม, ปรับรูปร่าง/ขนาดวัตถุ

### ประเภทเมนู (Types of Menus)
Menu bar, Drop-down menu, Pop-up menu, Tab menu, Toolbar, Image map

### ข้อความแจ้งเตือน (Messages)
- ควรชัดเจน กระชับ ครบถ้วน ถูกไวยากรณ์ ไม่ใช้ศัพท์เทคนิคเกินจำเป็น หลีกเลี่ยงคำเชิงลบและมุกตลก
- **ประเภทข้อความ:** Error message, Confirmation message, Acknowledgment message, Delay message, Help message

## 7. การออกแบบข้อมูลนำเข้า (Input Design)
- เป้าหมาย: จับข้อมูลที่ถูกต้องได้ง่ายและรวดเร็ว
- **Online vs Batch Processing:** online บันทึกทันที ส่วน batch รวบรวมแล้วประมวลผลทีเดียว
- **Capture Data at the Source:** ลดงานซ้ำ ลดเวลาประมวลผล ลดต้นทุน ลดโอกาสผิดพลาด
- **Source Data Automation:** bar code readers, OCR, magnetic stripe readers, smart cards
- **Minimize Keystrokes:** ไม่ถามข้อมูลที่หาได้จากที่อื่น ใช้ default values

### ประเภทของ Input
Text, Numbers, Selection boxes (Check boxes, Radio buttons, On-screen list boxes, Drop-down list boxes, Combo boxes, Sliders)

### ประเภทการตรวจสอบข้อมูล (Input Validation)
Completeness check, Format check, Range check, Check digit check, Consistency check, Database checks

### กระบวนการออกแบบ Input (Input Design Process)
1. ระบุ input ของระบบ และทบทวนความต้องการเชิงตรรกะ (ดู DFD)
2. เลือก GUI control ที่เหมาะสม
3. ออกแบบ ตรวจสอบ และทดสอบ (สร้าง prototype ให้ผู้ใช้ทดลอง)
4. ออกแบบ source document (ถ้าจำเป็น)

## 8. การออกแบบผลลัพธ์ (Output Design)
### หลักการพื้นฐาน
- เข้าใจการใช้งานรายงาน (อ้างอิงหรืออ่านทั้งหมด, ความถี่, real-time หรือ batch)
- จัดการปริมาณข้อมูลที่นำเสนอ (manage information load)
- ลดอคติในการนำเสนอข้อมูล (minimize bias) — เช่น กราฟที่เริ่มสเกลจาก 0 vs กราฟที่เริ่มจาก 90 อาจทำให้ตีความข้อมูลผิด

### ประเภทของรายงาน (Types of Reports)
Detail reports, Summary report, Turnaround document, Graphs

### รูปแบบตัวอย่าง (Prototype Examples)
- External document (เช่น Purchase Order)
- Tabular report prototype
- Graphical report prototype
- Single report output prototype
- Web database output / Window media player output

### กระบวนการออกแบบ Output (Output Design Process)
1. ระบุ output ของระบบและทบทวนความต้องการเชิงตรรกะ (จาก DFD)
2. ระบุความต้องการทางกายภาพ (สื่อและรูปแบบที่เหมาะสม, internal/external use, detail/summary/exception report, turnaround document)
3. ออกแบบฟอร์มพิมพ์ล่วงหน้า (preprinted forms) — ข้อมูลที่ต้องปรากฏ, การใช้เพื่อส่งไปรษณีย์, จำนวนฟอร์มที่ต้องพิมพ์, ขนาดฟอร์ม, perforation สำหรับ turnaround document, สี, เทคนิคการทำสำเนา
4. ออกแบบ ตรวจสอบ และทดสอบ output (ร่าง sketch/prototype ให้ผู้ใช้ทดลองและให้ feedback)

## 9. ประเด็นการออกแบบอื่นๆ (Design Issues)
- Response time (เวลาตอบสนอง)
- Help facilities (ระบบช่วยเหลือ)
- Error handling (การจัดการข้อผิดพลาด)
- Menu and command labeling (การตั้งชื่อเมนูและคำสั่ง)
- Application accessibility (การเข้าถึงแอปพลิเคชัน)
- Internationalization (การรองรับหลายภาษา/วัฒนธรรม)