const birthChartService = require('./birthChartService');
const aiService = require('./aiService');
const database = require('./database');

class FortuneService {
  async getFortune(birthChart, category, additionalData = {}, preferredProvider = 'chatgpt', userId = null) {
    try {
      // Check user quota if userId is provided
      if (userId) {
        console.log("userId",userId)
        const hasQuota = await database.checkUserQuota(userId);
        if (!hasQuota) {
          return this.getQuotaExceededMessage();
        }
      }

      const currentDate = new Date();
      
      const transits = birthChartService.calculateTransits(birthChart, currentDate);
      
      // Get user birth data if userId is provided
      let userBirthData = null;
      if (userId) {
        userBirthData = await database.getBirthData(userId);
      }
      
      const enhancedBirthChart = {
        ...birthChart,
        transits,
        currentDate: currentDate.toISOString(),
        additionalData,
        // Add user data if available
        ...(userBirthData && {
          birthdate: userBirthData.birthdate,
          birthtime: userBirthData.birthtime,
          latitude: userBirthData.latitude,
          longitude: userBirthData.longitude,
          gender: userBirthData.gender
        })
      };

      const fortuneResult = await aiService.getFortune(enhancedBirthChart, category, preferredProvider);

      // Decrement user quota after successful AI service call
      if (userId) {
        await database.decrementUserQuota(userId);
        const remainingQuota = await database.getUserQuota(userId);
        console.log(`User ${userId} quota used. Remaining: ${remainingQuota.remainingQueries}`);
      }

      console.log("fortuneResult",fortuneResult)
      
      return fortuneResult;
    } catch (error) {
      console.error('Error in fortune service:', error);
      return this.getFallbackFortune(category);
    }
  }

  calculateLuckyScore(transits) {
    let totalScore = 0;
    
    transits.forEach(transit => {
      totalScore += transit.score;
    });

    const normalizedScore = Math.max(0, Math.min(100, totalScore + 50));
    
    return Math.round(normalizedScore);
  }

  getLuckyNumbers(transits, luckyScore) {
    if (luckyScore < 80) {
      return null;
    }

    const positiveTransits = transits
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score);

    if (positiveTransits.length === 0) {
      return null;
    }

    const primaryTransit = positiveTransits[0];
    const secondaryTransit = positiveTransits[1];

    const luckyNumbers = {};

    if (primaryTransit) {
      const degree = Math.floor(Math.random() * 30) + 1;
      luckyNumbers.twoDigit = degree.toString().padStart(2, '0');
    }

    if (primaryTransit && secondaryTransit) {
      const degree1 = Math.floor(Math.random() * 30) + 1;
      const degree2 = Math.floor(Math.random() * 30) + 1;
      const degree3 = Math.floor(Math.random() * 30) + 1;
      luckyNumbers.threeDigit = `${degree1}${degree2}${degree3}`;
    }

    return luckyNumbers;
  }

  getFallbackFortune(category) {
    const categoryEmojis = {
      'ซื้อหวย': '🎰',
      'พบรัก': '💕', 
      'ดวงธุรกิจ': '💼',
      'ย้ายงาน': '🔄'
    };

    const emoji = categoryEmojis[category] || '🌟';
    
    return `${emoji} ขออภัยค่ะ ขณะนี้ระบบวิเคราะห์ดวงมีปัญหา กรุณาลองใหม่อีกครั้งในภายหลังค่ะ

สำหรับ${category} แนะนำให้:
- สังเกตดวงในช่วง 3-7 วันข้างหน้า
- หลีกเลี่ยงการตัดสินใจสำคัญในช่วงนี้
- ทำบุญเพื่อเสริมดวงชะตา

🙏 ขอบคุณที่ใช้บริการ LuckSeeker ค่ะ`;
  }

  getQuotaExceededMessage() {
    return `🚫 **หมดสิทธิ์การใช้งาน**

ขออภัยค่ะ คุณได้ใช้สิทธิ์ดูดวงครบ 10 ครั้งแล้วในรอบนี้

📞 **กรุณาติดต่อ Admin เพื่อดูดวงเพิ่มเติม**

💫 **ขณะนี้คุณสามารถ:**
- ติดต่อ Admin เพื่อเพิ่มสิทธิ์การใช้งาน
- รอรอบใหม่เพื่อรับสิทธิ์เพิ่ม

🙏 ขอบคุณที่ใช้บริการ LuckSeeker ค่ะ`;
  }

  getFortuneCategories() {
    return [
      {
        id: 'ซื้อหวย',
        name: 'ซื้อหวย',
        emoji: '🎰',
        description: 'โชคลาภ เลขเด็ด การเสี่ยงโชค'
      },
      {
        id: 'พบรัก', 
        name: 'พบรัก',
        emoji: '💕',
        description: 'ความรัก คู่ครอง เสน่ห์'
      },
      {
        id: 'ดวงธุรกิจ',
        name: 'ดวงธุรกิจ', 
        emoji: '💼',
        description: 'การงาน ธุรกิจ การเงิน'
      },
      {
        id: 'ย้ายงาน',
        name: 'ย้ายงาน',
        emoji: '🔄', 
        description: 'เปลี่ยนงาน ย้ายที่ทำงาน'
      }
    ];
  }
}

module.exports = new FortuneService();