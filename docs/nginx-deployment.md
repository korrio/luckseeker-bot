# Nginx Deployment for hora.aq1.co

## Overview

This guide covers deploying LuckSeeker bot with Nginx reverse proxy for the domain `hora.aq1.co`.

## Configuration

### Domain Setup
- **Domain**: hora.aq1.co
- **SSL**: HTTPS with Cloudflare SSL termination
- **Backend**: luckseeker-app:3000
- **Rate Limiting**: API and webhook protection

### Nginx Features
- ✅ HTTP only (SSL handled by Cloudflare)
- ✅ Real IP detection from Cloudflare
- ✅ Rate limiting for webhook and API
- ✅ Security headers
- ✅ Gzip compression
- ✅ Static file caching
- ✅ LINE webhook optimization

## Quick Start

### 1. DNS Configuration
Point `hora.aq1.co` to your server IP:
```
hora.aq1.co.    A    YOUR_SERVER_IP
```

### 2. Cloudflare Setup
```
SSL/TLS: Full (encrypt)
Proxy status: Proxied (orange cloud)
```

### 3. Deploy with Docker Compose
```bash
# Start all services including nginx
docker-compose up -d

# Check nginx status
docker-compose logs nginx

# Test configuration
curl -I http://YOUR_SERVER_IP/health
```

## Service Endpoints

### Public Endpoints
- **Homepage**: https://hora.aq1.co/
- **LIFF App**: https://hora.aq1.co/liff
- **Health Check**: https://hora.aq1.co/health

### LINE Bot Endpoints
- **Webhook**: https://hora.aq1.co/webhook
- **Static Files**: https://hora.aq1.co/public/*

### Rate Limits
- **Webhook**: 5 requests/second, burst 10
- **API**: 10 requests/minute, burst 20
- **Static Files**: No limit (cached)

## Security Features

### Cloudflare Integration
- Real IP detection from Cloudflare IP ranges
- CF-Connecting-IP header forwarding
- CF-Ray and CF-Visitor header support
- Automatic DDoS protection via Cloudflare

### Security Headers
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Access Control
- Block dot files (/.*)
- Block data directory (/data/)
- Client body size limit: 10MB

## Performance Optimizations

### Gzip Compression
- Text files, CSS, JS, JSON
- Minimum size: 1KB
- Compression ratio: ~70%

### Static File Caching
- Images, fonts, CSS, JS: 1 year
- Cache-Control: public, immutable
- ETag support

### Connection Pooling
- HTTP/1.1 support
- Keep-alive connections
- Upstream load balancing

## Monitoring

### Health Checks
```bash
# Service availability
curl https://hora.aq1.co/health

# Response time
curl -w "@curl-format.txt" -o /dev/null -s https://hora.aq1.co/
```

### Log Analysis
```bash
# Nginx access logs
docker-compose logs nginx | grep "GET /"

# Error logs
docker-compose logs nginx | grep "error"

# Rate limiting
docker-compose logs nginx | grep "limiting"
```

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   ```bash
   # Check app container
   docker-compose ps luckseeker-app
   
   # Check app logs
   docker-compose logs luckseeker-app
   
   # Test internal connection
   docker-compose exec nginx curl http://luckseeker-app:3000/health
   ```

2. **Rate Limiting Issues**
   ```bash
   # Check rate limit zones
   docker-compose exec nginx nginx -T | grep limit_req
   
   # Reset rate limiting (restart nginx)
   docker-compose restart nginx
   ```

3. **Cloudflare Real IP Issues**
   ```bash
   # Check if real IP is being detected
   docker-compose logs nginx | grep "CF-Connecting-IP"
   
   # Verify Cloudflare IP ranges
   docker-compose exec nginx nginx -T | grep set_real_ip_from
   ```

### Configuration Testing
```bash
# Test nginx config
docker-compose exec nginx nginx -t

# Reload configuration
docker-compose exec nginx nginx -s reload
```

## LINE Bot Configuration

Update your LINE Bot webhook URL to:
```
https://hora.aq1.co/webhook
```

Update your LIFF app URL to:
```
https://hora.aq1.co/liff
```

## Cloudflare Configuration

### SSL/TLS Settings
- **Encryption mode**: Full (encrypt)
- **Edge Certificates**: Universal SSL enabled
- **Always Use HTTPS**: On
- **HSTS**: Enabled

### Security Settings
- **Security Level**: Medium
- **Bot Fight Mode**: On
- **Challenge Passage**: 30 minutes

### Performance Settings
- **Auto Minify**: CSS, HTML, JavaScript
- **Brotli**: On
- **Early Hints**: On

## Maintenance

### Log Rotation
```bash
# Nginx log rotation
docker-compose exec nginx logrotate /etc/logrotate.d/nginx
```

### Backup
```bash
# Backup nginx configuration
cp nginx.conf nginx.conf.backup

# Backup docker-compose configuration
cp docker-compose.yml docker-compose.yml.backup
```

### Updates
```bash
# Update nginx image
docker-compose pull nginx
docker-compose up -d nginx

# Update all services
docker-compose pull
docker-compose up -d
```

## Production Checklist

- [ ] DNS A record points to server
- [ ] Cloudflare proxy enabled (orange cloud)
- [ ] Cloudflare SSL/TLS set to Full
- [ ] Nginx configuration tested
- [ ] Health checks passing
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Log rotation setup
- [ ] LINE Bot webhook updated to https://hora.aq1.co/webhook
- [ ] LIFF app URL updated to https://hora.aq1.co/liff
- [ ] Monitoring alerts configured

## Performance Metrics

### Expected Response Times
- **Health check**: < 50ms
- **Static files**: < 100ms
- **LIFF app**: < 200ms
- **Webhook**: < 2s (including AI processing)

### Capacity
- **Concurrent connections**: 1024
- **Webhook rate**: 5 req/s sustained, 15 req/s burst
- **API rate**: 10 req/min per IP
- **Static files**: Unlimited (cached by Cloudflare)