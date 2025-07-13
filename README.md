# LuckSeeker - LINE Chatbot สำหรับดูดวงภาษาไทย
- LINE chatbot with LIFF app สำหรับดูดวงโหราศาสตร์ในภาษาไทย พร้อมการวิเคราะห์ Birth Chart และทำนายโชคลาภ 4 หมวด

# Webhook
- https://bf10-2a09-bac5-56bf-1d0f-00-2e5-56.ngrok-free.app

## ✨ Features

- 🌟 **LIFF App**: กรอกข้อมูลเกิด (วันเกิด, เวลา, สถานที่)
- 📊 **Birth Chart**: สร้าง Birth Chart จาก Swiss Ephemeris Library
- 🤖 **AI Fortune Telling**: ใช้ ChatGPT/Claude API วิเคราะห์ดวง
- 🎯 **4 หมวดโชคลาภ**: ซื้อหวย, พบรัก, ดวงธุรกิจ, ย้ายงาน
- 🇹🇭 **ภาษาไทย**: ตอบกลับทั้งหมดเป็นภาษาไทย
- 📱 **LINE Integration**: ใช้งานผ่าน LINE Messenger
- 💬 **Text Commands**: รองรับคำสั่งพิมพ์ (วันเกิด, ซื้อหวย, พบรัก, ดวงธุรกิจ, ย้ายงาน, ลบ)
- 🎯 **Quota System**: จำกัดการใช้งาน 10 ครั้งต่อผู้ใช้

## 🏗️ Architecture

```
User Input (LIFF) → Birth Chart Calculation → AI Analysis → Thai Response
```

1. ผู้ใช้กรอกข้อมูลผ่าน LIFF app
2. ระบบสร้าง Birth Chart จาก Swiss Ephemeris
3. ส่งข้อมูล Birth Chart + System Prompt ไปยัง AI
4. AI วิเคราะห์และตอบกลับเป็นภาษาไทย

## 📋 Prerequisites

- Node.js (v16+)
- LINE Developer Account
- OpenAI API Key หรือ Anthropic API Key
- Swiss Ephemeris data files (optional for better accuracy)

## 🚀 Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd LuckSeeker
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env
```

4. **Configure .env file**
```env
# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
LIFF_ID=your_liff_id

# AI API Configuration
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Swiss Ephemeris Configuration
SWISSEPH_EPHE_PATH=./ephe

# Server Configuration
PORT=3000
NODE_ENV=development
```

5. **Download Swiss Ephemeris data (optional)**
```bash
# Download essential ephemeris files to ephe/ directory
# See ephe/README.md for download links and instructions
```

6. **Start development server**
```bash
npm run dev
```

## 🔧 LINE Bot Setup

### 1. Create LINE Bot
1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Provider และ Channel (Messaging API)
3. ได้ Channel Access Token และ Channel Secret

### 2. Create LIFF App
1. ใน Channel settings ไปที่ LIFF tab
2. สร้าง LIFF app ใหม่:
   - Endpoint URL: `https://your-domain.com/liff`
   - Size: Full
   - Features: ✅ BLE, Scan QR Code
3. ได้ LIFF ID

### 3. Set Webhook URL
- Webhook URL: `https://your-domain.com/webhook`
- ✅ Enable webhook
- ✅ Auto-reply messages: Disabled

## 📱 Usage Flow

### 1. User Experience
```
User: "สวัสดี" 
Bot: แสดง welcome message + ปุ่ม "กรอกข้อมูลเกิด"

User: กด "กรอกข้อมูลเกิด"
→ เปิด LIFF app

User: กรอกข้อมูล (เพศ, วันเกิด, เวลา, สถานที่)
→ ส่งข้อมูลกลับ chat

Bot: แสดงปุ่มเลือก 4 หมวดโชคลาภ
- 🎰 ซื้อหวย
- 💕 พบรัก  
- 💼 ดวงธุรกิจ
- 🔄 ย้ายงาน

User: เลือกหมวด
Bot: วิเคราะห์และตอบผลการดูดวง
```

### 2. Response Format
```
────────────────────
**ช่วงเวลา** : 18 มิ.ย. 2025 20:25-20:30
**Lucky-Score** : 84 / 100  ✅ เหนือเกณฑ์  
**ดาวจรเด่น** : Jupiter Trine Sun (29°) | Venus Sextile Moon (14°)  
**เลขเด็ด** :  
- 29  (Jupiter 29° Trine Sun)  
- 2914  (รวมองศา Jupiter 29° + Venus 14°)  
**คําแนะนํา** : โอกาสดีจากมุม Trine ของดาวโชคลาภ...
────────────────────
```

## 🔧 Development

### Project Structure
```
src/
├── config/           # Configuration
├── controllers/      # LINE webhook controller
├── services/         # Business logic
│   ├── birthChartService.js    # Birth chart generation
│   ├── fortuneService.js       # Fortune telling logic
│   └── aiService.js           # AI integration
├── utils/           # Utilities
└── index.js         # Server entry point

public/
└── index.html       # LIFF app interface
```

### Available Scripts
```bash
npm start       # Production server
npm run dev     # Development with nodemon
npm test        # Run tests
```

## 🤖 AI Integration

### System Prompt
ระบบใช้ System Prompt ที่ออกแบบเฉพาะเพื่อ:
- กำหนด Role เป็น "น้องลักกี้ หมอดูโหราศาสตร์"
- ห้ามตอบคลุมเครือ/สุ่มตัวเลข
- อ้างอิงหลักโหราศาสตร์จริง
- ตอบตาม Response Format ที่กำหนด

### Lucky Score Calculation
```javascript
// คะแนนจาก Transit aspects
Conjunction: +40
Trine: +30  
Sextile: +20
Square: -30
Opposition: -40

// รวมคะแนน → รีสเกล 0-100
// ถ้า ≥ 80 → แสดงเลขเด็ด
// ถ้า < 80 → ไม่แนะนำเสี่ยง
```

## 🔒 Security Notes

- ไม่เก็บข้อมูลส่วนตัวของผู้ใช้
- API Keys ต้องเก็บใน environment variables
- ใช้ HTTPS สำหรับ production
- Validate input data ก่อนส่งไปยัง external APIs

## 📊 Monitoring & Logs

- ใช้ console.log สำหรับ development
- Production ควรใช้ proper logging library
- Monitor API usage และ rate limits

## 🚀 Deployment

### Recommended Platforms
- **Heroku**: ง่ายสำหรับ prototype
- **Railway**: Modern deployment
- **DigitalOcean**: VPS control
- **AWS/GCP**: Enterprise scale

### Environment Variables
ตรวจสอบว่า production environment มี:
- ✅ LINE_CHANNEL_ACCESS_TOKEN
- ✅ LINE_CHANNEL_SECRET  
- ✅ LIFF_ID
- ✅ OPENAI_API_KEY หรือ ANTHROPIC_API_KEY
- ✅ PORT (Heroku จะ set automatic)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Swiss Ephemeris](https://github.com/marcmarine/swisseph-api) for birth chart calculations
- [LINE Messaging API](https://developers.line.biz/) for chat platform
- [OpenAI](https://openai.com/) & [Anthropic](https://anthropic.com/) for AI capabilities