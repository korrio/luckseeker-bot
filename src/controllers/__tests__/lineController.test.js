const birthChartService = require('../../services/birthChartService');

// Create a better mock for the LINE client
const mockReplyMessage = jest.fn();
const mockClient = {
  replyMessage: mockReplyMessage
};

// Mock axios for loading animation API calls
const mockAxios = jest.fn();
jest.mock('axios', () => mockAxios);

// Mock the LINE SDK before requiring the controller
jest.mock('@line/bot-sdk', () => ({
  Client: jest.fn().mockImplementation(() => mockClient)
}));

// Mock config
jest.mock('../../config', () => ({
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'test-token',
    channelSecret: process.env.LINE_CHANNEL_SECRET || 'test-secret',
    liffId: process.env.LIFF_ID || 'test-liff-id'
  },
  swisseph: {
    ephePath: process.env.SWISSEPH_EPHE_PATH || './ephe'
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || 'test-openai-key',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'test-anthropic-key'
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'test'
  }
}));

jest.mock('../../services/birthChartService');
jest.mock('../../services/fortuneService');

const lineController = require('../lineController');
const fortuneService = require('../../services/fortuneService');

describe('handleBirthChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.userBirthChart = {};
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    delete global.userBirthChart;
  });

  describe('Successful birth chart generation', () => {
    test('should process valid birth chart data and return fortune categories', async () => {
      const mockBirthChart = {
        planets: {
          Sun: { longitude: 85.5, sign: 'Gemini', degree: 25 },
          Moon: { longitude: 142.3, sign: 'Leo', degree: 22 }
        },
        houses: {},
        aspects: [],
        timestamp: '2023-01-01T00:00:00.000Z'
      };

      birthChartService.generateBirthChart.mockResolvedValue(mockBirthChart);

      const event = {
        source: { userId: 'test-user-123' },
        replyToken: 'test-reply-token'
      };

      const message = 'birth:{"birthdate":"1990-01-15","birthtime":"14:30","latitude":13.7563,"longitude":100.5018,"gender":"male"}';

      const result = await lineController.__handleBirthChart(event, message);

      expect(birthChartService.generateBirthChart).toHaveBeenCalledWith({
        birthdate: '1990-01-15',
        birthtime: '14:30',
        latitude: 13.7563,
        longitude: 100.5018
      });

      expect(global.userBirthChart['test-user-123']).toBe(mockBirthChart);

      expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token', {
        type: 'flex',
        altText: 'เลือกหมวดโชคลาภ',
        contents: expect.objectContaining({
          type: 'bubble',
          body: expect.objectContaining({
            contents: expect.arrayContaining([
              expect.objectContaining({
                text: 'ได้ Birth Chart แล้วค่ะ! 🌟'
              })
            ])
          }),
          footer: expect.objectContaining({
            contents: expect.arrayContaining([
              expect.objectContaining({
                action: expect.objectContaining({
                  text: 'ซื้อหวย'
                })
              }),
              expect.objectContaining({
                action: expect.objectContaining({
                  text: 'พบรัก'
                })
              }),
              expect.objectContaining({
                action: expect.objectContaining({
                  text: 'ดวงธุรกิจ'
                })
              }),
              expect.objectContaining({
                action: expect.objectContaining({
                  text: 'ย้ายงาน'
                })
              })
            ])
          })
        })
      });
    });

    test('should handle different birth data formats', async () => {
      const mockBirthChart = {
        planets: { Sun: { longitude: 120, sign: 'Leo' } },
        houses: {},
        aspects: []
      };

      birthChartService.generateBirthChart.mockResolvedValue(mockBirthChart);

      const event = {
        source: { userId: 'test-user-456' },
        replyToken: 'test-reply-token-2'
      };

      const message = 'birth:{"birthdate":"1985-12-25","birthtime":"09:15","latitude":18.7883,"longitude":98.9853,"gender":"female"}';

      await lineController.__handleBirthChart(event, message);

      expect(birthChartService.generateBirthChart).toHaveBeenCalledWith({
        birthdate: '1985-12-25',
        birthtime: '09:15',
        latitude: 18.7883,
        longitude: 98.9853
      });

      expect(global.userBirthChart['test-user-456']).toBe(mockBirthChart);
    });
  });

  describe('Error handling', () => {
    test('should handle invalid JSON format', async () => {
      const event = {
        source: { userId: 'test-user-error' },
        replyToken: 'test-reply-token-error'
      };

      const message = 'birth:invalid-json-format';

      await lineController.__handleBirthChart(event, message);

      expect(console.error).toHaveBeenCalledWith(
        'Error processing birth chart:',
        expect.any(Error)
      );

      expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token-error', {
        type: 'text',
        text: 'ขออภัยค่ะ ไม่สามารถประมวลผล Birth Chart ได้ กรุณาลองใหม่อีกครั้งค่ะ'
      });
    });

    test('should handle birthChartService errors', async () => {
      birthChartService.generateBirthChart.mockRejectedValue(new Error('Service unavailable'));

      const event = {
        source: { userId: 'test-user-service-error' },
        replyToken: 'test-reply-token-service-error'
      };

      const message = 'birth:{"birthdate":"1990-01-15","birthtime":"14:30","latitude":13.7563,"longitude":100.5018,"gender":"male"}';

      await lineController.__handleBirthChart(event, message);

      expect(console.error).toHaveBeenCalledWith(
        'Error processing birth chart:',
        expect.any(Error)
      );

      expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token-service-error', {
        type: 'text',
        text: 'ขออภัยค่ะ ไม่สามารถประมวลผล Birth Chart ได้ กรุณาลองใหม่อีกครั้งค่ะ'
      });
    });

    test('should handle missing required fields', async () => {
      const event = {
        source: { userId: 'test-user-missing-fields' },
        replyToken: 'test-reply-token-missing-fields'
      };

      const message = 'birth:{"birthdate":"1990-01-15"}';

      await lineController.__handleBirthChart(event, message);

      expect(console.error).toHaveBeenCalledWith(
        'Missing required birth chart data:',
        expect.objectContaining({
          birthdate: '1990-01-15',
          birthtime: undefined,
          latitude: undefined,
          longitude: undefined
        })
      );
      expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token-missing-fields', {
        type: 'text',
        text: 'ขออภัยค่ะ ข้อมูลเกิดไม่ครบถ้วน กรุณากรอกข้อมูลใหม่อีกครั้งค่ะ'
      });
    });

    test('should handle missing latitude or longitude fields', async () => {
      const event = {
        source: { userId: 'test-user-missing-coords' },
        replyToken: 'test-reply-token-missing-coords'
      };

      const message = 'birth:{"birthdate":"1990-01-15","birthtime":"14:30","latitude":13.7563}';

      await lineController.__handleBirthChart(event, message);

      expect(console.error).toHaveBeenCalledWith(
        'Missing required birth chart data:',
        expect.objectContaining({
          birthdate: '1990-01-15',
          birthtime: '14:30',
          latitude: 13.7563,
          longitude: undefined
        })
      );
      expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token-missing-coords', {
        type: 'text',
        text: 'ขออภัยค่ะ ข้อมูลเกิดไม่ครบถ้วน กรุณากรอกข้อมูลใหม่อีกครั้งค่ะ'
      });
    });
  });

  describe('Edge cases', () => {
    test('should handle empty birth data', async () => {
      const event = {
        source: { userId: 'test-user-empty' },
        replyToken: 'test-reply-token-empty'
      };

      const message = 'birth:{}';

      await lineController.__handleBirthChart(event, message);

      expect(console.error).toHaveBeenCalledWith(
        'Missing required birth chart data:',
        expect.objectContaining({
          birthdate: undefined,
          birthtime: undefined,
          latitude: undefined,
          longitude: undefined
        })
      );
      expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token-empty', {
        type: 'text',
        text: 'ขออภัยค่ะ ข้อมูลเกิดไม่ครบถ้วน กรุณากรอกข้อมูลใหม่อีกครั้งค่ะ'
      });
    });

    test('should handle multiple users simultaneously', async () => {
      const mockBirthChart1 = { planets: { Sun: { longitude: 85.5 } } };
      const mockBirthChart2 = { planets: { Moon: { longitude: 142.3 } } };

      birthChartService.generateBirthChart
        .mockResolvedValueOnce(mockBirthChart1)
        .mockResolvedValueOnce(mockBirthChart2);

      const event1 = {
        source: { userId: 'user-1' },
        replyToken: 'token-1'
      };
      const event2 = {
        source: { userId: 'user-2' },
        replyToken: 'token-2'
      };

      const message1 = 'birth:{"birthdate":"1990-01-15","birthtime":"14:30","latitude":13.7563,"longitude":100.5018,"gender":"male"}';
      const message2 = 'birth:{"birthdate":"1985-06-20","birthtime":"08:45","latitude":18.7883,"longitude":98.9853,"gender":"female"}';

      await Promise.all([
        lineController.__handleBirthChart(event1, message1),
        lineController.__handleBirthChart(event2, message2)
      ]);

      expect(global.userBirthChart['user-1']).toBe(mockBirthChart1);
      expect(global.userBirthChart['user-2']).toBe(mockBirthChart2);
      expect(mockReplyMessage).toHaveBeenCalledTimes(2);
    });

    test('should overwrite existing birth chart for same user', async () => {
      const mockBirthChart1 = { planets: { Sun: { longitude: 85.5 } } };
      const mockBirthChart2 = { planets: { Sun: { longitude: 120.0 } } };

      birthChartService.generateBirthChart
        .mockResolvedValueOnce(mockBirthChart1)
        .mockResolvedValueOnce(mockBirthChart2);

      const event = {
        source: { userId: 'test-user-overwrite' },
        replyToken: 'test-reply-token'
      };

      const message1 = 'birth:{"birthdate":"1990-01-15","birthtime":"14:30","latitude":13.7563,"longitude":100.5018,"gender":"male"}';
      const message2 = 'birth:{"birthdate":"1990-01-15","birthtime":"16:30","latitude":13.7563,"longitude":100.5018,"gender":"male"}';

      await lineController.__handleBirthChart(event, message1);
      await lineController.__handleBirthChart(event, message2);

      expect(global.userBirthChart['test-user-overwrite']).toBe(mockBirthChart2);
    });

    test('should handle extreme coordinate values', async () => {
      const mockBirthChart = { planets: {}, houses: {}, aspects: [] };
      birthChartService.generateBirthChart.mockResolvedValue(mockBirthChart);

      const event = {
        source: { userId: 'test-user-extreme' },
        replyToken: 'test-reply-token-extreme'
      };

      const message = 'birth:{"birthdate":"2000-01-01","birthtime":"12:00","latitude":90,"longitude":180,"gender":"other"}';

      await lineController.__handleBirthChart(event, message);

      expect(birthChartService.generateBirthChart).toHaveBeenCalledWith({
        birthdate: '2000-01-01',
        birthtime: '12:00',  
        latitude: 90,
        longitude: 180
      });

      expect(global.userBirthChart['test-user-extreme']).toBe(mockBirthChart);
    });
  });

  describe('Message format validation', () => {
    test('should handle malformed message prefix', async () => {
      const event = {
        source: { userId: 'test-user-malformed' },
        replyToken: 'test-reply-token-malformed'
      };

      const message = 'birth{"birthdate":"1990-01-15"}'; // Missing colon

      await lineController.__handleBirthChart(event, message);

      expect(console.error).toHaveBeenCalled();
      expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token-malformed', {
        type: 'text',
        text: 'ขออภัยค่ะ ไม่สามารถประมวลผล Birth Chart ได้ กรุณาลองใหม่อีกครั้งค่ะ'
      });
    });

    test('should handle nested JSON objects', async () => {
      const event = {
        source: { userId: 'test-user-nested' },
        replyToken: 'test-reply-token-nested'
      };

      const message = 'birth:{"birthdate":"1990-01-15","birthtime":"14:30","location":{"latitude":13.7563,"longitude":100.5018},"gender":"male"}';

      await lineController.__handleBirthChart(event, message);

      // The nested structure should trigger validation error since lat/long are not at top level
      expect(console.error).toHaveBeenCalledWith(
        'Missing required birth chart data:',
        expect.objectContaining({
          birthdate: '1990-01-15',
          birthtime: '14:30',
          latitude: undefined,
          longitude: undefined
        })
      );
      expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token-nested', {
        type: 'text',
        text: 'ขออภัยค่ะ ข้อมูลเกิดไม่ครบถ้วน กรุณากรอกข้อมูลใหม่อีกครั้งค่ะ'
      });
    });
  });
});

describe('handleFortuneCategory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.userBirthChart = {};
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    delete global.userBirthChart;
  });

  test('should show loading animation and get fortune result', async () => {
    const userId = 'test-user-fortune';
    const mockBirthChart = {
      planets: { Sun: { longitude: 85.5 } },
      houses: {},
      aspects: []
    };
    const mockFortuneResult = 'มีโชคลาภดีในช่วงนี้ค่ะ';

    // Set up birth chart for user
    global.userBirthChart[userId] = mockBirthChart;
    
    // Mock fortune service and axios
    fortuneService.getFortune.mockResolvedValue(mockFortuneResult);
    mockAxios.mockResolvedValue({ status: 200 });

    const event = {
      source: { userId },
      replyToken: 'test-reply-token'
    };

    // Since we don't have direct access to handleFortuneCategory, 
    // we'll test through handleEvent by sending a fortune category message
    const mockEvent = {
      type: 'message',
      message: { type: 'text', text: 'ซื้อหวย' },
      source: { userId },
      replyToken: 'test-reply-token'
    };

    await lineController.__handleEvent(mockEvent);

    // Verify loading animation API was called via axios
    expect(mockAxios).toHaveBeenCalledWith({
      method: "post",
      url: "https://api.line.me/v2/bot/chat/loading/start",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token"
      },
      data: { 
        chatId: userId,
        loadingSeconds: 20
      }
    });

    // Verify fortune service was called
    expect(fortuneService.getFortune).toHaveBeenCalledWith(mockBirthChart, 'ซื้อหวย');

    // Verify reply message was sent with rich message format
    expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token', expect.objectContaining({
      type: 'flex',
      altText: expect.stringContaining('ผลการวิเคราะห์โชคลาภ'),
      contents: expect.objectContaining({
        type: 'bubble',
      })
    }));
  });

  test('should handle loading animation failure gracefully', async () => {
    const userId = 'test-user-loading-fail';
    const mockBirthChart = { planets: {}, houses: {}, aspects: [] };
    const mockFortuneResult = 'ผลการทำนาย';

    global.userBirthChart[userId] = mockBirthChart;
    
    // Mock loading animation to fail
    mockAxios.mockRejectedValue(new Error('Loading animation failed'));
    fortuneService.getFortune.mockResolvedValue(mockFortuneResult);

    const mockEvent = {
      type: 'message',
      message: { type: 'text', text: 'พบรัก' },
      source: { userId },
      replyToken: 'test-reply-token'
    };

    await lineController.__handleEvent(mockEvent);

    // Verify warning was logged
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to show loading animation:',
      expect.any(Error)
    );

    // Verify fortune service was still called despite loading animation failure
    expect(fortuneService.getFortune).toHaveBeenCalledWith(mockBirthChart, 'พบรัก');

    // Verify reply message was sent with rich message format
    expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token', expect.objectContaining({
      type: 'flex',
      altText: expect.stringContaining('ผลการวิเคราะห์โชคลาภ'),
      contents: expect.objectContaining({
        type: 'bubble',
      })
    }));
  });

  test('should handle missing birth chart', async () => {
    const userId = 'test-user-no-chart';

    const mockEvent = {
      type: 'message',
      message: { type: 'text', text: 'ดวงธุรกิจ' },
      source: { userId },
      replyToken: 'test-reply-token'
    };

    await lineController.__handleEvent(mockEvent);

    // Should not call loading animation for missing birth chart
    expect(mockAxios).not.toHaveBeenCalled();

    // Should not call fortune service
    expect(fortuneService.getFortune).not.toHaveBeenCalled();

    // Should send message asking for birth chart data
    expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token', {
      type: 'text',
      text: 'กรุณากรอกข้อมูลเกิดก่อนค่ะ'
    });
  });

  test('should handle fortune service error', async () => {
    const userId = 'test-user-fortune-error';
    const mockBirthChart = { planets: {}, houses: {}, aspects: [] };

    global.userBirthChart[userId] = mockBirthChart;
    
    // Mock loading animation success and fortune service to fail
    mockAxios.mockResolvedValue({ status: 200 });
    fortuneService.getFortune.mockRejectedValue(new Error('Fortune service error'));

    const mockEvent = {
      type: 'message',
      message: { type: 'text', text: 'ย้ายงาน' },
      source: { userId },
      replyToken: 'test-reply-token'
    };

    await lineController.__handleEvent(mockEvent);

    // Verify loading animation API was called
    expect(mockAxios).toHaveBeenCalledWith({
      method: "post",
      url: "https://api.line.me/v2/bot/chat/loading/start",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token"
      },
      data: { 
        chatId: userId,
        loadingSeconds: 20
      }
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Error getting fortune:',
      expect.any(Error)
    );

    // Verify error message was sent
    expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token', {
      type: 'text',
      text: 'ขออภัยค่ะ ไม่สามารถดูโชคลาภได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ'
    });
  });
});

describe('Fortune Rich Message Parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.userBirthChart = {};
  });

  afterEach(() => {
    delete global.userBirthChart;
  });

  test('should parse high lucky score fortune result correctly', async () => {
    const mockFortuneText = `
────────────────────
**ช่วงเวลา** : 29/6/2568 19:50:09
**Lucky-Score** : 85 / 100  ✅ เหนือเกณฑ์  
**ดาวจรเด่น** : Jupiter Trine Sun (2.5°) | Venus Sextile Moon (1.8°)  
**เลขเด็ด** :  
- 23  (จากองศาดาวพฤหัสบดี)  
- 857  (จากการรวมองศาดาวจร)  
**คำแนะนำ** : ช่วงนี้มีโชคลาภดี เหมาะสำหรับการเสี่ยงโชค ควรใช้โอกาสนี้ให้เป็นประโยชน์
────────────────────`;

    const userId = 'test-user-rich';
    const mockBirthChart = { planets: {}, houses: {}, aspects: [] };

    global.userBirthChart[userId] = mockBirthChart;
    fortuneService.getFortune.mockResolvedValue(mockFortuneText);
    mockAxios.mockResolvedValue({ status: 200 });

    const mockEvent = {
      type: 'message',
      message: { type: 'text', text: 'ซื้อหวย' },
      source: { userId },
      replyToken: 'test-reply-token'
    };

    await lineController.__handleEvent(mockEvent);

    // Verify rich message contains parsed data
    const callArgs = mockReplyMessage.mock.calls[0];
    const richMessage = callArgs[1];

    expect(richMessage.type).toBe('flex');
    expect(richMessage.altText).toContain('Lucky Score: 85/100');
    expect(richMessage.contents.type).toBe('bubble');
  });

  test('should handle low lucky score without numbers correctly', async () => {
    const mockFortuneText = `
────────────────────
**ช่วงเวลา** : 29/6/2568 20:15:30
**Lucky-Score** : 45 / 100  ❌ ต่ำกว่าเกณฑ์  
**ดาวจรเด่น** : ไม่มีดาวจรที่ให้พลังบวกเพียงพอ
**เลขเด็ด** : ไม่แนะนำในช่วงนี้
**คำแนะนำ** : ช่วงนี้ดวงเสี่ยงโชคยังต่ำ ควรรอช่วงที่ดีกว่า
────────────────────`;

    const userId = 'test-user-low-score';
    const mockBirthChart = { planets: {}, houses: {}, aspects: [] };

    global.userBirthChart[userId] = mockBirthChart;
    fortuneService.getFortune.mockResolvedValue(mockFortuneText);
    mockAxios.mockResolvedValue({ status: 200 });

    const mockEvent = {
      type: 'message',
      message: { type: 'text', text: 'พบรัก' },
      source: { userId },
      replyToken: 'test-reply-token'
    };

    await lineController.__handleEvent(mockEvent);

    const callArgs = mockReplyMessage.mock.calls[0];
    const richMessage = callArgs[1];

    expect(richMessage.altText).toContain('Lucky Score: 45/100');
    expect(richMessage.contents.type).toBe('bubble');
  });
});

describe('Postback Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle analyze_again postback', async () => {
    const event = {
      type: 'postback',
      postback: { data: 'action=analyze_again' },
      source: { userId: 'test-user-postback' },
      replyToken: 'test-reply-token-postback'
    };

    await lineController.__handlePostback(event);

    expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token-postback', expect.objectContaining({
      type: 'flex',
      altText: 'เลือกหมวดโชคลาภ',
      contents: expect.objectContaining({
        type: 'bubble',
        footer: expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              action: expect.objectContaining({
                text: 'ซื้อหวย'
              })
            })
          ])
        })
      })
    }));
  });

  test('should handle view_history postback', async () => {
    const event = {
      type: 'postback',
      postback: { data: 'action=view_history' },
      source: { userId: 'test-user-history' },
      replyToken: 'test-reply-token-history'
    };

    await lineController.__handlePostback(event);

    expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token-history', {
      type: 'text',
      text: '📊 ฟีเจอร์ประวัติการวิเคราะห์จะเปิดให้บริการเร็วๆ นี้ค่ะ กรุณารอติดตามนะคะ 🙏'
    });
  });

  test('should handle unknown postback', async () => {
    const event = {
      type: 'postback',
      postback: { data: 'action=unknown' },
      source: { userId: 'test-user-unknown' },
      replyToken: 'test-reply-token-unknown'
    };

    await lineController.__handlePostback(event);

    expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token-unknown', {
      type: 'text',
      text: 'ขออภัยค่ะ ไม่เข้าใจคำสั่งที่เลือก กรุณาลองใหม่อีกครั้งค่ะ'
    });
  });

  test('should route postback events through handleEvent', async () => {
    const event = {
      type: 'postback',
      postback: { data: 'action=analyze_again' },
      source: { userId: 'test-user-route' },
      replyToken: 'test-reply-token-route'
    };

    await lineController.__handleEvent(event);

    expect(mockReplyMessage).toHaveBeenCalledWith('test-reply-token-route', expect.objectContaining({
      type: 'flex',
      altText: 'เลือกหมวดโชคลาภ'
    }));
  });
});