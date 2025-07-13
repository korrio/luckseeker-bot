# Nginx Deployment for hora.aq1.co

## Overview

This guide covers deploying LuckSeeker bot with Nginx reverse proxy for the domain `hora.aq1.co`.

## Configuration

### Domain Setup
- **Domain**: hora.aq1.co
- **SSL**: HTTPS with certificate
- **Backend**: luckseeker-app:3000
- **Rate Limiting**: API and webhook protection

### Nginx Features
- ✅ HTTPS redirect
- ✅ SSL termination
- ✅ Rate limiting
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

### 2. SSL Certificate Setup
```bash
# Option A: Let's Encrypt (Recommended)
sudo certbot certonly --standalone -d hora.aq1.co
sudo cp /etc/letsencrypt/live/hora.aq1.co/fullchain.pem ./ssl/hora.aq1.co.crt
sudo cp /etc/letsencrypt/live/hora.aq1.co/privkey.pem ./ssl/hora.aq1.co.key

# Option B: Self-signed (Development only)
cd ssl/
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout hora.aq1.co.key \
  -out hora.aq1.co.crt \
  -subj "/C=TH/ST=Bangkok/L=Bangkok/O=LuckSeeker/CN=hora.aq1.co"
```

### 3. Deploy with Docker Compose
```bash
# Start all services including nginx
docker-compose up -d

# Check nginx status
docker-compose logs nginx

# Test configuration
curl -I https://hora.aq1.co/health
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

### SSL Configuration
- TLS 1.2/1.3 only
- Strong cipher suites
- OCSP stapling
- Session resumption

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
- HTTP/2 support
- Keep-alive connections
- Upstream load balancing

## Monitoring

### Health Checks
```bash
# Service availability
curl https://hora.aq1.co/health

# SSL certificate
openssl s_client -connect hora.aq1.co:443 -servername hora.aq1.co

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

1. **SSL Certificate Error**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/hora.aq1.co.crt -text -noout
   
   # Verify certificate chain
   openssl verify -CAfile ssl/hora.aq1.co.crt ssl/hora.aq1.co.crt
   ```

2. **502 Bad Gateway**
   ```bash
   # Check app container
   docker-compose ps luckseeker-app
   
   # Check app logs
   docker-compose logs luckseeker-app
   
   # Test internal connection
   docker-compose exec nginx curl http://luckseeker-app:3000/health
   ```

3. **Rate Limiting Issues**
   ```bash
   # Check rate limit zones
   docker-compose exec nginx nginx -T | grep limit_req
   
   # Reset rate limiting (restart nginx)
   docker-compose restart nginx
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

## Maintenance

### SSL Certificate Renewal
```bash
# Let's Encrypt auto-renewal
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew
sudo cp /etc/letsencrypt/live/hora.aq1.co/fullchain.pem ./ssl/hora.aq1.co.crt
sudo cp /etc/letsencrypt/live/hora.aq1.co/privkey.pem ./ssl/hora.aq1.co.key
docker-compose restart nginx
```

### Log Rotation
```bash
# Nginx log rotation
docker-compose exec nginx logrotate /etc/logrotate.d/nginx
```

### Backup
```bash
# Backup SSL certificates
tar -czf ssl-backup-$(date +%Y%m%d).tar.gz ssl/

# Backup nginx configuration
cp nginx.conf nginx.conf.backup
```

## Production Checklist

- [ ] DNS A record points to server
- [ ] Valid SSL certificate installed
- [ ] Nginx configuration tested
- [ ] Health checks passing
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Log rotation setup
- [ ] Certificate auto-renewal configured
- [ ] LINE Bot webhook updated
- [ ] LIFF app URL updated
- [ ] Monitoring alerts configured