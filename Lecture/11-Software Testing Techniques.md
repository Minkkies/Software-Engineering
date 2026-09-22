# สรุป: Software Testing Techniques

## Testability (ความสามารถในการทดสอบได้)
คุณสมบัติของซอฟต์แวร์ที่ทำให้ทดสอบได้ง่าย ได้แก่
- **Operability** – ทำงานได้อย่างราบรื่น
- **Observability** – สังเกตผลลัพธ์ของแต่ละ test case ได้ง่าย
- **Controllability** – สามารถทำการทดสอบแบบอัตโนมัติและปรับให้เหมาะสมได้
- **Decomposability** – สามารถกำหนดขอบเขตการทดสอบเฉพาะจุดได้
- **Simplicity** – ลดความซับซ้อนของโครงสร้างและ logic เพื่อให้ทดสอบง่าย
- **Stability** – มีการเปลี่ยนแปลงระหว่างทดสอบน้อย
- **Understandability** – เข้าใจการออกแบบได้ง่าย

## Test ที่ดีเป็นอย่างไร
- มีโอกาสสูงที่จะพบข้อผิดพลาด
- ไม่ซ้ำซ้อนกับ test อื่น
- เป็น "ตัวแทนที่ดีที่สุด" ของกรณีทดสอบประเภทนั้น
- ไม่ง่ายหรือซับซ้อนจนเกินไป

## วิธีการทดสอบซอฟต์แวร์ (2 กลุ่มหลัก)
- **White-box testing** (Glass-box testing) – ใช้โครงสร้างควบคุมภายในโปรแกรมมาออกแบบ test case
- **Black-box testing** – ทดสอบจากภายนอกโดยไม่สนใจโครงสร้างภายใน

---

## White-Box Testing
เป้าหมาย: ให้แน่ใจว่าทุก statement และทุก condition ถูก execute อย่างน้อยหนึ่งครั้ง

Test case ที่ดีควรทำได้:
1. รับประกันว่า independent path ทุกเส้นในโมดูลถูกทดสอบอย่างน้อยหนึ่งครั้ง
2. ทดสอบเงื่อนไข logic ทั้งด้าน true และ false
3. ทดสอบ loop ที่ค่าขอบเขต (boundary) และภายในขอบเขตการทำงาน
4. ทดสอบโครงสร้างข้อมูลภายในเพื่อยืนยันความถูกต้อง

### Basis Path Testing
- ช่วยหา **ค่าความซับซ้อนเชิงตรรกะ (logical complexity)** ของการออกแบบ แล้วใช้เป็นแนวทางกำหนด "basis set" ของ execution path
- Test case ที่ได้จาก basis set จะรับประกันว่าทุก statement ถูก execute อย่างน้อย 1 ครั้ง

**Flow Graph Notation**
- Flow graph (program graph) คือสัญลักษณ์แสดง control flow
- **Node** = คำสั่งเชิงกระบวนการหนึ่งหรือหลายคำสั่ง
- **Edge/Link** = ลูกศรแสดงทิศทางการควบคุม
- **Region** = พื้นที่ที่ล้อมด้วย edge และ node (พื้นที่นอกกราฟก็นับเป็น 1 region ด้วย)

**Independent Program Paths**
- คือ path ที่เพิ่ม statement หรือ condition ใหม่อย่างน้อยหนึ่งอย่าง เมื่อเทียบกับ path ก่อนหน้า
- ต้องผ่าน edge ที่ยังไม่เคยถูกใช้มาก่อน
- Path ที่เป็นเพียงการรวมกันของ path ที่มีอยู่แล้ว จะไม่ถูกนับเป็น path ใหม่

**Cyclomatic Complexity: V(G)**
มาตรวัดความซับซ้อนเชิงตรรกะของโปรแกรม คำนวณได้ 3 วิธี (ผลลัพธ์เท่ากัน):
1. จำนวน region ในกราฟ
2. `V(G) = E - N + 2` (E = จำนวน edge, N = จำนวน node)
3. `V(G) = P + 1` (P = จำนวน predicate node หรือ node ที่มีเงื่อนไขตัดสินใจ)

**ขั้นตอนการออกแบบ Test Case (Deriving Test Cases)**
1. วาด flow graph จากการออกแบบหรือโค้ด
2. คำนวณ cyclomatic complexity ของ flow graph
3. หา basis set ของ independent path
4. เตรียม test case ที่บังคับให้แต่ละ path ใน basis set ถูก execute

*ตัวอย่างในสไลด์*: โปรแกรมคำนวณค่าเฉลี่ย (average) มี V(G)=6 (ยืนยันด้วยทั้ง 3 วิธี) และมี 6 path หลัก พร้อมออกแบบ test case สำหรับแต่ละ path (เช่น ค่า input ปกติ, ค่าที่ทำให้ loop หยุดทันที, ค่าที่เกิน 100 ตัว ฯลฯ)

**Graph Matrices**
- เมทริกซ์สี่เหลี่ยมจัตุรัสที่มีขนาดเท่ากับจำนวน node ในกราฟ
- แถวและคอลัมน์แทน node แต่ละตัว ส่วนช่องในเมทริกซ์แทนการเชื่อมต่อ (edge) ระหว่าง node
- หากใส่ "น้ำหนัก" (link weight) ในแต่ละช่อง จะช่วยประเมินโครงสร้างควบคุมของโปรแกรมระหว่างทดสอบได้

### Control Structure Testing
- **Condition testing** – ทดสอบเงื่อนไขเชิงตรรกะภายในโมดูลโปรแกรม
- **Data flow testing** – เลือก path ทดสอบตามตำแหน่งที่มีการกำหนดค่า (definition) และการใช้งาน (use) ของตัวแปรในโปรแกรม

### Loop Testing
ประเภทของ loop: Simple, Nested, Concatenated, Unstructured

**Simple Loop** – เงื่อนไขขั้นต่ำที่ต้องทดสอบ (n = จำนวนรอบสูงสุดที่อนุญาต):
1. ข้าม loop ไปเลย (0 รอบ)
2. ผ่าน loop 1 รอบ
3. ผ่าน loop 2 รอบ
4. ผ่าน loop m รอบ โดย m < n
5. ผ่าน loop (n-1), n, และ (n+1) รอบ

**Nested Loop** – แนวทางทดสอบ:
1. เริ่มจาก loop ในสุด ตั้งค่า loop ภายนอกทั้งหมดเป็นค่าต่ำสุด
2. ทดสอบ loop ในสุดที่ min+1, typical, max-1, max โดยคง loop ภายนอกไว้ที่ค่าต่ำสุด
3. ขยับออกทีละชั้น loop ทำซ้ำแบบเดียวกัน โดยคง loop อื่นไว้ที่ค่าปกติ จนครบทุกชั้นจนถึง loop นอกสุด
- หาก loop เป็นอิสระจากกัน ให้ทดสอบแบบ simple loop แยกกันได้ แต่ถ้าไม่อิสระ (เช่น ค่าตัวนับสุดท้ายของ loop 1 ใช้ตั้งต้น loop 2) ต้องทดสอบแบบ nested loop

---

## Black-Box Testing
มุ่งหาข้อผิดพลาดในกลุ่มต่อไปนี้:
1. ฟังก์ชันที่ผิดพลาดหรือขาดหายไป
2. ข้อผิดพลาดที่ interface
3. ข้อผิดพลาดในโครงสร้างข้อมูลหรือการเข้าถึงฐานข้อมูลภายนอก
4. ข้อผิดพลาดด้านพฤติกรรมหรือประสิทธิภาพ
5. ข้อผิดพลาดช่วงเริ่มต้นและสิ้นสุดการทำงาน

### Equivalence Partitioning
- แบ่ง input domain ของโปรแกรมออกเป็นกลุ่ม (class) ของข้อมูล เพื่อใช้อ้างอิงในการออกแบบ test case
- ตัวอย่าง equivalence class: คำสั่งที่ผู้ใช้ป้อน, การตอบสนอง prompt ของระบบ, ชื่อไฟล์, ข้อมูลคำนวณ, พารามิเตอร์ทางกายภาพ, ค่าขอบเขต, ค่าตั้งต้น, รูปแบบข้อมูล output, การตอบสนองข้อความ error, ข้อมูลกราฟิก ฯลฯ — แบ่งเป็นข้อมูลที่ valid และ invalid

### Boundary Value Analysis (BVA)
- ข้อผิดพลาดมักเกิดที่ **ขอบเขต (boundary)** ของ input domain มากกว่าตรงกลาง
- จึงควรออกแบบ test case ที่ทดสอบค่าขอบเขตโดยเฉพาะ

---

## Object-Oriented Testing (OOT)

### แนวทางออกแบบ Test Case ของ Berard
1. แต่ละ test case ต้องมี ID เฉพาะและเชื่อมโยงกับ class ที่จะทดสอบอย่างชัดเจน
2. ระบุจุดประสงค์ของการทดสอบ
3. รายการขั้นตอนทดสอบต้องประกอบด้วย:
   - สถานะ (state) ของ object ที่จะทดสอบ
   - รายการ message และ operation ที่จะถูกใช้งาน
   - รายการ exception ที่อาจเกิดขึ้น
   - เงื่อนไขภายนอกที่ต้องมีเพื่อทดสอบได้ถูกต้อง
   - ข้อมูลเสริมที่ช่วยความเข้าใจหรือการดำเนินการทดสอบ

### วิธีการทดสอบอื่น ๆ
- **Fault-based testing** – มองหาข้อบกพร่องที่อาจเกิดขึ้นได้จริง (plausible faults) แล้วออกแบบ test case มาทดสอบ
- **Class Testing & Class Hierarchy** – การสืบทอด (inheritance) ไม่ได้ลดความจำเป็นในการทดสอบ derived class อย่างละเอียด แต่กลับทำให้การทดสอบซับซ้อนขึ้น
- **Scenario-Based Test Design** – เน้นสิ่งที่ "ผู้ใช้ทำ" ไม่ใช่สิ่งที่ "ผลิตภัณฑ์ทำ" โดยจับ task ผ่าน use-case แล้วนำมาสร้างเป็น test

### Random Testing
- ระบุ operation ที่ใช้กับ class นั้น กำหนดข้อจำกัดในการใช้งาน
- กำหนด minimum test sequence (ลำดับปฏิบัติการขั้นต่ำที่แสดงวงจรชีวิตของ object)
- สุ่มสร้างลำดับทดสอบที่หลากหลาย (แต่ valid) เพื่อทดสอบวงจรชีวิตของ instance ที่ซับซ้อนขึ้น

### Partition Testing
ลดจำนวน test case โดยแบ่งประเภท (คล้าย equivalence partitioning):
- **State-based** – แบ่งตามความสามารถในการเปลี่ยน state ของ class
- **Attribute-based** – แบ่งตาม attribute ที่ operation ใช้งาน
- **Category-based** – แบ่งตามหน้าที่ทั่วไปของแต่ละ operation

### Inter-Class Testing
1. สำหรับแต่ละ client class ใช้รายการ operator สร้างลำดับทดสอบแบบสุ่ม ซึ่งจะส่ง message ไปยัง server class อื่น
2. สำหรับแต่ละ message ที่เกิดขึ้น ระบุ collaborator class และ operator ที่สอดคล้องใน server object
3. สำหรับแต่ละ operator ใน server object ที่ถูกเรียก ให้ระบุ message ที่มันส่งต่อ
4. ทำซ้ำเพื่อระบุ operator ระดับถัดไปที่ถูกเรียก แล้วรวมเข้าในลำดับทดสอบ

### Behavior Testing
- ใช้ **State Diagram** (เช่นตัวอย่าง Account class: empty → open → setup acct → working acct → nonworking acct → dead) เพื่อออกแบบ test
- เป้าหมาย: test ต้อง achieve **all state coverage** คือลำดับ operation ต้องทำให้ object เปลี่ยนผ่าน (transition) ครบทุก state ที่เป็นไปได้