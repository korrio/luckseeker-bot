const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const lineWebhook = require('./controllers/lineController');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// LINE webhook endpoint
app.post('/webhook', lineWebhook);

app.get('/', (req, res) => {
  res.send('LuckSeeker LINE Bot is running!');
});

app.get('/liff', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Test endpoint to debug webhook
app.post('/test', (req, res) => {
  console.log('Test POST received:');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({ 
    message: 'Test endpoint working',
    receivedBody: req.body,
    receivedHeaders: req.headers
  });
});

const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`LuckSeeker Bot running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
});