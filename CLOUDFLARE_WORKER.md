# Cloudflare Worker Deployment Guide

## ภาพรวม

LuckSeeker Bot สามารถ deploy บน Cloudflare Workers เพื่อให้มีความเร็วสูงและค่าใช้จ่ายต่ำ โดยใช้ edge computing และ global network ของ Cloudflare

## ข้อดีของ Cloudflare Workers

✅ **ความเร็วสูง**: Edge computing ทำให้ response time ต่ำ  
✅ **ราคาถูก**: Free tier ให้ 100,000 requests/day ฟรี  
✅ **Auto-scaling**: รองรับ traffic สูงแบบอัตโนมัติ  
✅ **Global CDN**: เซิร์ฟเวอร์ใกล้ผู้ใช้ทั่วโลก  
✅ **Zero cold start**: ไม่มีการรอเริ่มต้นเซิร์ฟเวอร์  

## ข้อกำหนดเบื้องต้น

1. **Cloudflare Account** - สมัครฟรีที่ [cloudflare.com](https://cloudflare.com)
2. **Node.js** - เวอร์ชัน 18 ขึ้นไป
3. **Wrangler CLI** - จะติดตั้งผ่าน npm

## การติดตั้งและตั้งค่า

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. Login เข้า Cloudflare

```bash
npx wrangler login
```

### 3. สร้าง KV Storage (สำหรับเก็บข้อมูล)

```bash
npm run worker:kv:create
```

จากนั้นอัพเดต `wrangler.toml` ด้วย KV namespace ID ที่ได้

### 4. ตั้งค่า Environment Variables

```bash
# LINE Configuration
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
npx wrangler secret put LINE_CHANNEL_SECRET  
npx wrangler secret put LIFF_ID

# AI Services
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put OLLAMA_BASE_URL
npx wrangler secret put OLLAMA_MODEL
```

## การ Deploy

### Deploy to Staging

```bash
npm run worker:deploy:staging
```

### Deploy to Production

```bash
npm run worker:deploy
```

### Development Mode

```bash
npm run worker:dev
```

## การใช้งาน

### URLs หลังจาก Deploy

- **หน้าแรก**: `https://luckseeker-bot.your-subdomain.workers.dev/`
- **Webhook**: `https://luckseeker-bot.your-subdomain.workers.dev/webhook`
- **LIFF App**: `https://luckseeker-bot.your-subdomain.workers.dev/liff`
- **Health Check**: `https://luckseeker-bot.your-subdomain.workers.dev/health`

### ตั้งค่า LINE Webhook URL

1. ไปที่ [LINE Developers Console](https://developers.line.biz)
2. เลือก Channel ของคุณ
3. ไปที่ Messaging API settings
4. อัพเดต Webhook URL เป็น: `https://your-worker-url.workers.dev/webhook`

## โครงสร้างไฟล์

```
├── src/
│   ├── worker.js              # Main Worker entry point
│   ├── index.js              # Original Express app (สำหรับ local dev)
│   └── ...                   # โค๊ดต่างๆ ตามเดิม
├── wrangler.toml             # Cloudflare Worker config
├── build-worker.js           # Build script สำหรับ Worker
└── dist/                     # Built files สำหรับ Worker
```

## คุณสมบัติใน Worker Version

### ✅ รองรับเต็มรูปแบบ
- LINE Webhook handling
- AI Services (OpenAI, Claude, Ollama)
- Birth chart calculations
- Quota system
- LIFF App integration
- Welcome messages

### 🔄 แตกต่างจาก Express Version
- ใช้ KV Storage แทน file system
- ไม่มี static file serving แบบดั้งเดิม (HTML embedded ใน Worker)
- Environment variables ผ่าน Cloudflare secrets

## การจัดการข้อมูล

### KV Storage
ข้อมูลทั้งหมดเก็บใน Cloudflare KV:
- `birthData.json` → KV key: `birthData_json`
- `userQuota.json` → KV key: `userQuota_json`
- `fortuneCache.json` → KV key: `fortuneCache_json`

### Backup & Restore
```bash
# Export ข้อมูลจาก KV
npx wrangler kv:key list --binding LUCKSEEKER_KV

# Import ข้อมูลเข้า KV
npx wrangler kv:key put "key_name" "value" --binding LUCKSEEKER_KV
```

## การ Monitor และ Debug

### ดู Logs แบบ Real-time
```bash
npm run worker:logs
```

### ดู Analytics
ไปที่ Cloudflare Dashboard → Workers → Analytics

### Debug ใน Development
```bash
npm run worker:dev
# Worker จะรันที่ http://localhost:8787
```

## การอัพเดต

### อัพเดตโค๊ด
```bash
# แก้ไขโค๊ดใน src/
npm run worker:deploy
```

### อัพเดต Environment Variables
```bash
npx wrangler secret put VARIABLE_NAME
```

### อัพเดต Configuration
แก้ไข `wrangler.toml` แล้ว deploy ใหม่

## Limitations ของ Cloudflare Workers

- **CPU Time**: 50ms สำหรับ free tier, 30s สำหรับ paid
- **Memory**: 128MB RAM
- **File Size**: 1MB per script
- **KV Storage**: 1GB free, จากนั้น $0.50/GB/month

## การแก้ปัญหา

### Worker ไม่ตอบสนอง
1. ตรวจสอบ logs: `npm run worker:logs`
2. ตรวจสอบ Environment Variables
3. ทดสอบ local: `npm run worker:dev`

### KV Storage ล้มเหลว
1. ตรวจสอบ KV namespace binding ใน `wrangler.toml`
2. ตรวจสอบ permissions ของ API token

### LINE Webhook ไม่ทำงาน
1. ตรวจสอบ Webhook URL ใน LINE Console
2. ตรวจสอบ Channel Secret และ Access Token
3. ทดสอบด้วย `/test` endpoint

## ค่าใช้จ่าย

### Cloudflare Workers Pricing
- **Free**: 100,000 requests/day
- **Paid ($5/month)**: 10M requests/month + CPU time เพิ่ม

### KV Storage Pricing  
- **Free**: 1GB storage, 100k reads/day, 1k writes/day
- **Paid**: $0.50/GB/month, $0.50/M reads, $5.00/M writes

สำหรับ LuckSeeker Bot ระดับปานกลาง (< 10k users) จะใช้ free tier ได้สบาย