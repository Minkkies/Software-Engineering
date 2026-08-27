# สรุปบทเรียน: Component-Level Design (การออกแบบระดับคอมโพเนนต์)

## 1. คอมโพเนนต์คืออะไร (What is a Component?)
- **มุมมองเชิงวัตถุ (OO view):** คอมโพเนนต์ประกอบด้วยกลุ่มคลาสที่ทำงานร่วมกัน (collaborating classes)
- **มุมมองทั่วไป (Conventional view):** ประกอบด้วย logic, โครงสร้างข้อมูลภายในที่จำเป็นต่อการประมวลผล และ interface ที่ทำให้คอมโพเนนต์ถูกเรียกใช้และรับส่งข้อมูลได้

## 2. หลักการออกแบบพื้นฐาน (Basic Design Principles)
- **OCP (Open-Closed Principle):** โมดูลควรเปิดสำหรับการขยาย แต่ปิดสำหรับการแก้ไข
- **LSP (Liskov Substitution Principle):** คลาสลูกควรแทนที่คลาสแม่ได้
- **DIP (Dependency Inversion Principle):** พึ่งพา abstraction ไม่ใช่ concretion
- **ISP (Interface Segregation Principle):** interface เฉพาะเจาะจงหลายตัวดีกว่า interface ทั่วไปตัวเดียว
- **REP (Release Reuse Equivalency Principle):** หน่วยของการนำกลับมาใช้ = หน่วยของการ release
- **CCP (Common Closure Principle):** คลาสที่เปลี่ยนแปลงร่วมกันควรอยู่ด้วยกัน
- **CRP (Common Reuse Principle):** คลาสที่ไม่ได้ถูกใช้ซ้ำร่วมกันไม่ควรถูกจัดกลุ่มไว้ด้วยกัน

## 3. Cohesion (การยึดเหนี่ยวภายใน)
- **มุมมองทั่วไป:** ความ "มุ่งเป้าเดียว" ของโมดูล
- **มุมมองเชิงวัตถุ:** คอมโพเนนต์/คลาสควรมีเฉพาะ attribute และ operation ที่เกี่ยวข้องกันอย่างใกล้ชิด
- **ระดับของ Cohesion:** Functional, Layer, Communicational, Sequential, Procedural, Temporal, Utility

## 4. Coupling (การเชื่อมโยงระหว่างโมดูล)
- **มุมมองทั่วไป:** ระดับที่คอมโพเนนต์เชื่อมโยงกับคอมโพเนนต์อื่นและโลกภายนอก
- **มุมมองเชิงวัตถุ:** การวัดเชิงคุณภาพของการเชื่อมโยงระหว่างคลาส
- **ระดับของ Coupling:** Content, Common, Control, Stamp, Data, Routine call, Type use, Inclusion/Import, External

## 5. แผนภาพที่ใช้ในการออกแบบ
- **Collaboration Diagram:** แสดงการส่งข้อความระหว่างอ็อบเจกต์ (เช่น ProductionJob, WorkOrder, JobQueue)
- **Activity Diagram:** แสดงลำดับการทำงาน เช่น การคำนวณต้นทุนกระดาษตามขนาดและสี
- **Statechart:** แสดงสถานะของระบบ เช่น buildingJobData, formingJob, submittingJob พร้อม entry/exit/do actions

## 6. การออกแบบอัลกอริทึม (Algorithm Design)
- เป็นกิจกรรมออกแบบที่ใกล้เคียงกับการเขียนโค้ดมากที่สุด
- แนวทาง:
  1. ทบทวนคำอธิบายการออกแบบของคอมโพเนนต์
  2. ใช้ **Stepwise Refinement** เพื่อพัฒนาอัลกอริทึม
  3. ใช้ **Structured Programming** เพื่อ implement logic
  4. ใช้ **Formal Methods** เพื่อพิสูจน์ความถูกต้องของ logic

### ตัวอย่าง Stepwise Refinement
กระบวนการ "เปิดประตู" ถูกย่อยจากขั้นตอนกว้างๆ (เดินไปที่ประตู, จับลูกบิด, เปิดประตู) ไปสู่รายละเอียดย่อย (หมุนลูกบิด, ถ้าไม่หมุนให้หาลูกกุญแจที่ถูกต้อง ฯลฯ)

## 7. Algorithm Design Model
รูปแบบการนำเสนออัลกอริทึมที่สามารถนำไปรีวิวคุณภาพได้ เช่น:
- แผนภาพ (flowchart, box diagram)
- Pseudocode (เช่น PDL)
- ภาษาโปรแกรม
- Decision Table
- การทำ walkthrough เพื่อประเมินคุณภาพ

## 8. Decision Table (ตารางการตัดสินใจ)
ตัวอย่าง: การให้ส่วนลดลูกค้าตามเงื่อนไข (ลูกค้าทั่วไป/silver/gold/ส่วนลดพิเศษ) แสดงเป็นกฎ (Rules) ที่จับคู่เงื่อนไข (T/F) กับผลลัพธ์ (ไม่มีส่วนลด, ส่วนลด 8%, 15%, หรือส่วนลดเพิ่มเติม x%)

## 9. Structure Chart (แผนภูมิโครงสร้าง)
- เทคนิคออกแบบโปรแกรมที่สำคัญ
- แสดงคอมโพเนนต์ของโค้ดทั้งหมดในรูปแบบลำดับชั้น (hierarchical) ประกอบด้วย:
  - Sequence (ลำดับ)
  - Selection (การเลือก)
  - Iteration (การวนซ้ำ)
- **ตัวอย่าง:** ระบบ "Create Student Grade Listing" แตกย่อยเป็นโมดูลย่อย เช่น Get Student Grade Record, Calculate Current GPA, Calculate Cumulative GPA, Print Grade Listing, Print Dean's List

### องค์ประกอบของ Structure Chart
- Library Module, Loop, Conditional Line
- Control Couple / Status Parameter
- On-page / Off-page connector
- Data Couple / Data Parameter