#!/bin/bash

# Domain Status Check Script for gear-score.com
# Run this script on your VPS to diagnose domain issues

echo "=== Domain Status Check for gear-score.com ==="
echo "Date: $(date)"
echo ""

# 1. Check DNS resolution
echo "1. Checking DNS resolution..."
nslookup gear-score.com
echo ""
nslookup www.gear-score.com
echo ""

# 2. Check if nginx is running
echo "2. Checking nginx status..."
sudo systemctl status nginx --no-pager
echo ""

# 3. Check nginx configuration
echo "3. Testing nginx configuration..."
sudo nginx -t
echo ""

# 4. Check if port 3000 is listening
echo "4. Checking if port 3000 is listening..."
sudo netstat -tlnp | grep :3000
echo ""

# 5. Check PM2 status
echo "5. Checking PM2 status..."
pm2 status
echo ""

# 6. Check if application is responding locally
echo "6. Testing local application response..."
curl -I http://127.0.0.1:3000 2>/dev/null || echo "Local application not responding"
echo ""

# 7. Check SSL certificate
echo "7. Checking SSL certificate..."
if [ -f "/etc/letsencrypt/live/gear-score.com/fullchain.pem" ]; then
    openssl x509 -in /etc/letsencrypt/live/gear-score.com/fullchain.pem -text -noout | grep -A2 "Validity"
else
    echo "SSL certificate not found at /etc/letsencrypt/live/gear-score.com/"
fi
echo ""

# 8. Check nginx sites configuration
echo "8. Checking nginx sites configuration..."
ls -la /etc/nginx/sites-enabled/ | grep gear-score
echo ""

# 9. Check nginx error logs
echo "9. Recent nginx error logs..."
sudo tail -10 /var/log/nginx/error.log
echo ""

# 10. Check application logs
echo "10. Recent application logs..."
pm2 logs gear-score --lines 10 --nostream
echo ""

# 11. Test domain connectivity
echo "11. Testing domain connectivity..."
curl -I https://gear-score.com 2>/dev/null || echo "Domain not accessible via HTTPS"
curl -I http://gear-score.com 2>/dev/null || echo "Domain not accessible via HTTP"
echo ""

echo "=== Diagnosis Complete ==="
echo ""
echo "Common fixes:"
echo "1. If DNS doesn't resolve: Check your domain registrar's DNS settings"
echo "2. If nginx config fails: Fix configuration and reload nginx"
echo "3. If port 3000 not listening: Restart PM2 application"
echo "4. If SSL certificate expired: Run 'sudo certbot renew'"
echo "5. If nginx sites not linked: Create symlink in sites-enabled"