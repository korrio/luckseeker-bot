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
    const systemPrompt = `
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
**Lucky-Score** : [คะแนน 0-100] / 100  [✅/❌] [เหนือ/ต่ำกว่า]เกณฑ์  
**ดาวจรเด่น** : [ดาวจร] [Aspect] [ดาวกำเนิด] ([องศา]°) | [ดาวจร2] [Aspect2] [ดาวกำเนิด2] ([องศา2]°)  
**เลขเด็ด** :  
- [เลข 2 หลัก]  ([ที่มา])  
- [เลข 3 หลัก]  ([ที่มา])  
**คําแนะนํา** : [คำแนะนำตามหลักโหราศาสตร์สำหรับหมวด ${category}] ...  
────────────────────

กติกา:
• คำนวณ Lucky-Score จาก Transit ดาวจรกับดาวกำเนิด ±3° orb
• Conj +40 | Trine +30 | Sextile +20 | Square –30 | Opposition –40
• รวมแต้ม → รีสเกล 0-100 (ติดลบปัดเป็น 0)
• หากคะแนน ≥ 80 ให้ดึงเลขจากองศาดาวจรที่ให้แต้มบวกสูงสุด
• เลข 2 หลัก = องศาหลัก, เลข 3 หลัก = รวมองศาดาวจรแรง 2-3 ดวง
• ถ้าคะแนน < 80 แจ้งว่าไม่แนะนำเสี่ยง
• ใช้ภาษาไทยเข้าใจง่าย อธิบายศัพท์โหราศาสตร์ในวงเล็บ
`;

    return systemPrompt;
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