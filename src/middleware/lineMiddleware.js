const line = require('@line/bot-sdk');
const config = require('../config');

const lineConfig = {
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret
};

// LINE webhook middleware with signature validation
const lineMiddleware = line.middleware(lineConfig);

// Custom middleware to handle ngrok and development environments
const devLineMiddleware = (req, res, next) => {
  // Skip signature validation in development if no secret is provided
  if (!config.line.channelSecret && config.server.nodeEnv === 'development') {
    console.log('Development mode: Skipping LINE signature validation');
    return next();
  }
  
  // Use official LINE middleware
  return lineMiddleware(req, res, next);
};

module.exports = devLineMiddleware;