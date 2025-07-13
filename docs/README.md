# LuckSeeker Documentation

Welcome to the LuckSeeker documentation! This directory contains comprehensive documentation for the LuckSeeker LINE chatbot project.

## 📋 Table of Contents

### Core Documentation
- **[Project Overview](./project-overview.md)** - Complete project information, features, and setup guide
- **[Installation Guide](./installation.md)** - Step-by-step installation and configuration
- **[Deployment Guide](./deployment.md)** - Production deployment options and best practices

### Feature Documentation
- **[Quota System](./quota-system.md)** - User quota management and limitations
- **[Text Commands](./text-commands.md)** - Supported text commands and usage
- **[Welcome System](./welcome-system.md)** - First-time user greeting system
- **[Loading Animation](./loading-animation.md)** - Loading animation implementation

### Technical Documentation
- **[Nginx Deployment](./nginx-deployment.md)** - Nginx reverse proxy configuration for hora.aq1.co
- **[Cloudflare Worker](./cloudflare-worker.md)** - Serverless deployment on Cloudflare Workers
- **[Worker Deployment](./worker-deployment.md)** - Worker-specific deployment guide
- **[Rich Message Implementation](./rich-message.md)** - Rich message and flex message implementation

### Additional Resources
- **[API Reference](./api-reference.md)** - API endpoints and usage
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions
- **[Contributing Guide](./contributing.md)** - How to contribute to the project

## 🌐 Quick Links

- **Production**: https://hora.aq1.co
- **Repository**: https://github.com/korrio/luckseeker-bot
- **LINE Developers**: https://developers.line.biz/

## 🚀 Quick Start

1. **Clone and Setup**
   ```bash
   git clone https://github.com/korrio/luckseeker-bot.git
   cd luckseeker-bot
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Development**
   ```bash
   npm install
   npm run dev
   ```

3. **Production (Docker)**
   ```bash
   docker-compose up -d
   ```

4. **Cloudflare Workers**
   ```bash
   npm run worker:deploy
   ```

## 💫 Features Overview

- 🤖 **Multi-AI Support**: ChatGPT, Claude, and Ollama (Gemma3)
- 🎯 **4 Fortune Categories**: ซื้อหวย, พบรัก, ดวงธุรกิจ, ย้ายงาน  
- 💬 **Text Commands**: Type commands directly in chat
- 🎯 **Quota System**: 10 queries per user with real-time tracking
- 🏠 **Welcome System**: TuneHora branded greeting for new users
- 🌍 **Production Ready**: Deployed on hora.aq1.co with SSL
- 🐳 **Docker Support**: Full containerization with Ollama service

## 📞 Support

For questions or issues:
1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Review [API Reference](./api-reference.md)
3. Create an issue on GitHub
4. Contact the development team

---

*Last updated: July 2025*