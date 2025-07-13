# Category Selection - Additional Information Requirements

## สิ่งที่ต้องถาม User เพิ่มเพื่อนำมาใช้ในการคำนวณดวง

### 1. ซื้อหวย 🎲
- **ข้อมูลเพิ่มเติม**: ไม่ต้องถาม user เพิ่ม
- **เหตุผล**: ใช้ข้อมูลเกิดพื้นฐานเพียงพอสำหรับการคำนวณ
- **การประมวลผล**: วิเคราะห์จากตำแหน่งดาวจรและ transit ปัจจุบัน

### 2. ดวงธุรกิจ 💼
- **ข้อมูลเพิ่มเติม**: ถามเวลาและสถานที่นัดหมาย
- **รายละเอียดที่ต้องถาม**:
  - วันและเวลาที่จะมีการนัดหมายธุรกิจ
  - สถานที่หรือเมืองที่จะมีการนัดหมาย
  - ประเภทธุรกิจที่จะเจรจา (ถ้ามี)
- **เหตุผล**: การคำนวณ electional astrology ต้องใช้เวลาและสถานที่เพื่อหาช่วงเวลาที่เหมาะสม

### 3. พบรัก 💕
- **ข้อมูลเพิ่มเติม**: ถามวันเกิดของคู่รัก
- **รายละเอียดที่ต้องถาม**:
  - วันเกิดของคู่รัก (วัน/เดือน/ปี)
  - เวลาเกิดของคู่รัก (ถ้ามี)
  - สถานที่เกิดของคู่รัก (ถ้ามี)
- **เหตุผล**: การวิเคราะห์ compatibility ต้องเปรียบเทียบแผนภูมิเกิดของทั้งสองคน (synastry)

### 4. ยายงาน/ย้ายบ้าน 🏠
- **ข้อมูลเพิ่มเติม**: ถามพิกัด ช่วงเวลา และชื่อสถานที่
- **รายละเอียดที่ต้องถาม**:
  - สถานที่ปลายทาง (เมือง/จังหวัด/ประเทศ)
  - ช่วงเวลาที่วางแผนจะย้าย
  - ประเภทงาน/บ้านใหม่ (ถ้ามี)
- **ทางเลือก**: อาจให้ user share location กลับมา
- **เหตุผล**: การ relocation astrology ต้องคำนวณผลกระทบจากการเปลี่ยนพิกัดภูมิศาสตร์

## Implementation Guidelines

### การออกแบบ User Flow

1. **Initial Category Selection**: User เลือกหมวดโชคลาภ
2. **Conditional Questions**: ระบบถามข้อมูลเพิ่มเติมตามหมวดที่เลือก
3. **Data Validation**: ตรวจสอบความถูกต้องของข้อมูล
4. **Fortune Analysis**: วิเคราะห์โชคลาภด้วยข้อมูลครบถ้วน

### การจัดเก็บข้อมูล

```javascript
// Data structure for additional information
{
  userId: "U1234567890abcdef",
  category: "business",
  additionalData: {
    meetingDate: "2024-01-15",
    meetingTime: "14:30",
    location: "Bangkok, Thailand",
    businessType: "Investment"
  }
}
```

### User Experience Considerations

- **Progressive Disclosure**: แสดงคำถามเพิ่มเติมเฉพาะเมื่อจำเป็น
- **Smart Defaults**: ใช้ข้อมูลเดิมที่เคยกรอกไว้
- **Optional Fields**: บางข้อมูลอาจเป็น optional แต่จะเพิ่มความแม่นยำ
- **Quick Actions**: ให้ตัวเลือกง่ายๆ เช่น "วันนี้", "พรุ่งนี้"

## Technical Implementation

### Webhook Handling
```javascript
async function handleCategorySelection(userId, category) {
  switch(category) {
    case 'lottery':
      // ไม่ต้องถามเพิ่ม ดำเนินการทันที
      return await processFortuneRequest(userId, category);
    
    case 'business':
      // ถามข้อมูลการนัดหมาย
      return await askBusinessDetails(userId);
    
    case 'love':
      // ถามข้อมูลคู่รัก
      return await askPartnerDetails(userId);
    
    case 'relocation':
      // ถามข้อมูลสถานที่ใหม่
      return await askLocationDetails(userId);
  }
}
```

### Data Collection Forms
- **Quick Reply Buttons**: สำหรับตัวเลือกที่จำกัด
- **Text Input**: สำหรับข้อมูลอิสระ เช่น วันที่
- **Location Sharing**: สำหรับข้อมูลพิกัด
- **LIFF Forms**: สำหรับข้อมูลซับซ้อน

## Validation Rules

### วันที่และเวลา
- ตรวจสอบรูปแบบ (DD/MM/YYYY, HH:MM)
- ตรวจสอบความสมเหตุสมผล (ไม่เป็นอดีตเกินไป)
- แปลงเป็น UTC สำหรับการคำนวณ

### ข้อมูลสถานที่
- ตรวจสอบชื่อเมือง/จังหวัด
- แปลงเป็นพิกัด latitude/longitude
- ใช้ timezone ที่ถูกต้อง

### ข้อมูลบุคคล
- ตรวจสอบรูปแบบวันเกิด
- ตรวจสอบความสมเหตุสมผลของอายุ
- เก็บข้อมูลส่วนตัวอย่างปลอดภัย

## Error Handling

- **Invalid Data**: แสดงข้อผิดพลาดและขอข้อมูลใหม่
- **Missing Optional Data**: ดำเนินการต่อด้วยการเตือน
- **Timeout**: จัดเก็บข้อมูลบางส่วนและให้กลับมาทำต่อ
- **Server Error**: แสดงข้อความเป็นมิตรและขอลองใหม่

## Future Enhancements

### Smart Suggestions
- เสนอเวลาที่เหมาะสมสำหรับการนัดหมาย
- แนะนำสถานที่ที่เหมาะกับดวงชะตา
- เตือนช่วงเวลาที่ดีสำหรับการตัดสินใจสำคัญ

### Historical Data
- เก็บประวัติการถามข้อมูลเพิ่มเติม
- ใช้ข้อมูลเก่าเป็น default values
- วิเคราะห์ pattern ของผู้ใช้

### Integration Options
- **Calendar Integration**: เชื่อมต่อกับปฏิทินส่วนตัว
- **Maps Integration**: ใช้ Google Maps API
- **Contact Integration**: ใช้ข้อมูลจากรายชื่อผู้ติดต่อ