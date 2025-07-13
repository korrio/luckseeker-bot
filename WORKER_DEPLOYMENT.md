# Cloudflare Worker Deployment - Quick Guide

## การแก้ไขปัญหา Build Errors

ได้แก้ไขปัญหา Node.js modules conflicts แล้วโดยสร้างเวอร์ชันใหม่ที่เหมาะสำหรับ Cloudflare Workers

## ไฟล์ที่สำคัญ

### 1. `src/worker-entry.js` - Main Worker Entry Point
- ใช้แทน `src/worker.js` เดิม
- รองรับ LINE webhook, LIFF, และ static pages
- ไม่มี dependency conflicts

### 2. `src/utils/worker-polyfills.js` - Worker Polyfills
- แทนที่ Node.js modules ด้วย Worker-compatible alternatives
- WorkerFS สำหรับ KV storage
- WorkerPath สำหรับ path operations

### 3. `src/controllers/lineController-worker.js` - Simplified LINE Controller
- เวอร์ชันง่ายที่ทำงานใน Worker environment
- รองรับ basic features: greeting, postback, fortune responses

## Requirements

- **Node.js v20.0.0 ขึ้นไป** (สำหรับ Wrangler v4+)
- **Cloudflare Account** (ฟรี)
- **Wrangler CLI**

## การติดตั้งและ Deploy

### 1. อัพเกรด Node.js (ถ้าจำเป็น)

```bash
# ใช้ nvm (แนะนำ)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20

# หรือใช้ Volta
curl https://get.volta.sh | bash
volta install node@20
```

### 2. Login Cloudflare

```bash
npx wrangler login
```

### 3. ตั้งค่า Environment Variables

```bash
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
npx wrangler secret put LINE_CHANNEL_SECRET
npx wrangler secret put LIFF_ID
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
```

### 4. Deploy

```bash
# Development
npm run worker:dev

# Production
npm run worker:deploy

# Staging
npm run worker:deploy:staging
```

## ฟีเจอร์ใน Worker Version

### ✅ รองรับแล้ว
- Basic LINE webhook handling
- Welcome messages
- Postback responses
- LIFF integration
- Static pages (/, /liff, /health)
- KV storage for data persistence

### 🔄 ต้องพัฒนาเพิ่ม (Phase 2)
- Full AI service integration (OpenAI, Claude, Ollama)
- Complete birth chart calculations
- Quota system
- Advanced fortune telling features

## URLs หลัง Deploy

- **Worker URL**: `https://luckseeker-bot.your-subdomain.workers.dev`
- **Webhook**: `https://luckseeker-bot.your-subdomain.workers.dev/webhook`
- **LIFF**: `https://luckseeker-bot.your-subdomain.workers.dev/liff`
- **Health**: `https://luckseeker-bot.your-subdomain.workers.dev/health`

## การตั้งค่า LINE

1. ไปที่ [LINE Developers Console](https://developers.line.biz)
2. เลือก Channel ของคุณ
3. ไปที่ Messaging API settings
4. อัพเดต Webhook URL เป็น: `https://your-worker-url.workers.dev/webhook`
5. เปิดใช้งาน Webhook

## การ Monitor

```bash
# ดู logs แบบ real-time
npm run worker:logs

# ดู analytics ใน Cloudflare Dashboard
```

## ข้อดีของ Worker Version

✅ **Performance**: ความเร็วสูง, latency ต่ำ  
✅ **Cost**: ฟรีสำหรับ 100k requests/day  
✅ **Scalability**: Auto-scaling ไม่จำกัด  
✅ **Reliability**: Global edge network  
✅ **Zero Cold Start**: ไม่มี container warmup  

## การแก้ปัญหา

### Worker ไม่ตอบสนอง
```bash
# ตรวจสอบ logs
npm run worker:logs

# ทดสอบ health endpoint
curl https://your-worker-url.workers.dev/health
```

### KV Storage Error
1. ตรวจสอบ KV namespace ใน wrangler.toml
2. ตรวจสอบ binding name: `LUCKSEEKER_KV`

### LINE Webhook Error
1. ตรวจสอบ signature verification
2. ตรวจสอบ environment variables
3. ทดสอบด้วย `/test` endpoint

## Next Steps

1. **Deploy Basic Version**: ใช้ไฟล์ที่มีอยู่แล้ว
2. **Test Core Functions**: ทดสอบ webhook และ LIFF
3. **Add AI Services**: เพิ่ม OpenAI/Claude integration
4. **Implement Full Features**: quota, birth chart calculations
5. **Optimize Performance**: caching, error handling

## คำสั่งสำคัญ

```bash
# Local development
npm run worker:dev

# Deploy to production
npm run worker:deploy

# Monitor logs
npm run worker:logs

# Manage secrets
npx wrangler secret list
npx wrangler secret put SECRET_NAME
npx wrangler secret delete SECRET_NAME

# Manage KV
npx wrangler kv:namespace list
npx wrangler kv:key list --binding LUCKSEEKER_KV
npx wrangler kv:key put "key" "value" --binding LUCKSEEKER_KV
```

Worker version พร้อมใช้งานแล้ว! 🚀