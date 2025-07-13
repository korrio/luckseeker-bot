# LuckSeeker - LINE Chatbot สำหรับดูดวงภาษาไทย

🌟 **Production URL**: https://hora.aq1.co

LuckSeeker เป็น LINE chatbot ที่ใช้ AI (ChatGPT/Claude/Ollama) ในการดูดวงโหราศาสตร์ไทย พร้อมระบบ LIFF สำหรับกรอกข้อมูลเกิดและการคำนวณ Birth Chart แบบแม่นยำ

## ✨ คุณสมบัติหลัก

- 🤖 **Multi-AI Support**: ChatGPT, Claude, และ Ollama (Gemma3)
- 🎯 **4 หมวดดวง**: ซื้อหวย, พบรัก, ดวงธุรกิจ, ย้ายงาน
- 💬 **Text Commands**: พิมพ์คำสั่งได้โดยตรง
- 🎯 **Quota System**: 10 ครั้งต่อผู้ใช้ พร้อมแสดงสถานะ
- 🏠 **Welcome System**: ต้อนรับผู้ใช้ใหม่แบบ TuneHora
- 🌍 **Production Ready**: Deploy บน hora.aq1.co
- 🐳 **Docker Support**: รองรับ containerization

## 🚀 เริ่มต้นใช้งาน

### Development
```bash
git clone https://github.com/korrio/luckseeker-bot.git
cd luckseeker-bot
npm install
cp .env.example .env
# แก้ไข .env ตามการตั้งค่าของคุณ
npm run dev
```

### Production (Docker)
```bash
docker-compose up -d
```

### Cloudflare Workers
```bash
npm run worker:deploy
```

## 📚 เอกสาร

เอกสารทั้งหมดอยู่ในโฟลเดอร์ [`docs/`](./docs/README.md)

### เอกสารหลัก
- **[Project Overview](./docs/project-overview.md)** - ข้อมูลโครงการทั้งหมด
- **[Installation Guide](./docs/installation.md)** - คู่มือติดตั้ง
- **[Deployment Guide](./docs/deployment.md)** - คู่มือ deployment

### คุณสมบัติ
- **[Quota System](./docs/quota-system.md)** - ระบบจำกัดการใช้งาน
- **[Text Commands](./docs/text-commands.md)** - คำสั่งพิมพ์
- **[Welcome System](./docs/welcome-system.md)** - ระบบต้อนรับ

### Technical
- **[Nginx Deployment](./docs/nginx-deployment.md)** - Nginx reverse proxy
- **[Cloudflare Worker](./docs/cloudflare-worker.md)** - Serverless deployment
- **[Rich Messages](./docs/rich-message.md)** - Flex message implementation

## 🔗 ลิงก์สำคัญ

- **Production**: https://hora.aq1.co
- **Repository**: https://github.com/korrio/luckseeker-bot
- **Documentation**: [./docs/](./docs/README.md)
- **LINE Developers**: https://developers.line.biz/

## 📄 License

MIT License - ดูรายละเอียดใน LICENSE file

---

สำหรับข้อมูลเพิ่มเติม โปรดดูที่ [เอกสารฉบับเต็ม](./docs/README.md)