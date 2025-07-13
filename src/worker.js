// Cloudflare Worker for LuckSeeker LINE Bot
import lineWebhook from './controllers/lineController';

// HTML content for static pages
const HTML_PAGES = {
  home: `<!DOCTYPE html>
<html>
<head>
    <title>LuckSeeker LINE Bot</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .title { color: #7B68EE; font-size: 2em; margin-bottom: 20px; }
        .status { color: #4CAF50; font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🌟 LuckSeeker LINE Bot</h1>
        <p class="status">✅ Bot is running successfully!</p>
        <p>จูนโหรา จูนดวง จูนชีวิต</p>
        <p><em>Powered by Cloudflare Workers</em></p>
    </div>
</body>
</html>`,

  liff: `<!DOCTYPE html>
<html>
<head>
    <title>LuckSeeker - LIFF App</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 400px; margin: 0 auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        button { width: 100%; padding: 15px; background: #7B68EE; color: white; border: none; border-radius: 5px; font-size: 16px; }
        .title { text-align: center; color: #7B68EE; margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🌟 LuckSeeker</h1>
        <p style="text-align: center;">กรอกข้อมูลเกิดเพื่อเริ่มดูดวง</p>
        
        <form id="birthForm">
            <div class="form-group">
                <label for="gender">เพศ</label>
                <select id="gender" required>
                    <option value="">เลือกเพศ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="birthdate">วันเกิด</label>
                <input type="date" id="birthdate" required>
            </div>
            
            <div class="form-group">
                <label for="birthtime">เวลาเกิด</label>
                <input type="time" id="birthtime" required>
            </div>
            
            <div class="form-group">
                <label for="location">สถานที่เกิด</label>
                <input type="text" id="location" placeholder="เช่น กรุงเทพมหานคร" required>
            </div>
            
            <button type="submit">บันทึกข้อมูลเกิด</button>
        </form>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            liff.init({ liffId: '${LIFF_ID}' }).then(() => {
                console.log('LIFF initialized');
            });

            document.getElementById('birthForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = {
                    gender: document.getElementById('gender').value,
                    birthdate: document.getElementById('birthdate').value,
                    birthtime: document.getElementById('birthtime').value,
                    location: document.getElementById('location').value,
                    latitude: 13.7563, // Default Bangkok
                    longitude: 100.5018
                };

                const message = 'birth:' + JSON.stringify(formData);
                
                liff.sendMessages([{
                    type: 'text',
                    text: message
                }]).then(() => {
                    liff.closeWindow();
                }).catch((err) => {
                    console.error('Error sending message:', err);
                    alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
                });
            });
        });
    </script>
</body>
</html>`,

  birthchart: `<!DOCTYPE html>
<html>
<head>
    <title>Birth Chart - LuckSeeker</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        .title { color: #7B68EE; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🌟 Birth Chart</h1>
        <p>แผนภูมิเกิดจะแสดงที่นี่</p>
        <p><em>Feature coming soon...</em></p>
    </div>
</body>
</html>`,

  truemoney: `<!DOCTYPE html>
<html>
<head>
    <title>TrueMoney - LuckSeeker</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        .title { color: #7B68EE; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">💰 TrueMoney Integration</h1>
        <p>การเชื่อมต่อ TrueMoney จะแสดงที่นี่</p>
        <p><em>Feature coming soon...</em></p>
    </div>
</body>
</html>`
};

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Line-Signature',
};

// Environment variables
const getEnv = (env, key, defaultValue = null) => {
  return env[key] || defaultValue;
};

// Mock Express-like request/response objects for LINE webhook
class MockRequest {
  constructor(request, env) {
    this.body = null;
    this.headers = {};
    this.method = request.method;
    this.url = request.url;
    this.env = env;
    
    // Convert Headers to plain object
    for (const [key, value] of request.headers.entries()) {
      this.headers[key.toLowerCase()] = value;
    }
  }

  async init(request) {
    if (this.method === 'POST') {
      try {
        this.body = await request.json();
      } catch (error) {
        this.body = {};
      }
    }
  }
}

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.responseHeaders = { ...CORS_HEADERS };
    this.responseBody = '';
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(data) {
    this.responseHeaders['Content-Type'] = 'application/json';
    this.responseBody = JSON.stringify(data);
    return this;
  }

  send(data) {
    this.responseHeaders['Content-Type'] = 'text/plain';
    this.responseBody = data;
    return this;
  }

  sendFile(filePath) {
    // Handle static file serving
    const fileName = filePath.split('/').pop();
    
    if (fileName.includes('index.html') || filePath.includes('liff')) {
      this.responseHeaders['Content-Type'] = 'text/html';
      this.responseBody = HTML_PAGES.liff.replace('${LIFF_ID}', this.env?.LIFF_ID || '');
    } else if (fileName.includes('birthchart.html')) {
      this.responseHeaders['Content-Type'] = 'text/html';
      this.responseBody = HTML_PAGES.birthchart;
    } else if (fileName.includes('truemoney.html')) {
      this.responseHeaders['Content-Type'] = 'text/html';
      this.responseBody = HTML_PAGES.truemoney;
    } else {
      this.responseHeaders['Content-Type'] = 'text/html';
      this.responseBody = HTML_PAGES.home;
    }
    return this;
  }

  toResponse() {
    return new Response(this.responseBody, {
      status: this.statusCode,
      headers: this.responseHeaders
    });
  }
}

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    try {
      // Route handlers
      switch (path) {
        case '/health':
          return new Response(JSON.stringify({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            worker: 'Cloudflare'
          }), {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });

        case '/webhook':
          if (request.method === 'POST') {
            // Create mock Express-like objects
            const mockReq = new MockRequest(request, env);
            await mockReq.init(request);
            const mockRes = new MockResponse();
            mockRes.env = env;

            // Call LINE webhook handler
            try {
              await lineWebhook(mockReq, mockRes);
              return mockRes.toResponse();
            } catch (error) {
              console.error('Webhook error:', error);
              return new Response(JSON.stringify({ 
                error: 'Webhook processing failed',
                message: error.message 
              }), {
                status: 500,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
              });
            }
          }
          break;

        case '/test':
          if (request.method === 'POST') {
            const body = await request.json().catch(() => ({}));
            const headers = {};
            for (const [key, value] of request.headers.entries()) {
              headers[key] = value;
            }
            
            return new Response(JSON.stringify({
              message: 'Test endpoint working',
              receivedBody: body,
              receivedHeaders: headers,
              worker: 'Cloudflare'
            }), {
              status: 200,
              headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
          }
          break;

        case '/':
          return new Response(HTML_PAGES.home, {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'text/html' }
          });

        case '/liff':
          const liffHtml = HTML_PAGES.liff.replace('${LIFF_ID}', env?.LIFF_ID || '');
          return new Response(liffHtml, {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'text/html' }
          });

        case '/birthchart':
          return new Response(HTML_PAGES.birthchart, {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'text/html' }
          });

        case '/true':
          return new Response(HTML_PAGES.truemoney, {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'text/html' }
          });

        default:
          return new Response('Not Found', {
            status: 404,
            headers: CORS_HEADERS
          });
      }

      // Default response for unhandled cases
      return new Response('Method not allowed', {
        status: 405,
        headers: CORS_HEADERS
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }
};