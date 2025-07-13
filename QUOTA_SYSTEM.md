# ระบบ Quota - LuckSeeker Bot

## คุณสมบัติ

ระบบ quota ใช้ในการจำกัดการใช้งานการดูดวงของผู้ใช้ โดยแต่ละผู้ใช้จะมีสิทธิ์ดูดวงเริ่มต้น **4 ครั้ง**

## การทำงาน

### สำหรับผู้ใช้ทั่วไป

1. **สิทธิ์เริ่มต้น**: ผู้ใช้ใหม่จะได้รับสิทธิ์ดูดวง 4 ครั้ง
2. **การใช้สิทธิ์**: ทุกครั้งที่เรียกใช้ AI Service เพื่อดูดวง สิทธิ์จะลดลง 1 ครั้ง
3. **เมื่อหมดสิทธิ์**: จะแสดงข้อความแจ้งให้ติดต่อ Admin

### คำสั่งสำหรับผู้ใช้

- `quota` หรือ `admin:quotastatus` - ตรวจสอบสถานะสิทธิ์การใช้งาน

### คำสั่งสำหรับ Admin

- `admin:addquota:USER_ID:AMOUNT` - เพิ่มสิทธิ์ให้ผู้ใช้
  - ตัวอย่าง: `admin:addquota:U123456789:4` (เพิ่ม 4 สิทธิ์ให้ user U123456789)

## ไฟล์ที่เกี่ยวข้อง

### 1. Database (src/services/database.js)
- `getUserQuota(userId)` - ดึงข้อมูล quota ของผู้ใช้
- `checkUserQuota(userId)` - ตรวจสอบว่ามีสิทธิ์เหลือหรือไม่
- `decrementUserQuota(userId)` - ลดสิทธิ์ 1 ครั้ง
- `addUserQuota(userId, amount)` - เพิ่มสิทธิ์ให้ผู้ใช้
- `resetUserQuota(userId, amount)` - รีเซ็ตสิทธิ์ผู้ใช้

### 2. Fortune Service (src/services/fortuneService.js)
- ตรวจสอบ quota ก่อนเรียก AI Service
- ลด quota หลังจากเรียก AI Service สำเร็จ
- ส่งข้อความแจ้งเมื่อหมด quota

### 3. Line Controller (src/controllers/lineController.js)
- จัดการคำสั่ง admin สำหรับเพิ่ม quota
- จัดการคำสั่งตรวจสอบสถานะ quota
- ส่ง userId ไปยัง fortuneService

## โครงสร้างข้อมูล Quota

```json
{
  "userId": {
    "remainingQueries": 4,
    "totalQueries": 4,
    "usedQueries": 0,
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "resetDate": null
  }
}
```

## ตัวอย่างการใช้งาน

### ผู้ใช้ตรวจสอบสิทธิ์
```
User: quota
Bot: 📊 สถานะการใช้งานของคุณ
🔢 สิทธิ์คงเหลือ: 3 ครั้ง
📈 ใช้ไปแล้ว: 1 ครั้ง
💯 สิทธิ์ทั้งหมด: 4 ครั้ง
✅ ยังมีสิทธิ์ใช้งาน
```

### เมื่อหมดสิทธิ์
```
Bot: 🚫 หมดสิทธิ์การใช้งาน
ขออภัยค่ะ คุณได้ใช้สิทธิ์ดูดวงครบ 4 ครั้งแล้วในรอบนี้
📞 กรุณาติดต่อ Admin เพื่อดูดวงเพิ่มเติม
```

### Admin เพิ่มสิทธิ์
```
Admin: admin:addquota:U123456789:4
Bot: ✅ เพิ่ม quota สำเร็จ!
User ID: U123456789
เพิ่ม: 4 ครั้ง
คงเหลือ: 4 ครั้ง
รวมทั้งหมด: 8 ครั้ง
```

## การติดตั้งและใช้งาน

ระบบ quota จะเริ่มทำงานอัตโนมัติหลังจากการอัพเดท ไม่ต้องการการตั้งค่าเพิ่มเติม

ข้อมูล quota จะถูกเก็บในไฟล์ `data/userQuota.json`