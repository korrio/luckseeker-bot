// Worker-compatible version of LINE Controller
import { Client } from '@line/bot-sdk';
import { createMockEnv } from '../utils/worker-polyfills.js';

// Import services (these will need to be worker-compatible too)
// For now, we'll create a simplified version that works in Workers

const client = new Client({
  channelAccessToken: '', // Will be set from env
  channelSecret: ''       // Will be set from env
});

// Simplified webhook handler for Workers
export default async function webhookHandler(req, res, env) {
  try {
    // Initialize LINE client with environment variables
    const config = createMockEnv(env);
    const workerClient = new Client({
      channelAccessToken: config.line.channelAccessToken,
      channelSecret: config.line.channelSecret
    });

    console.log('Webhook request received:', {
      headers: req.headers,
      body: req.body
    });

    // Verify LINE signature (simplified)
    const signature = req.headers['x-line-signature'];
    if (!signature) {
      res.status(400).json({ error: 'Missing X-Line-Signature header' });
      return;
    }

    // Handle LINE events
    const events = req.body.events || [];
    
    for (const event of events) {
      console.log('Processing event:', event);
      
      switch (event.type) {
        case 'message':
          await handleMessage(event, workerClient, config);
          break;
        case 'postback':
          await handlePostback(event, workerClient, config);
          break;
        case 'follow':
          await handleFollow(event, workerClient, config);
          break;
        default:
          console.log('Unhandled event type:', event.type);
      }
    }

    res.status(200).json({ status: 'OK' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

async function handleMessage(event, client, config) {
  const userId = event.source.userId;
  const messageText = event.message.text;

  console.log('Handling message:', { userId, messageText });

  // Handle text commands
  if (messageText === 'วันเกิด') {
    return handleTextCommand(event, client, config, 'input_birth_data');
  } else if (messageText === 'ซื้อหวย') {
    return handleTextCommand(event, client, config, 'fortune', 'ซื้อหวย');
  } else if (messageText === 'พบรัก') {
    return handleTextCommand(event, client, config, 'fortune', 'พบรัก');
  } else if (messageText === 'ดวงธุรกิจ') {
    return handleTextCommand(event, client, config, 'fortune', 'ดวงธุรกิจ');
  } else if (messageText === 'ย้ายงาน') {
    return handleTextCommand(event, client, config, 'fortune', 'ย้ายงาน');
  } else if (messageText === 'ลบ' || messageText === 'ลบข้อมูล') {
    return handleTextCommand(event, client, config, 'delete_all_data');
  }

  // Simple responses for now (in a real implementation, this would use the full services)
  if (messageText?.includes('สวัสดี') || messageText?.includes('hello')) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'สวัสดีค่ะ! ยินดีต้อนรับสู่ LuckSeeker Bot 🌟\n\nกรุณากรอกข้อมูลเกิดเพื่อเริ่มดูดวงค่ะ'
    });
  } else if (messageText?.includes('quota')) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '📊 สถานะการใช้งาน\n\n🔢 สิทธิ์คงเหลือ: 10 ครั้ง\n📈 ใช้ไปแล้ว: 0 ครั้ง\n💯 สิทธิ์ทั้งหมด: 10 ครั้ง\n\n✅ ยังมีสิทธิ์ใช้งาน'
    });
  } else if (messageText?.startsWith('birth:')) {
    // Handle birth data (simplified)
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '✅ บันทึกข้อมูลเกิดเรียบร้อยแล้ว!\n\nตอนนี้คุณสามารถเลือกหมวดโชคลาภเพื่อดูดวงได้แล้วค่ะ'
    });
  } else {
    // Default response
    await client.replyMessage(event.replyToken, {
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
              text: '🌟 LuckSeeker',
              weight: 'bold',
              size: 'xl',
              color: '#7B68EE',
              align: 'center'
            },
            {
              type: 'text',
              text: 'เลือกหมวดโชคลาภที่ต้องการดูค่ะ',
              size: 'md',
              align: 'center',
              margin: 'md'
            },
            {
              type: 'separator',
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
                type: 'postback',
                label: '🎰 ซื้อหวย',
                data: 'action=fortune&category=ซื้อหวย'
              },
              style: 'primary',
              color: '#FF6B6B'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '💕 พบรัก',
                data: 'action=fortune&category=พบรัก'
              },
              style: 'primary',
              color: '#FF69B4',
              margin: 'sm'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '💼 ดวงธุรกิจ',
                data: 'action=fortune&category=ดวงธุรกิจ'
              },
              style: 'primary',
              color: '#4CAF50',
              margin: 'sm'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '🔄 ย้ายงาน',
                data: 'action=fortune&category=ย้ายงาน'
              },
              style: 'primary',
              color: '#2196F3',
              margin: 'sm'
            }
          ]
        }
      }
    });
  }
}

async function handlePostback(event, client, config) {
  const data = event.postback.data;
  const params = new URLSearchParams(data);
  const action = params.get('action');
  const category = params.get('category');

  console.log('Handling postback:', { action, category });

  if (action === 'fortune') {
    // Simplified fortune response
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `🔮 ดวง${category}\n\n⭐ โชคลาภ: ดี\n🎯 คะแนน: 85/100\n🎲 เลขเด็ด: 15, 748\n\n💡 คำแนะนำ: ช่วงนี้เป็นช่วงที่ดีสำหรับ${category} ควรใช้โอกาสนี้ให้เกิดประโยชน์สูงสุด\n\n🤖 Powered by LuckSeeker AI`
    });
  } else if (action === 'input_birth_data') {
    await client.replyMessage(event.replyToken, {
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
    });
  }
}

async function handleFollow(event, client, config) {
  const userId = event.source.userId;
  
  console.log('New follower:', userId);

  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: '🌟 ยินดีต้อนรับสู่ LuckSeeker!\n\nจูนโหรา จูนดวง จูนชีวิต\n\nคุณได้สิทธิ์ดูดวง 10 ครั้ง ฟรี!\n\nเริ่มต้นได้เลยโดยพิมพ์ "เริ่มต้น" ค่ะ'
  });
}