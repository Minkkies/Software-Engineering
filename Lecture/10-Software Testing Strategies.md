# สรุป: Software Testing Strategies

## 1. Software Testing คืออะไร
การทดสอบ (Testing) คือกระบวนการรันโปรแกรมโดยมีเจตนาเฉพาะเพื่อ **ค้นหาข้อผิดพลาด (errors)** ก่อนส่งมอบให้ผู้ใช้งาน

## 2. สิ่งที่การทดสอบแสดงให้เห็น
- ข้อผิดพลาด (errors)
- ความสอดคล้องกับข้อกำหนด (requirements conformance)
- ประสิทธิภาพ (performance)
- เป็นตัวบ่งชี้คุณภาพ (indication of quality)

## 3. ใครเป็นผู้ทดสอบซอฟต์แวร์
| ผู้พัฒนา (Developer) | ผู้ทดสอบอิสระ (Independent Tester) |
|---|---|
| เข้าใจระบบดี แต่ทดสอบแบบ "เบามือ" | ต้องเรียนรู้ระบบใหม่ แต่พยายาม "ทำให้พัง" |
| ขับเคลื่อนด้วยการส่งมอบ (delivery) | ขับเคลื่อนด้วยคุณภาพ (quality) |

## 4. กลยุทธ์การทดสอบ (Testing Strategy)
เริ่มจาก "testing-in-the-small" ไปสู่ "testing-in-the-large" ตามลำดับ:
1. Unit Test
2. Integration Test
3. Validation Test
4. System Test

- **ซอฟต์แวร์แบบดั้งเดิม (Conventional):** เริ่มจากโมดูล (module/component) แล้วค่อยรวม (integration)
- **ซอฟต์แวร์เชิงวัตถุ (OO):** หน่วยทดสอบย่อยเปลี่ยนจากโมดูลเป็น "คลาส" ที่รวม attributes, operations และการสื่อสาร/ความร่วมมือระหว่างคลาส

## 5. Unit Testing
ทดสอบสิ่งต่าง ๆ ภายในโมดูลเดี่ยว:
- interface
- โครงสร้างข้อมูลภายใน (local data structures)
- เงื่อนไขขอบเขต (boundary conditions)
- เส้นทางการทำงานที่เป็นอิสระ (independent paths)
- เส้นทางการจัดการข้อผิดพลาด (error handling paths)

**Unit Test Environment** ประกอบด้วย:
- **Driver** — โปรแกรมจำลองที่เรียกใช้โมดูลที่ทดสอบ
- **Stub** — โปรแกรมจำลองแทนโมดูลย่อยที่โมดูลหลักเรียกใช้
- โมดูลที่ทดสอบ (module to be tested) อยู่ตรงกลาง รับ test cases และให้ผลลัพธ์ (results)

## 6. กลยุทธ์การ Integration Testing
มี 2 แนวทางหลัก:
- **Big Bang** — รวมทุกโมดูลพร้อมกันทีเดียว
- **Incremental Construction** — ค่อย ๆ รวมทีละส่วน ซึ่งแบ่งเป็น:

### Top-Down Integration
ทดสอบโมดูลบนสุดก่อนด้วย stubs แล้วแทนที่ stub ทีละตัวแบบ "depth-first" เมื่อรวมโมดูลใหม่จะรัน test บางส่วนซ้ำ

### Bottom-Up Integration
แทนที่ driver ทีละตัวแบบ "depth-first" โดยจัดกลุ่มโมดูลย่อย (worker modules) เป็น cluster แล้วค่อยรวมกัน

### Sandwich Testing
ผสมทั้งสองแบบ: โมดูลบนทดสอบด้วย stubs ส่วนโมดูลล่างจัดกลุ่มเป็น build แล้วรวมกัน

## 7. OOT Strategy (Object-Oriented Testing)
- **Class testing** เทียบเท่ากับ unit testing — ทดสอบ operations ภายในคลาส และพฤติกรรมสถานะ (state behavior)
- กลยุทธ์การรวม (integration) มี 3 แบบ:
  - **Thread-based testing** — รวมชุดคลาสที่ตอบสนองต่อ 1 input/event
  - **Use-based testing** — รวมชุดคลาสที่ตอบสนองต่อ 1 use case
  - **Cluster testing** — รวมชุดคลาสที่แสดงความร่วมมือ (collaboration) หนึ่งชุด

## 8. Smoke Testing
แนวทางทั่วไปสำหรับสร้าง "daily build":
1. รวม component ที่แปลงเป็นโค้ดแล้วเข้าเป็น "build" (รวมถึงไฟล์ข้อมูล, ไลบรารี, โมดูลที่นำกลับมาใช้)
2. ออกแบบชุดทดสอบเพื่อค้นหาข้อผิดพลาดที่จะทำให้ build ทำงานไม่ได้ โดยเน้นหา "show stopper" ที่มีโอกาสทำให้โครงการล่าช้า
3. รวม build เข้ากับ build อื่น ๆ และทดสอบ smoke ทั้งผลิตภัณฑ์ทุกวัน (แนวทางรวมอาจเป็น top-down หรือ bottom-up)

## 9. High Order Testing
- **Validation testing** — เน้นข้อกำหนดซอฟต์แวร์ (requirements)
- **System testing** — เน้นการรวมระบบ (system integration)
- **Alpha/Beta testing** — เน้นการใช้งานจริงของลูกค้า
- **Recovery testing** — บังคับให้ซอฟต์แวร์ล้มเหลวหลายรูปแบบ เพื่อตรวจสอบการกู้คืน
- **Security testing** — ตรวจสอบกลไกป้องกันการบุกรุก
- **Stress testing** — รันระบบโดยเรียกร้องทรัพยากรในปริมาณ/ความถี่ผิดปกติ
- **Performance testing** — ทดสอบประสิทธิภาพขณะรันภายในระบบที่รวมกันแล้ว

## 10. Debugging: กระบวนการวินิจฉัย
Debugging คือกระบวนการที่รับ test cases และผลลัพธ์ (results) เข้ามา แล้วหาสาเหตุที่สงสัย (suspected causes) → สาเหตุที่ยืนยันแล้ว (identified causes) → การแก้ไข (corrections) → regression tests → test cases ใหม่

**ความพยายามในการ Debug** แบ่งเป็น 2 ส่วน:
- เวลาที่ใช้วินิจฉัยอาการและหาสาเหตุ
- เวลาที่ใช้แก้ไขข้อผิดพลาดและทำ regression test

## 11. อาการ (Symptom) กับสาเหตุ (Cause)
- อาการกับสาเหตุอาจอยู่ห่างกันคนละจุด (geographically separated)
- อาการอาจหายไปเมื่อแก้ปัญหาอื่น
- สาเหตุอาจเกิดจากหลายสิ่งที่ไม่ใช่ error รวมกัน
- สาเหตุอาจเกิดจาก error ของระบบหรือ compiler
- สาเหตุอาจเกิดจากสมมติฐานที่ทุกคนเชื่อว่าถูกต้อง
- อาการอาจเกิดเป็นบางครั้ง (intermittent)

## 12. ผลกระทบจากบั๊ก (Consequences of Bugs)
ระดับความเสียหาย: mild → annoying → disturbing → serious → extreme → catastrophic → infectious

**ประเภทของบั๊ก:** function-related, system-related, data bugs, coding bugs, design bugs, documentation bugs, standards violations ฯลฯ

## 13. เทคนิคการ Debug
- Brute force / testing
- Backtracking
- Cause elimination

## 14. ข้อคิดสุดท้ายเรื่อง Debugging
1. อย่ารีบสรุป ให้คิดถึงอาการที่เห็นก่อน
2. ใช้เครื่องมือ (เช่น dynamic debugger) เพื่อให้เข้าใจปัญหามากขึ้น
3. หากติดขัด ให้ขอความช่วยเหลือจากผู้อื่น
4. ต้องทำ regression test ทุกครั้งหลัง "แก้" บั๊กแล้ว
