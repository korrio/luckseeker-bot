const line = require('@line/bot-sdk');
const axios = require('axios');
const config = require('../config');
const fortuneService = require('../services/fortuneService');
const birthChartService = require('../services/birthChartService');
const database = require('../services/database');

const lineConfig = {
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret
};

const client = new line.Client(lineConfig);

// Simple mutex to prevent duplicate requests
const processingUsers = new Set();

// Helper function to show loading animation using direct API call
async function showLoadingAnimation(userId, loadingSeconds = 10) {
  try {
    return await axios({
      method: "post",
      url: "https://api.line.me/v2/bot/chat/loading/start",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.line.channelAccessToken}`
      },
      data: { 
        chatId: userId,
        loadingSeconds: loadingSeconds
      }
    });
  } catch (error) {
    console.error('Loading animation API error:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to parse fortune result and extract key information
function parseFortuneResult(fortuneText) {
  const parsed = {
    timestamp: new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH'),
    luckyScore: null,
    luckyScoreStatus: '',
    luckyScoreColor: '#999999',
    planets: '',
    luckyNumbers: {
      twoDigit: null,
      threeDigit: null
    },
    advice: ''
  };

  console.log("fortuneText+++",fortuneText)

  try {
    // Extract timestamp
    const timeMatch = fortuneText.match(/\*\*ช่วงเวลา\*\*\s*:\s*(.+)/);
    if (timeMatch) {
      parsed.timestamp = timeMatch[1].trim();
    }

    // Extract Lucky Score
    const scoreMatch = fortuneText.match(/\*\*Lucky-Score\*\*\s*:\s*(\d+)\s*\/\s*100/);

    console.log("scoreMatch+++",scoreMatch)

    if (scoreMatch) {
      parsed.luckyScore = parseInt(scoreMatch[1]);
      if (parsed.luckyScore >= 80) {
        parsed.luckyScoreStatus = '✅ เหนือเกณฑ์';
        parsed.luckyScoreColor = '#4CAF50';
      } else if (parsed.luckyScore >= 60) {
        parsed.luckyScoreStatus = '⚠️ ปานกลาง';
        parsed.luckyScoreColor = '#FFA500';
      } else {
        parsed.luckyScoreStatus = '❌ ต่ำกว่าเกณฑ์';
        parsed.luckyScoreColor = '#FF6B6B';
      }
    }

    // Extract planets/aspects
    const planetsMatch = fortuneText.match(/\*\*ดาวจรเด่น\*\*\s*:\s*(.+?)(?=\*\*|$)/s);
    if (planetsMatch) {
      parsed.planets = planetsMatch[1].trim().replace(/\n/g, ' ');
    }

    // Extract lucky numbers - try different patterns
    const luckyNumbersMatch = fortuneText.match(/\*\*เลขเด็ด\*\*\s*:\s*([\s\S]*?)(?=\*\*|$)/);
    if (luckyNumbersMatch) {
      const numbersText = luckyNumbersMatch[1];
      
      // Extract 2-digit numbers
      const twoDigitMatches = numbersText.match(/(\d{2})/g);
      if (twoDigitMatches && twoDigitMatches.length > 0) {
        parsed.luckyNumbers.twoDigit = twoDigitMatches[0];
      }
      
      // Extract 3-digit numbers
      const threeDigitMatches = numbersText.match(/(\d{3})/g);
      if (threeDigitMatches && threeDigitMatches.length > 0) {
        parsed.luckyNumbers.threeDigit = threeDigitMatches[0];
      }
    }

    // Extract advice
    const adviceMatch = fortuneText.match(/\*\*คำแนะนำ\*\*\s*:\s*([\s\S]+?)(?:────|$)/);
    if (adviceMatch) {
      parsed.advice = adviceMatch[1].trim().replace(/\n/g, ' ');
    }

    // Log the parsed result for debugging
    console.log('Parsed fortune result:', {
      luckyScore: parsed.luckyScore,
      planets: parsed.planets.substring(0, 100) + '...',
      hasLuckyNumbers: !!(parsed.luckyNumbers.twoDigit || parsed.luckyNumbers.threeDigit),
      hasAdvice: !!parsed.advice
    });

  } catch (error) {
    console.warn('Error parsing fortune result:', error);
    // Keep the empty default values if parsing fails
  }

  return parsed;
}

// Helper function to create rich message template
function createFortuneRichMessage(fortuneText, category) {
  const parsed = parseFortuneResult(fortuneText);
  
  // Create a minimized flex message to avoid LINE API 400 errors
  const richMessage = {
    type: "flex",
    altText: `Lucky Score: ${parsed.luckyScore}/100`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `🎯 Lucky Score: ${parsed.luckyScore}/100`,
            weight: "bold",
            size: "lg",
            color: parsed.luckyScoreColor
          },
          {
            type: "text",
            text: parsed.luckyScoreStatus,
            size: "sm",
            color: parsed.luckyScoreColor,
            margin: "sm"
          }
        ]
      }
    }
  };

  // Add only essential content to keep message small
  const bodyContents = richMessage.contents.body.contents;

  // Add planets info (shortened)
  if (parsed.planets && parsed.planets !== 'ไม่มีดาวจรที่สามารถสร้างความสัมพันธ์กับดาวกำเนิดในองศาที่ให้คะแนนบวก') {
    bodyContents.push(
      { type: "separator", margin: "md" },
      {
        type: "text",
        text: "⭐ ดาวจรเด่น",
        weight: "bold",
        margin: "md",
        size: "sm"
      },
      {
        type: "text",
        text: parsed.planets.substring(0, 50) + (parsed.planets.length > 50 ? "..." : ""),
        wrap: true,
        size: "xs",
        margin: "sm"
      }
    );
  }

  // Add lucky numbers if available
  if (parsed.luckyNumbers.twoDigit || parsed.luckyNumbers.threeDigit) {
    let numbersText = "";
    if (parsed.luckyNumbers.twoDigit) {
      numbersText = `🎲 ${parsed.luckyNumbers.twoDigit}`;
    }
    if (parsed.luckyNumbers.threeDigit) {
      numbersText += numbersText ? `, ${parsed.luckyNumbers.threeDigit}` : `🎲 ${parsed.luckyNumbers.threeDigit}`;
    }
    
    bodyContents.push(
      { type: "separator", margin: "md" },
      {
        type: "text",
        text: numbersText,
        size: "md",
        color: "#4CAF50",
        weight: "bold",
        margin: "md"
      }
    );
  }

  // Add shortened advice
  if (parsed.advice) {
    bodyContents.push(
      { type: "separator", margin: "md" },
      {
        type: "text",
        text: parsed.advice.substring(0, 80) + (parsed.advice.length > 80 ? "..." : ""),
        wrap: true,
        size: "xs",
        margin: "md"
      }
    );
  }

  // Add simple button
  bodyContents.push(
    { type: "separator", margin: "md" },
    {
      type: "button",
      action: {
        type: "postback",
        label: "วิเคราะห์ใหม่",
        data: "action=analyze_again"
      },
      style: "primary",
      margin: "md"
    }
  );

  return richMessage;
}

async function handleEvent(event) {
  try {
    console.log('Handling event:', {
      type: event.type,
      replyToken: event.replyToken,
      userId: event.source?.userId,
      messageType: event.message?.type,
      messageText: event.message?.text?.substring(0, 100)
    });

    // Handle postback events from rich message buttons
    if (event.type === 'postback') {
      return handlePostback(event);
    }

    if (event.type !== 'message' || event.message.type !== 'text') {
      return Promise.resolve(null);
    }

    // Validate replyToken exists
    if (!event.replyToken) {
      console.error('No replyToken found in event');
      return Promise.resolve(null);
    }

    const userId = event.source.userId;
    const message = event.message.text.trim();

    if (message === 'เริ่มต้น' || message === 'เริ่มใหม่' || message.includes('สวัสดี') || message.includes('hello') || message.includes('ไง')) {
      return handleGreeting(event);
    }

    if (message.startsWith('birth:')) {
      return handleBirthChart(event, message);
    }

    // Handle additional data inputs for fortune categories
    if (message.startsWith('business:') || message.startsWith('love:') || message.startsWith('relocation:') || message.startsWith('lottery:') || message.startsWith('partner:')) {
      return handleAdditionalData(event, message);
    }

    // Handle admin commands for quota management
    if (message.startsWith('admin:addquota:')) {
      return handleAdminAddQuota(event, message);
    }

    if (message === 'admin:quotastatus' || message === 'quota') {
      return handleQuotaStatus(event);
    }

    // Handle text commands for menu actions
    if (message === 'วันเกิด') {
      return handleTextCommand(event, 'input_birth_data');
    }
    
    if (message === 'ซื้อหวย') {
      return handleTextCommand(event, 'fortune', 'ซื้อหวย');
    }
    
    if (message === 'พบรัก') {
      return handleTextCommand(event, 'fortune', 'พบรัก');
    }
    
    if (message === 'ดวงธุรกิจ') {
      return handleTextCommand(event, 'fortune', 'ดวงธุรกิจ');
    }
    
    if (message === 'ย้ายงาน') {
      return handleTextCommand(event, 'fortune', 'ย้ายงาน');
    }
    
    if (message === 'ลบ' || message === 'ลบข้อมูล') {
      return handleTextCommand(event, 'delete_all_data');
    }

    return handleGeneralMessage(event);
  } catch (error) {
    console.error('Error handling event:', {
      error: error.message,
      stack: error.stack,
      event: event
    });
    
    // Try to send error message if replyToken exists
    if (event.replyToken) {
      try {
        return await client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ขออภัยค่ะ เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้งค่ะ'
        });
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }
    }
    
    return Promise.resolve(null);
  }
}

async function handleGreeting(event) {
  const userId = event.source.userId;
  
  // Check if this is a first-time user
  const isFirstTime = await database.isFirstTimeUser(userId);
  
  if (isFirstTime) {
    // Mark user as visited and send welcome message
    await database.markUserAsVisited(userId);
    return sendWelcomeMessage(event);
  }
  
  const cachedBirthData = await database.getBirthData(userId);
  
  // Check if user has cached birth data
  if (cachedBirthData) {
    const savedDate = new Date(cachedBirthData.timestamp).toLocaleDateString('th-TH');
    
    const flexMessage = {
      type: 'flex',
      altText: 'สวัสดีค่ะ Seeker',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'สวัสดีค่ะ Seeker ✨',
              weight: 'bold',
              size: 'xl',
              color: '#7B68EE'
            },
            {
              type: 'text',
              text: 'ฉันจำข้อมูลเกิดของคุณได้แล้วค่ะ',
              size: 'md',
              margin: 'md'
            },
            {
              type: 'text',
              text: `บันทึกเมื่อ: ${savedDate}`,
              size: 'sm',
              margin: 'sm',
              color: '#999999'
            },
            {
              type: 'separator',
              margin: 'md'
            },
            {
              type: 'text',
              text: 'เลือกหมวดโชคลาภที่ต้องการดูได้เลยค่ะ',
              size: 'md',
              margin: 'md',
              weight: 'bold'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '🎰 ซื้อหวย',
                data: 'action=select_category&category=ซื้อหวย'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '💕 พบรัก',
                data: 'action=select_category&category=พบรัก'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '💼 ดวงธุรกิจ',
                data: 'action=select_category&category=ดวงธุรกิจ'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '🔄 ย้ายงาน',
                data: 'action=select_category&category=ย้ายงาน'
              },
              style: 'primary'
            },
            {
              type: 'separator',
              margin: 'md'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '🗑️ ลบข้อมูลของฉันทั้งหมด',
                data: 'action=delete_all_data'
              },
              style: 'secondary',
              color: '#FF6B6B'
            }
          ]
        }
      }
    };

    return client.replyMessage(event.replyToken, flexMessage);
  } else {
    // Original greeting for new users
    const flexMessage = {
      type: 'flex',
      altText: 'สวัสดีค่ะ Seeker',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'สวัสดีค่ะ Seeker ✨',
              weight: 'bold',
              size: 'xl',
              color: '#7B68EE'
            },
            {
              type: 'text',
              text: 'ฉันคือ น้องลักกี้ – หมอดูโหราศาสตร์สากล',
              size: 'md',
              margin: 'md'
            },
            {
              type: 'text',
              text: 'ผู้เชี่ยวชาญการคำนวณ "คะแนนโชคลาภ" และ "เลขเด็ด" จากดวงกำเนิด',
              size: 'sm',
              margin: 'sm',
              wrap: true
            },
            {
              type: 'separator',
              margin: 'md'
            },
            {
              type: 'text',
              text: 'กรุณาเลือกเพศและกรอกข้อมูลเกิดของคุณ',
              size: 'md',
              margin: 'md',
              weight: 'bold'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: 'กรอกข้อมูลเกิด',
                uri: `https://miniapp.line.me/${config.line.liffId}`
              },
              style: 'primary',
              color: '#7B68EE'
            }
          ]
        }
      }
    };

    return client.replyMessage(event.replyToken, flexMessage);
  }
}

async function handleBirthChart(event, message) {
  try {
    const data = JSON.parse(message.replace('birth:', ''));
    const { birthdate, birthtime, latitude, longitude, gender } = data;

    // Validate required fields
    if (!birthdate || !birthtime || latitude === undefined || longitude === undefined) {
      console.error('Missing required birth chart data:', { birthdate, birthtime, latitude, longitude });
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ขออภัยค่ะ ข้อมูลเกิดไม่ครบถ้วน กรุณากรอกข้อมูลใหม่อีกครั้งค่ะ'
      });
    }

    const birthChart = await birthChartService.generateBirthChart({
      birthdate,
      birthtime,
      latitude,
      longitude
    });

    console.log("birthChart++",birthChart)

    const fortuneCategories = {
      type: 'flex',
      altText: 'เลือกหมวดโชคลาภ',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'ได้ Birth Chart แล้วค่ะ! 🌟',
              weight: 'bold',
              size: 'lg'
            },
            {
              type: 'text',
              text: 'เลือกหมวดโชคลาภที่ต้องการดูค่ะ',
              margin: 'md'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '🎰 ซื้อหวย',
                data: 'action=select_category&category=ซื้อหวย'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '💕 พบรัก',
                data: 'action=select_category&category=พบรัก'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '💼 ดวงธุรกิจ',
                data: 'action=select_category&category=ดวงธุรกิจ'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '🔄 ย้ายงาน',
                data: 'action=select_category&category=ย้ายงาน'
              },
              style: 'primary'
            }
          ]
        }
      }
    };

    // Save both birth chart and original birth data to database
    const userId = event.source.userId;
    
    await database.setBirthChart(userId, birthChart);
    await database.setBirthData(userId, {
      birthdate,
      birthtime,
      latitude,
      longitude,
      gender
    });

    return client.replyMessage(event.replyToken, fortuneCategories);
  } catch (error) {
    console.error('Error processing birth chart:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ขออภัยค่ะ ไม่สามารถประมวลผล Birth Chart ได้ กรุณาลองใหม่อีกครั้งค่ะ'
    });
  }
}

async function handleFortuneCategory(event, category) {
  const userId = event.source.userId;
  const birthChart = await database.getBirthChart(userId);

  if (!birthChart) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'กรุณากรอกข้อมูลเกิดก่อนค่ะ 2'
    });
  }

  // Always redirect to input page for additional data - users need to re-input each time
  if (category === 'ดวงธุรกิจ') {
    return redirectToInputPage(event, 'ดวงธุรกิจ');
  } else if (category === 'พบรัก') {
    return redirectToInputPage(event, 'พบรัก');
  } else if (category === 'ย้ายงาน') {
    return redirectToInputPage(event, 'ย้ายงาน');
  } else if (category === 'ซื้อหวย') {
    return redirectToInputPage(event, 'ซื้อหวย');
  }

  try {
    // Show loading animation while processing AI request
    try {
      await showLoadingAnimation(userId, 8);
    } catch (loadingError) {
      console.warn('Failed to show loading animation:', loadingError);
      // Continue without loading animation if it fails
    }

    // Prepare additional data for fortune calculation
    const additionalData = await database.getAllAdditionalData(userId);

    let fortuneResult = await fortuneService.getFortune(birthChart, category, additionalData, 'chatgpt', userId);

    console.log("fortuneResult",fortuneResult)
    
    // Add quota information to the result
    if (userId) {
      const userQuota = await database.getUserQuota(userId);
      const quotaInfo = `\n\n📊 **สถานะการใช้งาน**\n🔢 สิทธิ์คงเหลือ: ${userQuota.remainingQueries} ครั้ง\n📈 ใช้ไปแล้ว: ${userQuota.usedQueries} ครั้ง\n💯 สิทธิ์ทั้งหมด: ${userQuota.totalQueries} ครั้ง`;
      fortuneResult += quotaInfo;
    }
    
    // Return plain text instead of flex message
    try {
      console.log('Attempting to send message:', {
        replyToken: event.replyToken,
        textLength: fortuneResult?.length || 0,
        textPreview: fortuneResult?.substring(0, 100) + '...'
      });
      
      // Validate and sanitize the message
      let messageText = fortuneResult;
      
      // Check if message is too long (LINE limit is 5000 characters)
      if (messageText && messageText.length > 5000) {
        messageText = messageText.substring(0, 4900) + '...\n\n(ข้อความถูกย่อเนื่องจากความยาวเกินกำหนด)';
      }
      
      // Check if message is empty or null
      if (!messageText || messageText.trim() === '') {
        messageText = 'ขออภัยค่ะ ไม่สามารถดูโชคลาภได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ';
      }
      
      return await client.replyMessage(event.replyToken, {
        type: 'text',
        text: messageText
      });
    } catch (lineError) {
      console.error('LINE API Error:', {
        error: lineError.message,
        statusCode: lineError.statusCode,
        originalError: lineError.originalError?.response?.data || lineError.originalError
      });
      
      // Try sending a simple fallback message
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ขออภัยค่ะ มีปัญหาในการส่งข้อมูลโชคลาภ กรุณาลองใหม่อีกครั้งค่ะ'
      });
    }
  } catch (error) {
    console.error('Error getting fortune:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ขออภัยค่ะ ไม่สามารถดูโชคลาภได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ'
    });
  }
}

async function processFortuneCalculation(event, category) {
  const userId = event.source.userId;
  
  // Prevent duplicate requests
  if (processingUsers.has(userId)) {
    console.log(`User ${userId} is already being processed, ignoring duplicate request`);
    return;
  }
  
  processingUsers.add(userId);
  
  try {
    let birthChart = await database.getBirthChart(userId);
    const birthData = await database.getBirthData(userId);

    // If no birth data, ask user to input
    if (!birthData) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'กรุณากรอกข้อมูลเกิดก่อนค่ะ'
      });
    }

    // If birth data exists but no birth chart, regenerate it
    if (!birthChart && birthData) {
      console.log(`Regenerating birth chart for user ${userId}`);
      try {
        birthChart = await birthChartService.calculateBirthChart(birthData);
        await database.saveBirthChart(userId, birthChart);
      } catch (error) {
        console.error('Error regenerating birth chart:', error);
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'เกิดข้อผิดพลาดในการคำนวณดวง กรุณาลองใหม่อีกครั้งค่ะ'
        });
      }
    }

    if (!birthChart) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'กรุณากรอกข้อมูลเกิดก่อนค่ะ'
      });
    }

    // Show loading animation while processing AI request
    try {
      await showLoadingAnimation(userId, 8);
    } catch (loadingError) {
      console.warn('Failed to show loading animation:', loadingError);
      // Continue without loading animation if it fails
    }

    // Prepare additional data for fortune calculation
    const additionalData = await database.getAllAdditionalData(userId);

    // Generate cache key
    const cacheKey = database.generateCacheKey(userId, category, birthChart, additionalData);
    
    // Check if we have cached result
    const cachedResult = await database.getFortuneCache(cacheKey);
    
    let fortuneResult;
    let isCached = false;
    
    if (cachedResult) {
      // Use cached result
      fortuneResult = cachedResult.result;
      isCached = true;
      console.log("Using cached fortune result for", category);
      
      // Add cache info to result
      const analysisInfo = cachedResult.analysisDateTime;
      const cacheNote = `\n\n📅 ข้อมูลดวง${analysisInfo.type} วันที่ ${analysisInfo.date}${analysisInfo.time !== 'ไม่ระบุ' ? ` เวลา ${analysisInfo.time}` : ''}\n(ข้อมูลจากการวิเคราะห์ครั้งก่อน)`;
      fortuneResult += cacheNote;
    } else {
      // Get new result from AI
      fortuneResult = await fortuneService.getFortune(birthChart, category, additionalData, 'chatgpt', userId);
      
      // Cache the result
      await database.setFortuneCache(cacheKey, fortuneResult, category, additionalData);
      console.log("Cached new fortune result for", category);
    }

    console.log("fortuneResult", fortuneResult);
    
    // Add quota information to the result
    if (!isCached && userId) {
      const userQuota = await database.getUserQuota(userId);
      const quotaInfo = `\n\n📊 **สถานะการใช้งาน**\n🔢 สิทธิ์คงเหลือ: ${userQuota.remainingQueries} ครั้ง\n📈 ใช้ไปแล้ว: ${userQuota.usedQueries} ครั้ง\n💯 สิทธิ์ทั้งหมด: ${userQuota.totalQueries} ครั้ง`;
      fortuneResult += quotaInfo;
    }
    
    // Return plain text instead of flex message
    try {
      console.log('Attempting to send message:', {
        replyToken: event.replyToken,
        textLength: fortuneResult?.length || 0,
        textPreview: fortuneResult?.substring(0, 100) + '...'
      });
      
      // Validate and sanitize the message
      let messageText = fortuneResult;
      
      // Check if message is too long (LINE limit is 5000 characters)
      if (messageText && messageText.length > 5000) {
        messageText = messageText.substring(0, 4900) + '...\n\n(ข้อความถูกย่อเนื่องจากความยาวเกินกำหนด)';
      }
      
      // Check if message is empty or null
      if (!messageText || messageText.trim() === '') {
        messageText = 'ขออภัยค่ะ ไม่สามารถดูโชคลาภได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ';
      }
      
      return await client.replyMessage(event.replyToken, {
        type: 'text',
        text: messageText
      });
    } catch (lineError) {
      console.error('LINE API Error:', {
        error: lineError.message,
        statusCode: lineError.statusCode,
        originalError: lineError.originalError?.response?.data || lineError.originalError
      });
      
      // Try sending a simple fallback message
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ขออภัยค่ะ มีปัญหาในการส่งข้อมูลโชคลาภ กรุณาลองใหม่อีกครั้งค่ะ'
      });
    }
  } catch (error) {
    console.error('Error getting fortune:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ขออภัยค่ะ ไม่สามารถดูโชคลาภได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ'
    });
  } finally {
    // Always remove user from processing set
    processingUsers.delete(userId);
  }
}

async function handlePostback(event) {
  const data = event.postback.data;
  
  // Handle category selection postbacks
  if (data.startsWith('action=select_category')) {
    const params = new URLSearchParams(data);
    const action = params.get('action');
    const category = params.get('category');
    
    if (action === 'select_category' && category) {
      const userId = event.source.userId;
      // Check if user has cached birth data
      const cachedBirthChart = await database.getBirthChart(userId);
      const cachedBirthData = await database.getBirthData(userId);
      
      if (cachedBirthChart && cachedBirthData) {
        console.log(`Using cached birth data for user ${userId}, saved at ${cachedBirthData.timestamp}`);
        return handleFortuneCategory(event, category);
      } else {
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'กรุณากรอกข้อมูลเกิดก่อนค่ะ'
        });
      }
    }
  }

  // Handle fortune analysis postbacks
  if (data.startsWith('action=analyze_')) {
    const params = new URLSearchParams(data);
    const action = params.get('action');
    const category = params.get('category');
    
    if (action && category) {
      // Map actions to categories for fortune analysis
      const actionMap = {
        'analyze_lottery': 'ซื้อหวย',
        'analyze_love': 'พบรัก',
        'analyze_business': 'ดวงธุรกิจ',
        'analyze_relocation': 'ย้ายงาน'
      };
      
      if (actionMap[action] === category) {
        // Call fortune calculation directly instead of handleFortuneCategory
        return processFortuneCalculation(event, category);
      }
    }
  }
  
  if (data === 'action=analyze_again') {
    // Show fortune categories again
    const fortuneCategories = {
      type: 'flex',
      altText: 'เลือกหมวดโชคลาภ',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'เลือกหมวดโชคลาภที่ต้องการวิเคราะห์ใหม่ค่ะ 🌟',
              weight: 'bold',
              size: 'lg'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '🎰 ซื้อหวย',
                data: 'action=select_category&category=ซื้อหวย'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '💕 พบรัก',
                data: 'action=select_category&category=พบรัก'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '💼 ดวงธุรกิจ',
                data: 'action=select_category&category=ดวงธุรกิจ'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '🔄 ย้ายงาน',
                data: 'action=select_category&category=ย้ายงาน'
              },
              style: 'primary'
            }
          ]
        }
      }
    };

    return client.replyMessage(event.replyToken, fortuneCategories);
  }
  
  if (data === 'action=delete_all_data') {
    const userId = event.source.userId;
    
    // Show confirmation message
    const confirmMessage = {
      type: 'flex',
      altText: 'ยืนยันการลบข้อมูล',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '⚠️ ยืนยันการลบข้อมูล',
              weight: 'bold',
              size: 'lg',
              color: '#FF6B6B'
            },
            {
              type: 'text',
              text: 'คุณต้องการลบข้อมูลทั้งหมดของคุณหรือไม่?',
              size: 'md',
              margin: 'md',
              wrap: true
            },
            {
              type: 'text',
              text: '• ข้อมูลเกิด\n• ข้อมูล Birth Chart\n• ข้อมูลเพิ่มเติมทั้งหมด\n• ประวัติการวิเคราะห์',
              size: 'sm',
              margin: 'md',
              color: '#666666'
            },
            {
              type: 'text',
              text: 'การกระทำนี้ไม่สามารถย้อนกลับได้',
              size: 'sm',
              margin: 'md',
              color: '#FF6B6B',
              weight: 'bold'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '❌ ยกเลิก',
                data: 'action=cancel_delete'
              },
              style: 'secondary'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '🗑️ ยืนยันลบข้อมูลทั้งหมด',
                data: 'action=confirm_delete_all'
              },
              style: 'primary',
              color: '#FF6B6B'
            }
          ]
        }
      }
    };
    
    return client.replyMessage(event.replyToken, confirmMessage);
  }
  
  if (data === 'action=cancel_delete') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ยกเลิกการลบข้อมูลแล้วค่ะ ข้อมูลของคุณยังคงอยู่ปลอดภัย ✅'
    });
  }
  
  if (data === 'action=confirm_delete_all') {
    const userId = event.source.userId;
    
    try {
      // Delete all user data
      await database.deleteBirthData(userId);
      await database.deleteBirthChart(userId);
      
      // Delete all additional data types
      await database.deleteAdditionalData(userId, 'lottery');
      await database.deleteAdditionalData(userId, 'business');
      await database.deleteAdditionalData(userId, 'partner');
      await database.deleteAdditionalData(userId, 'relocation');
      
      // Delete fortune cache (we need to add this method)
      await database.deleteUserFortuneCache(userId);
      
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '✅ ลบข้อมูลทั้งหมดเรียบร้อยแล้วค่ะ\n\nหากต้องการใช้งานอีกครั้ง กรุณากรอกข้อมูลเกิดใหม่ค่ะ'
      });
    } catch (error) {
      console.error('Error deleting user data:', error);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้งค่ะ'
      });
    }
  }
  
  if (data === 'action=view_history') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '📊 ฟีเจอร์ประวัติการวิเคราะห์จะเปิดให้บริการเร็วๆ นี้ค่ะ กรุณารอติดตามนะคะ 🙏'
    });
  }
  
  if (data === 'action=share_location') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'กรุณาแชร์ตำแหน่งปัจจุบันของคุณ หรือพิมพ์ข้อมูลการย้ายตามรูปแบบที่กำหนดค่ะ'
    });
  }

  // Handle text command simulated postbacks
  const params = new URLSearchParams(data);
  const action = params.get('action');
  const category = params.get('category');

  if (action === 'fortune' && category) {
    // Handle fortune request from text commands
    const userId = event.source.userId;
    let cachedBirthChart = await database.getBirthChart(userId);
    const cachedBirthData = await database.getBirthData(userId);
    
    // If no birth data, ask user to input
    if (!cachedBirthData) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'กรุณากรอกข้อมูลเกิดก่อนค่ะ'
      });
    }

    // If birth data exists but no birth chart, regenerate it
    if (!cachedBirthChart && cachedBirthData) {
      console.log(`Regenerating birth chart for user ${userId} from text command`);
      try {
        cachedBirthChart = await birthChartService.calculateBirthChart(cachedBirthData);
        await database.saveBirthChart(userId, cachedBirthChart);
      } catch (error) {
        console.error('Error regenerating birth chart:', error);
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'เกิดข้อผิดพลาดในการคำนวณดวง กรุณาลองใหม่อีกครั้งค่ะ'
        });
      }
    }
    
    if (cachedBirthChart && cachedBirthData) {
      console.log(`Using cached birth data for user ${userId} for category ${category}`);
      return handleFortuneCategory(event, category);
    } else {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'กรุณากรอกข้อมูลเกิดก่อนค่ะ'
      });
    }
  }

  if (action === 'input_birth_data') {
    // Handle birth data input request
    const flexMessage = {
      type: 'flex',
      altText: 'กรอกข้อมูลเกิด',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📅 กรอกข้อมูลเกิด',
              weight: 'bold',
              size: 'lg',
              color: '#7B68EE'
            },
            {
              type: 'text',
              text: 'กรุณากดปุ่มด้านล่างเพื่อกรอกข้อมูลเกิดของคุณ',
              size: 'sm',
              wrap: true,
              margin: 'md'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '📝 กรอกข้อมูลเกิด',
                uri: `https://liff.line.me/${config.line.liffId}`
              },
              style: 'primary',
              color: '#7B68EE'
            }
          ]
        }
      }
    };

    return client.replyMessage(event.replyToken, flexMessage);
  }

  // Default response for unknown postback
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: 'ขออภัยค่ะ ไม่เข้าใจคำสั่งที่เลือก กรุณาลองใหม่อีกครั้งค่ะ'
  });
}

async function redirectToInputPage(event, category) {
  const categoryMap = {
    'ซื้อหวย': { emoji: '🎰', text: 'ซื้อหวย' },
    'พบรัก': { emoji: '💕', text: 'พบรัก' },
    'ดวงธุรกิจ': { emoji: '💼', text: 'ดวงธุรกิจ' },
    'ย้ายงาน': { emoji: '🔄', text: 'ย้ายงาน' }
  };

  const categoryInfo = categoryMap[category] || { emoji: '✨', text: category };

  const flexMessage = {
    type: 'flex',
    altText: `กรอกข้อมูลเพิ่มเติมสำหรับ${categoryInfo.text}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${categoryInfo.emoji} ${categoryInfo.text}`,
            weight: 'bold',
            size: 'xl',
            color: '#7B68EE'
          },
          {
            type: 'text',
            text: 'กรุณากรอกข้อมูลเพิ่มเติมเพื่อการดูดวงที่แม่นยำยิ่งขึ้น',
            size: 'md',
            margin: 'md',
            wrap: true
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'คลิกปุ่มด้านล่างเพื่อเปิดหน้ากรอกข้อมูล',
            size: 'sm',
            margin: 'md',
            color: '#666666'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: 'กรอกข้อมูลเพิ่มเติม',
              uri: `https://miniapp.line.me/${config.line.liffId}/input.html?category=${encodeURIComponent(category)}`
            },
            style: 'primary',
            color: '#7B68EE'
          }
        ]
      }
    }
  };

  return client.replyMessage(event.replyToken, flexMessage);
}

async function handleGeneralMessage(event) {
  try {
    console.log('Sending general message to user:', event.source.userId);
    return await client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'กรุณาเลือกหมวดโชคลาภที่ต้องการดู หรือกรอกข้อมูลเกิดใหม่ค่ะ'
    });
  } catch (error) {
    console.error('Error sending general message:', {
      error: error.message,
      statusCode: error.statusCode,
      originalError: error.originalError?.response?.data
    });
    throw error;
  }
}

const webhookHandler = (req, res) => {
  // Validate request body
  if (!req.body || !req.body.events || !Array.isArray(req.body.events)) {
    console.log('Invalid webhook request body:', req.body);
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Handle LINE webhook verification
  if (req.body.events.length === 0) {
    return res.status(200).json({ message: 'Webhook verification successful' });
  }

  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => {
      console.log('Webhook handled successfully:', result);
      res.json(result);
    })
    .catch((err) => {
      console.error('Error handling webhook events:', {
        error: err.message,
        stack: err.stack,
        events: req.body.events
      });
      console.log("req.body.events", JSON.stringify(req.body.events, null, 2));
      res.status(500).json({ error: 'Internal server error' });
    });
};

// Functions to request additional data for different categories
async function requestBusinessData(event) {
  const flexMessage = {
    type: 'flex',
    altText: 'กรุณาใส่ข้อมูลการนัดหมายธุรกิจ',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '💼 ดวงธุรกิจ',
            weight: 'bold',
            size: 'xl',
            color: '#7B68EE'
          },
          {
            type: 'text',
            text: 'กรุณาใส่ข้อมูลการนัดหมายธุรกิจ',
            size: 'md',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'รูปแบบ: business:วันที่,เวลา,สถานที่',
            size: 'sm',
            margin: 'sm',
            color: '#999999'
          },
          {
            type: 'text',
            text: 'ตอบกลับ: business:15/07/2568,14:00,ห้องประชุม A',
            size: 'sm',
            margin: 'sm',
            color: '#999999'
          }
        ]
      }
    }
  };
  
  return client.replyMessage(event.replyToken, flexMessage);
}

async function requestPartnerData(event) {
  const flexMessage = {
    type: 'flex',
    altText: 'กรุณาใส่วันเกิดของคู่รัก',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '💕 พบรัก',
            weight: 'bold',
            size: 'xl',
            color: '#7B68EE'
          },
          {
            type: 'text',
            text: 'กรุณาใส่วันเกิดของคู่รัก',
            size: 'md',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'รูปแบบ: love:วันเกิด,เวลาเกิด',
            size: 'sm',
            margin: 'sm',
            color: '#999999'
          },
          {
            type: 'text',
            text: 'ตอบกลับ: love:15/07/2540,14:30',
            size: 'sm',
            margin: 'sm',
            color: '#999999'
          }
        ]
      }
    }
  };
  
  return client.replyMessage(event.replyToken, flexMessage);
}

async function requestRelocationData(event) {
  const flexMessage = {
    type: 'flex',
    altText: 'กรุณาใส่ข้อมูลการย้าย',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🔄 ย้ายงาน/ย้ายบ้าน',
            weight: 'bold',
            size: 'xl',
            color: '#7B68EE'
          },
          {
            type: 'text',
            text: 'กรุณาใส่ข้อมูลการย้าย',
            size: 'md',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'รูปแบบ: relocation:วันที่,เวลา,สถานที่',
            size: 'sm',
            margin: 'sm',
            color: '#999999'
          },
          {
            type: 'text',
            text: 'ตอบกลับ: relocation:15/07/2568,09:00,กรุงเทพฯ',
            size: 'sm',
            margin: 'sm',
            color: '#999999'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: 'แชร์ตำแหน่งปัจจุบัน',
              data: 'action=share_location'
            },
            style: 'secondary',
            margin: 'sm'
          }
        ]
      }
    }
  };
  
  return client.replyMessage(event.replyToken, flexMessage);
}

// Handle additional data inputs
async function handleAdditionalData(event, message) {
  const userId = event.source.userId;
  
  try {
    let category, data, responseText;
    
    if (message.startsWith('lottery:')) {
      category = 'ซื้อหวย';
      data = JSON.parse(message.replace('lottery:', ''));
      
      await database.setAdditionalData(userId, 'lottery', data);
      
      responseText = 'ได้รับข้อมูลการซื้อหวยแล้วค่ะ กำลังวิเคราะห์ดวงโชคลาภ...';
      
    } else if (message.startsWith('business:')) {
      category = 'ดวงธุรกิจ';
      data = JSON.parse(message.replace('business:', ''));
      
      await database.setAdditionalData(userId, 'business', data);
      
      responseText = 'ได้รับข้อมูลการนัดหมายธุรกิจแล้วค่ะ กำลังวิเคราะห์ดวงธุรกิจ...';
      
    } else if (message.startsWith('partner:')) {
      category = 'พบรัก';
      data = JSON.parse(message.replace('partner:', ''));
      
      await database.setAdditionalData(userId, 'partner', data);
      
      responseText = 'ได้รับข้อมูลคู่รักแล้วค่ะ กำลังวิเคราะห์ดวงความรัก...';
      
    } else if (message.startsWith('relocation:')) {
      category = 'ย้ายงาน';
      data = JSON.parse(message.replace('relocation:', ''));
      
      await database.setAdditionalData(userId, 'relocation', data);
      
      responseText = 'ได้รับข้อมูลการย้ายแล้วค่ะ กำลังวิเคราะห์ดวงการย้าย...';
      
    } else if (message.startsWith('love:')) {
      // Legacy support for old format
      category = 'พบรัก';
      const oldData = message.replace('love:', '').split(',');
      if (oldData.length >= 2) {
        await database.setAdditionalData(userId, 'partner', {
          birthdate: oldData[0].trim(),
          birthtime: oldData[1].trim()
        });
        responseText = 'ได้รับข้อมูลคู่รักแล้วค่ะ กำลังวิเคราะห์ดวงความรัก...';
      }
    }
    
    if (category && responseText) {
      // Create postback button for fortune analysis
      const categoryMap = {
        'ซื้อหวย': { emoji: '🎰', action: 'analyze_lottery' },
        'พบรัก': { emoji: '💕', action: 'analyze_love' },
        'ดวงธุรกิจ': { emoji: '💼', action: 'analyze_business' },
        'ย้ายงาน': { emoji: '🔄', action: 'analyze_relocation' }
      };

      const categoryInfo = categoryMap[category];

      const flexMessage = {
        type: 'flex',
        altText: `${responseText}`,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: responseText,
                weight: 'bold',
                size: 'md',
                color: '#7B68EE',
                wrap: true
              },
              {
                type: 'separator',
                margin: 'md'
              },
              {
                type: 'text',
                text: 'คลิกปุ่มด้านล่างเพื่อเริ่มการวิเคราะห์',
                size: 'sm',
                margin: 'md',
                color: '#666666'
              }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'postback',
                  label: `${categoryInfo.emoji} เริ่มวิเคราะห์${category}`,
                  data: `action=${categoryInfo.action}&category=${encodeURIComponent(category)}`
                },
                style: 'primary',
                color: '#7B68EE'
              }
            ]
          }
        }
      };

      return client.replyMessage(event.replyToken, flexMessage);
    }
    
    // If format is incorrect
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'รูปแบบข้อมูลไม่ถูกต้องค่ะ กรุณาลองใหม่อีกครั้งค่ะ'
    });
    
  } catch (error) {
    console.error('Error handling additional data:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ขออภัยค่ะ เกิดข้อผิดพลาดในการรับข้อมูล กรุณาลองใหม่อีกครั้งค่ะ'
    });
  }
}

// Handle text commands that simulate postback actions
async function handleTextCommand(event, action, category = null) {
  // Create a synthetic postback event
  const postbackEvent = {
    ...event,
    type: 'postback',
    postback: {
      data: category ? `action=${action}&category=${encodeURIComponent(category)}` : `action=${action}`
    }
  };
  
  // Call the postback handler
  return handlePostback(postbackEvent);
}

// Send welcome message for first-time users
async function sendWelcomeMessage(event) {
  const flexMessage = {
    type: 'flex',
    altText: 'ยินดีต้อนรับสู่ TuneHora - จูนโหรา จูนดวง จูนชีวิต',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'TuneHora',
            weight: 'bold',
            size: 'xl',
            color: '#7B68EE',
            align: 'center'
          },
          {
            type: 'text',
            text: 'จูนโหรา จูนดวง จูนชีวิต',
            size: 'md',
            color: '#666666',
            align: 'center',
            margin: 'sm'
          }
        ],
        paddingBottom: 'md'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🌟 ยินดีต้อนรับ',
            weight: 'bold',
            size: 'lg',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'คุณได้สิทธิ์ดูดวง 10 ครั้ง ฟรี!',
            size: 'md',
            color: '#FF6B6B',
            weight: 'bold',
            margin: 'sm'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'text',
            text: '✅ ระบบหลัก',
            weight: 'bold',
            size: 'md',
            margin: 'md'
          },
          {
            type: 'text',
            text: '• แชทบอทไลน์ที่ตอบสนองได้ดี\n• LIFF App กรอกข้อมูลเกิดสะดวก\n• ผสานระบบ AI เข้ากับการดูดวง\n• Swiss Ephemeris คำนวณแม่นยำ',
            size: 'sm',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'text',
            text: '✅ ฟีเจอร์ครบครัน',
            weight: 'bold',
            size: 'md',
            margin: 'md'
          },
          {
            type: 'text',
            text: '• 4 หมวดโชคลาภ: ซื้อหวย, พบรัก, ดวงธุรกิจ, ย้ายงาน\n• ผลลัพธ์เป็นภาษาไทย อ่านง่าย\n• คำนวณคะแนนโชคลาภจากดาวจริง\n• แสดงเลขเด็ดเมื่อดวงดี (>80)',
            size: 'sm',
            wrap: true,
            margin: 'sm'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '🌟 เริ่มต้นดูดวง',
              uri: `https://miniapp.line.me/${config.line.liffId}`
            },
            style: 'primary',
            color: '#7B68EE',
            margin: 'sm'
          },
          {
            type: 'text',
            text: 'หรือพิมพ์ "เริ่มต้น" เพื่อเริ่มใช้งาน',
            size: 'xs',
            color: '#999999',
            align: 'center',
            margin: 'sm'
          }
        ]
      }
    }
  };

  return client.replyMessage(event.replyToken, flexMessage);
}

// Admin function to add quota for users
async function handleAdminAddQuota(event, message) {
  const userId = event.source.userId;
  
  try {
    // Parse admin command: admin:addquota:targetUserId:amount
    const parts = message.split(':');
    if (parts.length < 3) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'รูปแบบคำสั่ง: admin:addquota:targetUserId:amount\nตัวอย่าง: admin:addquota:U123456:10'
      });
    }

    const targetUserId = parts[2];
    const amount = parseInt(parts[3]) || 10;

    if (!targetUserId) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'กรุณาระบุ User ID ที่ต้องการเพิ่ม quota'
      });
    }

    // Add quota for target user
    const updatedQuota = await database.addUserQuota(targetUserId, amount);
    
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `✅ เพิ่ม quota สำเร็จ!\n\nUser ID: ${targetUserId}\nเพิ่ม: ${amount} ครั้ง\nคงเหลือ: ${updatedQuota.remainingQueries} ครั้ง\nรวมทั้งหมด: ${updatedQuota.totalQueries} ครั้ง`
    });

  } catch (error) {
    console.error('Error handling admin add quota:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ขออภัยค่ะ เกิดข้อผิดพลาดในการเพิ่ม quota'
    });
  }
}

// Function to check user's quota status
async function handleQuotaStatus(event) {
  const userId = event.source.userId;
  
  try {
    const quota = await database.getUserQuota(userId);
    
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `📊 **สถานะการใช้งานของคุณ**

🔢 **สิทธิ์คงเหลือ:** ${quota.remainingQueries} ครั้ง
📈 **ใช้ไปแล้ว:** ${quota.usedQueries} ครั้ง
💯 **สิทธิ์ทั้งหมด:** ${quota.totalQueries} ครั้ง

📅 **อัพเดทล่าสุด:** ${new Date(quota.lastUpdated).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}

${quota.remainingQueries === 0 ? '⚠️ **หมดสิทธิ์แล้ว** กรุณาติดต่อ Admin เพื่อเพิ่มสิทธิ์' : '✅ **ยังมีสิทธิ์ใช้งาน**'}`
    });

  } catch (error) {
    console.error('Error checking quota status:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ขออภัยค่ะ เกิดข้อผิดพลาดในการตรวจสอบสถานะ'
    });
  }
}

module.exports = webhookHandler;
module.exports.__handleBirthChart = handleBirthChart;
module.exports.__handleEvent = handleEvent;
module.exports.__handlePostback = handlePostback;