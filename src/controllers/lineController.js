const line = require('@line/bot-sdk');
const axios = require('axios');
const config = require('../config');
const fortuneService = require('../services/fortuneService');
const birthChartService = require('../services/birthChartService');

const lineConfig = {
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret
};

const client = new line.Client(lineConfig);

// Helper function to show loading animation using direct API call
async function showLoadingAnimation(userId, loadingSeconds = 20) {
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

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const message = event.message.text.trim();

  try {
    if (message === 'เริ่มต้น' || message.includes('สวัสดี') || message.includes('hello')) {
      return handleGreeting(event);
    }

    if (message.startsWith('birth:')) {
      return handleBirthChart(event, message);
    }

    if (message === 'ซื้อหวย' || message === 'พบรัก' || message === 'ดวงธุรกิจ' || message === 'ย้ายงาน') {
      return handleFortuneCategory(event, message);
    }

    return handleGeneralMessage(event);
  } catch (error) {
    console.error('Error handling event:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ขออภัยค่ะ เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้งค่ะ'
    });
  }
}

async function handleGreeting(event) {
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
                type: 'message',
                label: '🎰 ซื้อหวย',
                text: 'ซื้อหวย'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'message',
                label: '💕 พบรัก',
                text: 'พบรัก'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'message',
                label: '💼 ดวงธุรกิจ',
                text: 'ดวงธุรกิจ'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'message',
                label: '🔄 ย้ายงาน',
                text: 'ย้ายงาน'
              },
              style: 'primary'
            }
          ]
        }
      }
    };

    global.userBirthChart = global.userBirthChart || {};
    global.userBirthChart[event.source.userId] = birthChart;

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
  const birthChart = global.userBirthChart?.[userId];

  if (!birthChart) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'กรุณากรอกข้อมูลเกิดก่อนค่ะ'
    });
  }

  try {
    // Show loading animation while processing AI request
    try {
      await showLoadingAnimation(userId, 20);
    } catch (loadingError) {
      console.warn('Failed to show loading animation:', loadingError);
      // Continue without loading animation if it fails
    }

    const fortuneResult = await fortuneService.getFortune(birthChart, category);
    
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: fortuneResult
    });
  } catch (error) {
    console.error('Error getting fortune:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ขออภัยค่ะ ไม่สามารถดูโชคลาภได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ'
    });
  }
}

async function handleGeneralMessage(event) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: 'กรุณาเลือกหมวดโชคลาภที่ต้องการดู หรือกรอกข้อมูลเกิดใหม่ค่ะ'
  });
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
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Error handling webhook events:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
};

module.exports = webhookHandler;
module.exports.__handleBirthChart = handleBirthChart;
module.exports.__handleEvent = handleEvent;