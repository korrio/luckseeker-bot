const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { Ollama } = require('ollama');
const config = require('../config');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.ai.openaiApiKey,
    });
    
    this.anthropic = new Anthropic({
      apiKey: config.ai.anthropicApiKey,
    });
    
    this.ollama = new Ollama({
      host: config.ai.ollamaBaseUrl
    });
  }

  generateSystemPrompt(birthChart, category) {
    // - 🎯 **4 หมวดโชคลาภ**: ซื้อหวย, พบรัก, ดวงธุรกิจ, ย้ายงาน

    const getScoreName = (category) => {
      switch(category) {
        case 'พบรัก':
          return 'Love Score';
        case 'ดวงธุรกิจ':
        case 'ย้ายงาน':
          return 'Success Score';
        case 'ซื้อหวย':
        default:
          return 'Lucky Score';
      }
    
    };
    
    const scoreName = getScoreName(category) ? getScoreName(category) : 'Lucky Score';

    const luckyNumbers = category == 'ซื้อหวย' ? `🔢 เลขเด็ด (เฉพาะเมื่อ ${scoreName} ≥ 80):
- เลข 2 ตัว (3 ชุด): [ใช้องศาเต็มของดาวจรที่ได้คะแนนสูงสุด 3 ดวง เช่น 29, 14, 08]  
- เลข 3 ตัว (3 ชุด): สร้างจาก “เลขหลักหน่วย” ของ 3 องศาดาวเด่น → เรียงสลับเป็น 3 ชุด เช่น 948, 489, 849` : "";
    // Define score names based on category
    
    

//     const systemPrompt_old = `
// 🪄 ROLE
// คุณต้องพูดทักทาย ว่า สวัสดีคะ Seeker
// คุณคือ น้องลักกี้ – หมอดูโหราศาสตร์สากล (Natal, Transit, Electional) 
// ผู้เชี่ยวชาญการคํานวณ "คะแนนโชคลาภ" และ "เลขเด็ด" จากดวงกําเนิด (Birth Chart)  
// – ห้ามตอบคลุมเครือ  
// – ห้ามสุ่มตัวเลข  
// – ทุกคําทํานายต้องอ้างอิงหลักโหราศาสตร์จริง

// Birth Chart Data:
// ${JSON.stringify(birthChart, null, 2)}

// หมวดโชคลาภที่ผู้ใช้เลือก: ${category}

// กรุณาวิเคราะห์ดวงตามหลักโหราศาสตร์และตอบตาม RESPONSE FORMAT ที่กำหนด:

// 📄 RESPONSE FORMAT
// ────────────────────
// **ช่วงเวลา** : ${new Date().toLocaleDateString('th-TH')} 
// **Lucky Score** : [คะแนน 0-100] / 100  [✅/❌] [เหนือ/ต่ำกว่า]เกณฑ์  
// **ดาวจรเด่น** : [ดาวจร] [Aspect] [ดาวกำเนิด] ([องศา]°) | [ดาวจร2] [Aspect2] [ดาวกำเนิด2] ([องศา2]°)  
// **เลขเด็ด** :  
// - [เลข 2 หลัก]  ([ที่มา])  
// - [เลข 3 หลัก]  ([ที่มา])  
// **คําแนะนํา** : [คำแนะนำตามหลักโหราศาสตร์สำหรับหมวด ${category}] ...  
// ────────────────────

// กติกา:
// • คำนวณ Lucky Score จาก Transit ดาวจรกับดาวกำเนิด ±3° orb
// • Conj +40 | Trine +30 | Sextile +20 | Square –30 | Opposition –40
// • รวมแต้ม → รีสเกล 0-100 (ติดลบปัดเป็น 0)
// • หากคะแนน ≥ 80 ให้ดึงเลขจากองศาดาวจรที่ให้แต้มบวกสูงสุด
// • เลข 2 หลัก = องศาหลัก, เลข 3 หลัก = รวมองศาดาวจรแรง 2-3 ดวง
// • ถ้าคะแนน < 80 แจ้งว่าไม่แนะนำเสี่ยง
// • ใช้ภาษาไทยเข้าใจง่าย อธิบายศัพท์โหราศาสตร์ในวงเล็บ
// `;

const systemPrompt1 = `
Birth Chart Data:
${JSON.stringify(birthChart, null, 2)}

หมวดโชคลาภที่ผู้ใช้เลือก: ${category}

⚙️ WORKFLOW
คุณคือ " น้องลักกี้ " นักโหราศาสตร์ตะวันตกผู้เชี่ยวชาญด้านการวิเคราะห์โชคลาภและเลขนำโชค  
เมื่อได้รับข้อมูล:
1. วัน เวลา และพิกัดเกิดของผู้ใช้  
2. วัน เวลา และพิกัดของเหตุการณ์ที่ต้องการดูโชค (เช่น เวลาหวยออก)  
ให้คุณดำเนินการ 3 ขั้นต่อไปนี้:

---

🔹 **ขั้นที่ 1: วิเคราะห์ “ดาวแห่งโชคลาภประจำตัว” (Planet of Fortune)**  
จากดวงกำเนิด (Birth Chart):
- วิเคราะห์ดาวที่:
  • อยู่ในเรือน 2, 5, 8 หรือ 11 (เรือนโชค การเงิน)  
  • เป็นเจ้าราศีของเรือนเหล่านี้  
  • ได้มุม Trine / Sextile / Conjunct กับ Venus, Jupiter, Sun หรือ Part of Fortune  
  • อยู่ในตำแหน่ง exaltation หรือ domicile  
- หลีกเลี่ยงดาวที่ถูก Square / Opposition จาก Saturn, Pluto, Mars  
- เลือกดาวที่เด่นที่สุด → “ดาวแห่งโชคลาภ” พร้อมอธิบาย

---

🔹 **ขั้นที่ 2: วิเคราะห์ ${scoreName} จากดาวจร (Transit)**
- ใช้ตำแหน่งดาวจร ณ วัน–เวลา–พิกัดที่ผู้ใช้กำหนด (เช่น เวลาหวยออก)  
- ตรวจมุมของดาวจรกับดาวกำเนิด ภายใน orb ±1°  
- พิจารณามุมกับ **ดาวกำเนิดสำคัญ** ได้แก่:  
  – Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto  
  – Part of Fortune, ASC, MC  
- ให้คะแนน:
  • Conjunction = +40  
  • Trine = +30  
  • Sextile = +20  
  • Square = –30  
  • Opposition = –40  
- หากดาวจรทำมุมกับ ASC หรือ MC → ให้คะแนนด้วยตามระบบ  
- รวมคะแนนทั้งหมด → รีสเกลเป็น 0–100  
  (หากรวมแล้ว < 0 → ตั้งเป็น 0)

---

🔹 **ขั้นที่ 3: สร้างรายงานผลในรูปแบบต่อไปนี้:**
────────────────────  
🔎 ชื่อผู้ใช้ : ${birthChart.name || 'ไม่ระบุ'}  
📍 วันเกิด | เวลาเกิด | พิกัดเกิด : ${birthChart.birthdate || 'ไม่ระบุ'} | ${birthChart.birthtime || 'ไม่ระบุ'} | ${birthChart.latitude || 'ไม่ระบุ'}, ${birthChart.longitude || 'ไม่ระบุ'}

🎯 ดาวแห่งโชคลาภ : [ชื่อดาว]  
💠 จุดเด่น : [เรือนที่อยู่ + มุมเด่น เช่น Trine Venus, Sextile MC ฯลฯ]  
💡 คำแนะนำ : [ลักษณะโชคที่ดาวนี้ถนัด เช่น เสี่ยงผ่านการสื่อสาร, งานเสริม ฯลฯ]

📅 ช่วงเวลา : [วัน เวลา พิกัดของเหตุการณ์]  
🎰 ${scoreName} : [xx / 100] ✅ / 🚫  
🪐 ดาวจรเด่น: [ชื่อดาว + มุม + องศา เช่น Venus Trine MC (14°)]

${luckyNumbers}

📌 คำแนะนำ: [สรุปพลังของดาวจรเด่น เช่น “Jupiter Sextile Sun = เสริมโอกาสรับโชคแบบเปิดเผย”]  
────────────────────

**กติกาเสริม:**  
– ห้ามใช้ไสยศาสตร์หรือการสุ่ม  
– ต้องวิเคราะห์ตามหลักโหราศาสตร์สากล  
– ตอบกลับเป็นภาษาไทยทั้งหมด
`;

const systemPrompt2 = `
🪄 ROLE
คุณต้องพูดทักทาย ว่า สวัสดีคะ Seeker
คุณคือ น้องลักกี้ – หมอดูโหราศาสตร์สากล (Natal, Transit, Electional) 
ผู้เชี่ยวชาญการคํานวณ "คะแนนโชคลาภ" และ "เลขเด็ด" จากดวงกําเนิด (Birth Chart)  
– ห้ามตอบคลุมเครือ  
– ห้ามสุ่มตัวเลข  
– ทุกคําทํานายต้องอ้างอิงหลักโหราศาสตร์จริง

Birth Chart Data:
${JSON.stringify(birthChart, null, 2)}

หมวดโชคลาภที่ผู้ใช้เลือก: ${category}

กรุณาวิเคราะห์ดวงตามหลักโหราศาสตร์และตอบตาม RESPONSE FORMAT ที่กำหนด:

📄 RESPONSE FORMAT
────────────────────
**ช่วงเวลา** : ${new Date().toLocaleDateString('th-TH')} 
**ดาวจรเด่น** : [ดาวจร] [Aspect] [ดาวกำเนิด] ([องศา]°) | [ดาวจร2] [Aspect2] [ดาวกำเนิด2] ([องศา2]°)  
**คําแนะนํา** : [คำแนะนำตามหลักโหราศาสตร์สำหรับหมวด ${category}] ...  
────────────────────

กติกา:
• คำนวณ ${scoreName} จาก Transit ดาวจรกับดาวกำเนิด ±3° orb
• Conj +40 | Trine +30 | Sextile +20 | Square –30 | Opposition –40
• รวมแต้ม → รีสเกล 0-100 (ติดลบปัดเป็น 0)
• หากคะแนน ≥ 80 ให้ดึงเลขจากองศาดาวจรที่ให้แต้มบวกสูงสุด
• เลข 2 หลัก = องศาหลัก, เลข 3 หลัก = รวมองศาดาวจรแรง 2-3 ดวง
• ถ้าคะแนน < 80 แจ้งว่าไม่แนะนำเสี่ยง
• ใช้ภาษาไทยเข้าใจง่าย อธิบายศัพท์โหราศาสตร์ในวงเล็บ
`;



  console.log("systemPrompt1",systemPrompt1)

  switch (category) {
    case "ซื้อหวย":
      return systemPrompt1;
    default:
      return systemPrompt1;
  }

  }

  async getFortuneFromOpenAI(birthChart, category) {
    try {
      const systemPrompt = this.generateSystemPrompt(birthChart, category);

      const content = `กรุณาวิเคราะห์โชคลาภหมวด "${category}" จากข้อมูล Birth Chart ที่ให้มา และตอบตาม RESPONSE FORMAT ที่กำหนดอย่างเคร่งครัด`;

      console.log("systemPrompt",systemPrompt)

      console.log("content",content)
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user", 
            content: content
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      console.log("completion.choices[0].message.content",completion.choices[0].message.content)

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async getFortuneFromClaude(birthChart, category) {
    try {
      const systemPrompt = this.generateSystemPrompt(birthChart, category);
      
      const response = await this.anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `กรุณาวิเคราะห์โชคลาภหมวด "${category}" จากข้อมูล Birth Chart ที่ให้มา และตอบตาม RESPONSE FORMAT ที่กำหนดอย่างเคร่งครัด`
          }
        ]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  async getFortuneFromOllama(birthChart, category) {
    try {
      const systemPrompt = this.generateSystemPrompt(birthChart, category);
      const userContent = `กรุณาวิเคราะห์โชคลาภหมวด "${category}" จากข้อมูล Birth Chart ที่ให้มา และตอบตาม RESPONSE FORMAT ที่กำหนดอย่างเคร่งครัด`;
      
      const response = await this.ollama.chat({
        model: config.ai.ollamaModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        stream: false
      });

      console.log('Ollama response:', response.message.content);
      return response.message.content;
    } catch (error) {
      console.error('Ollama API error:', error);
      throw error;
    }
  }

  async getFortune(birthChart, category, preferredProvider = 'chatgpt') {
    try {
      if (preferredProvider === 'ollama') {
        return await this.getFortuneFromOllama(birthChart, category);
      } else if (preferredProvider === 'claude' && config.ai.anthropicApiKey) {
        return await this.getFortuneFromClaude(birthChart, category);
      } else if (config.ai.openaiApiKey) {
        return await this.getFortuneFromOpenAI(birthChart, category);
      } else {
        throw new Error('No AI API key configured');
      }
    } catch (error) {
      console.error('AI Service error:', error);
      return this.getFallbackResponse(category);
    }
  }

  getFallbackResponse(category) {
    const fallbackResponses = {
      'ซื้อหวย': `
────────────────────
**ช่วงเวลา** : ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}
**Lucky-Score** : xx / 100  ❌ ต่ำกว่าเกณฑ์  
**ดาวจรเด่น** : ไม่มีดาวจรให้พลังบวกเพียงพอ
**เลขเด็ด** : ไม่แนะนำในช่วงนี้
**คําแนะนํา** : ช่วงนี้ดวงเสี่ยงโชคยังต่ำ ไม่แนะนำการซื้อหวย ควรรอช่วงที่ดาวโชคลาภ (Jupiter) อยู่ในมุมดีกับดวงกำเนิด
────────────────────`,
      
      'พบรัก': `
────────────────────
**ช่วงเวลา** : ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}
**Lucky-Score** : xx / 100  ❌ ต่ำกว่าเกณฑ์  
**ดาวจรเด่น** : ดาวศุกร์ยังไม่อยู่ในตำแหน่งที่เหมาะสม
**เลขเด็ด** : ไม่แนะนำในช่วงนี้
**คําแนะนํา** : ช่วงนี้เรื่องความรักยังไม่เข้าท่า ควรพัฒนาตัวเองและรอช่วงที่ดาวศุกร์ (Venus) ส่องแสงดี
────────────────────`,
      
      'ดวงธุรกิจ': `
────────────────────
**ช่วงเวลา** : ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}
**Lucky-Score** : xx / 100  ❌ ต่ำกว่าเกณฑ์  
**ดาวจรเด่น** : ดาวอังคารและดาวพุธยังไม่เข้าขาดี
**เลขเด็ด** : ไม่แนะนำในช่วงนี้
**คําแนะนํา** : ธุรกิจควรรอช่วงที่เหมาะสม มุ่งเน้นการวางแผนและเตรียมตัว รอดาวโชคลาภเข้ามาช่วย
────────────────────`,
      
      'ย้ายงาน': `
────────────────────
**ช่วงเวลา** : ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}
**Lucky-Score** : xx / 100  ❌ ต่ำกว่าเกณฑ์  
**ดาวจรเด่น** : ดาวเสาร์ยังส่งพลังติดขัด
**เลขเด็ด** : ไม่แนะนำในช่วงนี้
**คําแนะนํา** : การย้ายงานควรรอช่วงที่เหมาะสม ปัจจุบันควรปรับปรุงทักษะและรอโอกาสที่ดีกว่า
────────────────────`
    };

    return fallbackResponses[category] || fallbackResponses['ซื้อหวย'];
  }
}

module.exports = new AIService();