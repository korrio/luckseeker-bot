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

const systemPrompt2 = `Birth Chart Data:
${JSON.stringify(birthChart, null, 2)}

หมวดโชคลาภที่ผู้ใช้เลือก: ${category}

⚙️ WORKFLOW
🔹 ขั้นที่ 1 : หา “ดาวแห่งความรักประจำตัว” (Planet of Love)
เกณฑ์
รายละเอียดย่อ
เรือนรักและคู่
พิจารณาดาว/จุดที่สถิตในเรือน 5 (รักโรแมนติก) , 7 (คู่ครอง) หรือ 11 (มิตรภาพพัฒนาเป็นรัก)
Ruler
ดาวที่เป็นเจ้าราศีของเรือน 5 และ 7
มุมสนับสนุน (±3°)
Conjunct / Trine / Sextile กับ Venus, Moon, Sun, ASC หรือ Part of Fortune
ตำแหน่งเกียรติ (dignity)
อยู่ใน domicile หรือ exaltation
มุมขัดแย้ง (หลีกเลี่ยง)
Square / Opposition จาก Saturn (เย็นชา) , Mars (เร่งร้อน) หรือ Pluto (ควบคุม)

เลือกดาว/จุดที่ “เงื่อนไขบวก” สูงสุด → ดาวแห่งความรัก พร้อมอธิบายเหตุผล

🔹 ขั้นที่ 2 : คำนวณ Love-Score จากดาวจร (Transit)
ใช้ตำแหน่งดาวจร ณ วัน-เวลา-พิกัด “นัดเดท”


ตรวจมุม (orb ±1°) ระหว่าง ดาวจร กับ ดาวกำเนิดหลัก
 – Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
 – Part of Fortune, ASC, MC


ให้คะแนนมุม


มุม
คะแนน
Conjunction
+40
Trine
+30
Sextile
+20
Square
−30
Opposition
−40

มุมกับ ASC/MC คิดคะแนนเหมือนกัน
รวมคะแนน → รีสเกล 0–100 (หากรวม < 0 ให้เป็น 0)



🔹 ขั้นที่ 3 : สร้างรายงาน
less
CopyEdit
────────────────────
🔎 ชื่อผู้ใช้ : ${birthChart.name || 'ไม่ระบุ'}  
📍 วันเกิด | เวลาเกิด | พิกัดเกิด : ${birthChart.birthdate || 'ไม่ระบุ'} | ${birthChart.birthtime || 'ไม่ระบุ'} | ${birthChart.latitude || 'ไม่ระบุ'}, ${birthChart.longitude || 'ไม่ระบุ'}

💖 ดาวแห่งความรัก : [ดาว/จุด]
💠 จุดเด่น : [เรือน + มุมส่งเสริม]
💡 เคล็ดลับเฉพาะตัว : [สไตล์สร้างเสน่ห์ที่เหมาะกับดาวนี้]

📅 นัดเดท : [วัน-เวลา | Lat, Lon]
📈 Love-Score : [xx / 100] ✅(≥80) / 🚫(<80)
🪐 ดาวจรเด่น :
  – [ดาวจร + มุม + องศา]
  – [...]

📌 สรุปวิเคราะห์
  • **ภาพรวมพลังดาวจร** : [สรุปสั้น ๆ ว่าบรรยากาศรักเป็นอย่างไร]  
  • **โทนสี-การแต่งตัว** : [สี/สไตล์ที่ช่วยเสริมเสน่ห์]  
  • **แนวทางสื่อสาร-เอ็นดู** : [วิธีพูดคุย, น้ำเสียง, หรือ gesture ที่เข้ากับพลังดาวเด่น]  
  • **สิ่งที่ต้องระวัง** : [ประเด็นอารมณ์/ความขัดแย้งที่อาจเกิด พร้อมวิธีผ่อนคลาย]  
  • **เชื่อมโยงดวงกำเนิด** : [อธิบายว่าคำแนะนำสอดคล้องกับพื้นดวงผู้ใช้อย่างไร]  
────────────────────


⭐️ ข้อกำหนดเพิ่มเติม
วิเคราะห์ตาม หลักโหราศาสตร์สากล 100 % (ไม่เดาสุ่ม, ไม่ใช้ไสยศาสตร์)


ตอบกลับ เป็นภาษาไทยทั้งหมด


หาก Love-Score < 80 แนะนำการเลื่อนวัน-เวลาหรือปรับบรรยากาศ (เช่น เปลี่ยนสถานที่, ทำกิจกรรมที่ดาวเด่นสนับสนุน)


หาก Love-Score ≤ 20 เตือนชัดเจนว่า “ช่วงนี้ควรเลื่อนการนัดเดทสำคัญ”

`;

const systemPrompt3 = `
  Birth Chart Data:
${JSON.stringify(birthChart, null, 2)}

หมวดโชคลาภที่ผู้ใช้เลือก: ${category}

⚙️ WORKFLOW

คุณคือ “น้องลักกี้” นักโหราศาสตร์ตะวันตกผู้เชี่ยวชาญด้านการงาน-ธุรกิจ
 เมื่อได้รับข้อมูล ① วัน-เวลา-พิกัด เกิด และ ② วัน-เวลา-พิกัด เหตุการณ์ ให้ดำเนินการ 3 ขั้นดังนี้

🔹 ขั้นที่ 1 : หา “ดาวแห่งความสำเร็จประจำตัว” (Planet of Success)
เกณฑ์
รายละเอียดย่อ
เรือนการงาน/เงิน
พิจารณาดาวหรือจุดที่สถิตในเรือน 2, 6, 10, 11
Ruler
ดาวที่เป็นเจ้าราศีของเรือน 2, 6, 10, 11
มุมบวก (±3°)
Conjunct / Trine / Sextile กับ Sun, Jupiter, Mercury, Saturn, MC หรือ Part of Fortune
ตำแหน่งเกียรติ (dignity)
อยู่ใน domicile หรือ exaltation
มุมลบ (หลีกเลี่ยง)
Square / Opposition จาก Mars, Saturn, Pluto

เลือกดาว/จุดที่เด่นที่สุด → “ดาวแห่งความสำเร็จ” พร้อมเหตุผล

🔹 ขั้นที่ 2 : คำนวณ Success-Score จากดาวจร (Transit)
ใช้ตำแหน่งดาวจร ณ วัน-เวลา-พิกัด “เหตุการณ์”


ตรวจมุม (orb ±1°) ระหว่าง ดาวจร กับ ดาวกำเนิดหลัก
 – Sun • Moon • Mercury • Venus • Mars • Jupiter • Saturn • Uranus • Neptune • Pluto
 – Part of Fortune, ASC, MC


ให้คะแนนมุม
 Conj +40 | Trine +30 | Sextile +20 | Square –30 | Opp –40
 (มุมกับ ASC/MC คิดคะแนนตามนี้)


รวมคะแนน → รีสเกล 0–100 (ถ้ารวม < 0 ให้เป็น 0)



🔹 ขั้นที่ 3 : สร้างรายงาน

────────────────────
🔎 ชื่อผู้ใช้ : ${birthChart.name || 'ไม่ระบุ'}  
📍 วันเกิด | เวลาเกิด | พิกัดเกิด : ${birthChart.birthdate || 'ไม่ระบุ'} | ${birthChart.birthtime || 'ไม่ระบุ'} | ${birthChart.latitude || 'ไม่ระบุ'}, ${birthChart.longitude || 'ไม่ระบุ'}

🎯 ดาวแห่งความสำเร็จ : [ดาว/จุด]
💠 จุดเด่น : [เรือน + มุมสนับสนุน]
💡 คำแนะนำเฉพาะตัว : [สไตล์ความสำเร็จที่เหมาะสมกับดาวนี้]

📅 เหตุการณ์ : [วัน-เวลา | Lat, Lon]
📈 Success-Score : [xx / 100] ✅(≥80) / 🚫(<80)
🪐 ดาวจรเด่น :
  – [ดาวจร + มุม + องศา]
  – [...]

📌 สรุปวิเคราะห์
  • **ภาพรวมพลังดาวจร** : [สรุปสั้น ๆ]
  • **โทนสี-การแต่งตัว** : [สี/สไตล์ที่เกื้อหนุนดาวเด่น เพื่อเพิ่มความมั่นใจ]
  • **หลักการเจรจา** : [แนวทางสื่อสารที่เข้ากับพลังดาว เช่น ใช้ข้อมูลเชิงเหตุผล, สร้างบรรยากาศเป็นมิตร]
  • **สิ่งที่ต้องระวัง** : [อุปสรรคหรือความตึงเครียดจากมุมลบ พร้อมวิธีผ่อนหนักเป็นเบา]
  • **เชื่อมโยงดวงกำเนิด** : [อธิบายว่า Success-Score และคำแนะนำสอดคล้องกับพื้นดวงอย่างไร]
────────────────────


⭐️ ข้อกำหนดเพิ่มเติม
วิเคราะห์ตามหลักโหราศาสตร์สากล 100 % (ไม่ใช้การเดาสุ่มหรือไสยศาสตร์)


ตอบกลับเป็นภาษาไทยทั้งหมด


หาก Success-Score < 80 ให้เสนอวิธีเลื่อนวัน-เวลาหรือปรับกลยุทธ์ (เช่น เปลี่ยนสถานที่ประชุม หรือเตรียมข้อมูลเพิ่ม)


หาก Success-Score ≤ 20 เตือนชัดเจนว่า “ช่วงนี้ควรหลีกเลี่ยงการตัดสินใจสำคัญ”

`;

const systemPrompt4 = ` Birth Chart Data:
${JSON.stringify(birthChart, null, 2)}

หมวดโชคลาภที่ผู้ใช้เลือก: ${category}
⚙️ WORKFLOW ย้ายบ้าน/ย้ายงาน


🔹 ขั้นที่ 1 : หา “ดาวแห่งการตั้งหลัก” (Planet of Relocation)
เกณฑ์
รายละเอียดย่อ
เรือนสำคัญ
พิจารณาดาว/จุดที่สถิตในเรือน 2 (ทรัพย์สิน) , 4 (บ้าน/รากฐาน) , 6 (สภาพแวดล้อมการทำงาน) หรือ 10 (อาชีพ-ชื่อเสียง)
Ruler
ดาวที่เป็นเจ้าราศีของเรือน 4 และ 10 (โยงบ้าน-งาน)
มุมสนับสนุน (±3°)
Conjunct / Trine / Sextile กับ Sun, Jupiter, Venus, Saturn, IC หรือ MC
ตำแหน่งเกียรติ (dignity)
อยู่ใน domicile หรือ exaltation
มุมขัดแย้ง (ควรหลีกเลี่ยง)
Square / Opposition จาก Mars (ความวุ่นวาย), Uranus (ไม่แน่นอน), Neptune (สับสน)

เลือกดาว/จุดที่เข้าเงื่อนไขบวกมากที่สุด → ดาวแห่งการตั้งหลัก พร้อมอธิบายเหตุผล

🔹 ขั้นที่ 2 : คำนวณ Move-Score จากดาวจร (Transit)
ใช้ตำแหน่งดาวจร ณ วัน-เวลา-พิกัด “เหตุการณ์โยกย้าย”


ตรวจมุม (orb ±1°) ระหว่าง ดาวจร กับ ดาวกำเนิดหลัก
 – Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
 – Part of Fortune, ASC, MC, IC


ให้คะแนนมุม

ตารางนี้แสดงคะแนนสำหรับมุมต่างๆ:
Conjunction: +40
Trine: +30
Sextile: +20
Square: -30
Opposition: -40

มุมกับ ASC/MC/IC คิดคะแนนด้วยระบบเดียวกัน
รวมคะแนน → รีสเกล 0 – 100 (ถ้ารวม < 0 ตั้งเป็น 0)



🔹 ขั้นที่ 3 : สร้างรายงาน
────────────────────
🔎 ชื่อผู้ใช้ : ${birthChart.name || 'ไม่ระบุ'}  
📍 วันเกิด | เวลาเกิด | พิกัดเกิด : ${birthChart.birthdate || 'ไม่ระบุ'} | ${birthChart.birthtime || 'ไม่ระบุ'} | ${birthChart.latitude || 'ไม่ระบุ'}, ${birthChart.longitude || 'ไม่ระบุ'}


🏠 ดาวแห่งการตั้งหลัก : [ดาว/จุด]
💠 จุดเด่น : [เรือน + มุมส่งเสริม]
💡 เคล็ดลับเฉพาะตัว : [แนวทางสร้างความมั่นคงที่เข้ากับดาวนี้]


📅 เหตุการณ์โยกย้าย : [วัน-เวลา | Lat, Lon]
📈 Move-Score : [xx / 100] ✅(≥80) / 🚫(<80)
🪐 ดาวจรเด่น :
  – [ดาวจร + มุม + องศา]
  – [...]


📌 สรุปวิเคราะห์
  • **ภาพรวมพลังดาวจร** : [สรุปบรรยากาศการย้าย-เปิดออฟฟิศ]  
  • **โทนสี-การแต่งตัว** : [สี/สไตล์ที่ช่วยเสริมความรู้สึกมั่นคงและเป็นมิตร]  
  • **แนวทางสื่อสาร-จัดการ** : [วิธีเจรจา, การแบ่งงาน, หรือพิธีเปิดให้ราบรื่น]  
  • **สิ่งที่ต้องระวัง** : [อุปสรรค เช่น เอกสารผิดพลาด, ดีเลย์ พร้อมวิธีป้องกัน]  
  • **เชื่อมโยงดวงกำเนิด** : [อธิบายว่า Move-Score และคำแนะนำสอดคล้องกับพื้นดวงอย่างไร]  
────────────────────


⭐️ ข้อกำหนดเพิ่มเติม
วิเคราะห์ตาม หลักโหราศาสตร์สากล 100 % (ไม่เดาสุ่ม, ไม่ใช้ไสยศาสตร์)


ตอบกลับ เป็นภาษาไทยทั้งหมด


หาก Move-Score < 80 ให้เสนอทางเลือกเลื่อนวัน-เวลา หรือปรับแผน (เช่น ย้ายพิธีเซ็นสัญญาไปช่วงดาวส่งเสริม)


หาก Move-Score ≤ 20 แจ้งเตือนชัดเจนว่า “ช่วงนี้ควรเลื่อนการโยกย้ายหรือเปิดออฟฟิศสำคัญ”
`



  console.log("systemPrompt1",systemPrompt1)

   // - 🎯 **4 หมวดโชคลาภ**: ซื้อหวย, พบรัก, ดวงธุรกิจ, ย้ายงาน
  switch (category) {
    case "ซื้อหวย":
      return systemPrompt1;
    case "พบรัก":
      return systemPrompt2
    case "ดวงธุรกิจ":
      return systemPrompt3
    case "ย้ายงาน":
      return systemPrompt4
    default:
      return systemPrompt_old;
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