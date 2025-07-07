เปรียบเทียบคุณสมบัติ n8n Workflow

  🔵 เวอร์ชันเต็ม (n8n-workflow.json)

  คุณสมบัติหลัก:
  1. Code Node (JavaScript) - ใช้โค้ดเต็มรูปแบบ
  2. Swiss Ephemeris Integration - คำนวณ Birth Chart จริง
  3. File-based Database - บันทึกข้อมูลในไฟล์ JSON
  4. Caching System - ระบบแคชป้องกันเรียก AI ซ้ำ
  5. Transit Calculation - คำนวณดาวจรและ Lucky Score
  6. Flex Message - ข้อความแบบ Rich Content
  7. Error Handling - จัดการข้อผิดพลาดครบถ้วน
  8. Environment Variables - ใช้ตัวแปรสภาพแวดล้อม

  ฟีเจอร์เพิ่มเติม:
  - ✅ บันทึก Birth Chart ถาวร
  - ✅ คำนวณมุมดาว (Aspects) แม่นยำ
  - ✅ Lucky Score จากดาวจรจริง
  - ✅ แคชผลลัพธ์ 1 ชั่วโมง
  - ✅ LIFF URL พร้อม parameters
  - ✅ Multi-step validation

  ข้อจำกัด:
  - ❌ ต้องติดตั้ง dependencies เพิ่ม
  - ❌ Code Node อาจไม่ทำงานในบาง n8n instance
  - ❌ ต้องตั้งค่า file permissions

  🟢 เวอร์ชันง่าย (n8n-workflow-simple.json)

  คุณสมบัติหลัก:
  1. Function Node - ใช้โค้ดแบบง่าย
  2. Basic Conditions - เงื่อนไขพื้นฐาน
  3. HTTP Request - เรียก API ตรง
  4. Simple Messages - ข้อความ text ธรรมดา
  5. Direct Flow - ขั้นตอนตรงไปตรงมา

  ฟีเจอร์หลัก:
  - ✅ ติดตั้งง่าย ใช้ได้ทันที
  - ✅ ไม่ต้องพึ่ง external libraries
  - ✅ ทำงานได้ทุก n8n instance
  - ✅ แก้ไขปรับแต่งง่าย
  - ✅ เหมาะสำหรับ prototype

  ข้อจำกัด:
  - ❌ ไม่มีการคำนวณดาวจรจริง
  - ❌ ไม่มีระบบแคช
  - ❌ Lucky Score แบบ random
  - ❌ ไม่บันทึกข้อมูลถาวร
  - ❌ ข้อความแบบ text เท่านั้น

  📊 ตารางเปรียบเทียบ

  | ฟีเจอร์          | เวอร์ชันเต็ม   | เวอร์ชันง่าย  |
  |------------------|----------------|---------------|
  | Swiss Ephemeris  | ✅ มี           | ❌ ไม่มี       |
  | Database         | ✅ File JSON    | ❌ In-memory   |
  | Caching          | ✅ 1 ชั่วโมง    | ❌ ไม่มี       |
  | Lucky Score      | ✅ คำนวณจริง    | ⚠️ Random     |
  | Flex Message     | ✅ รองรับ       | ❌ Text only   |
  | LIFF Integration | ✅ สมบูรณ์      | ⚠️ พื้นฐาน    |
  | Error Handling   | ✅ ครบถ้วน      | ⚠️ พื้นฐาน    |
  | ติดตั้ง          | ⚠️ ซับซ้อน     | ✅ ง่าย        |
  | ความเข้ากันได้   | ⚠️ บางเวอร์ชัน | ✅ ทุกเวอร์ชัน |

  💡 คำแนะนำการเลือกใช้

  ใช้เวอร์ชันเต็ม เมื่อ:
  - ต้องการความแม่นยำในการคำนวณดวง
  - มี n8n instance ที่รองรับ Code Node
  - ต้องการระบบแคชและประสิทธิภาพสูง
  - ใช้งานจริง production

  ใช้เวอร์ชันง่าย เมื่อ:
  - ต้องการทดสอบ workflow เบื้องต้น
  - n8n instance มีข้อจำกัด
  - ต้องการแก้ไขปรับแต่งบ่อย
  - ใช้สำหรับ demo หรือ prototype