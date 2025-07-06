const birthChartService = require('./birthChartService');
const aiService = require('./aiService');

class FortuneService {
  async getFortune(birthChart, category) {
    try {
      const currentDate = new Date();
      
      const transits = birthChartService.calculateTransits(birthChart, currentDate);
      
      const luckyScore = this.calculateLuckyScore(transits);
      
      const enhancedBirthChart = {
        ...birthChart,
        transits,
        luckyScore,
        currentDate: currentDate.toISOString()
      };

      const fortuneResult = await aiService.getFortune(enhancedBirthChart, category);

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