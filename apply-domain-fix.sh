#!/bin/bash

# Auto-fix script for gear-score.com domain issues
# Run this script on your VPS to apply all necessary fixes

echo "=== Applying Domain Fixes for gear-score.com ==="
echo "Date: $(date)"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script as root (use sudo)"
    exit 1
fi

# 1. Backup current configurations
echo "1. Creating backups..."
mkdir -p /root/nginx-backup-$(date +%Y%m%d)
cp /etc/nginx/sites-available/gear-score.com /root/nginx-backup-$(date +%Y%m%d)/ 2>/dev/null || echo "No existing nginx config to backup"
cp /var/www/gear-score/ecosystem.config.js /root/nginx-backup-$(date +%Y%m%d)/ 2>/dev/null || echo "No existing PM2 config to backup"
echo "Backups created in /root/nginx-backup-$(date +%Y%m%d)/"
echo ""

# 2. Copy updated nginx configuration
echo "2. Updating nginx configuration..."
if [ -f "/var/www/gear-score/nginx-gear-score.conf" ]; then
    cp /var/www/gear-score/nginx-gear-score.conf /etc/nginx/sites-available/gear-score.com
    echo "Nginx configuration updated"
else
    echo "ERROR: nginx-gear-score.conf not found in /var/www/gear-score/"
    echo "Please upload the updated configuration file first"
    exit 1
fi
echo ""

# 3. Create symbolic link if it doesn't exist
echo "3. Creating nginx symbolic link..."
if [ ! -L "/etc/nginx/sites-enabled/gear-score.com" ]; then
    ln -s /etc/nginx/sites-available/gear-score.com /etc/nginx/sites-enabled/gear-score.com
    echo "Symbolic link created"
else
    echo "Symbolic link already exists"
fi
echo ""

# 4. Test nginx configuration
echo "4. Testing nginx configuration..."
if nginx -t; then
    echo "Nginx configuration is valid"
else
    echo "ERROR: Nginx configuration is invalid"
    echo "Please check the configuration file"
    exit 1
fi
echo ""

# 5. Reload nginx
echo "5. Reloading nginx..."
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "Nginx reloaded successfully"
else
    echo "ERROR: Failed to reload nginx"
    systemctl status nginx
    exit 1
fi
echo ""

# 6. Update environment file for production
echo "6. Updating environment configuration..."
cd /var/www/gear-score
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "Production environment file applied"
else
    echo "WARNING: .env.production not found, using existing .env"
fi
echo ""

# 7. Restart PM2 application
echo "7. Restarting PM2 application..."
if [ -f "ecosystem.config.js" ]; then
    pm2 reload ecosystem.config.js --env production
    echo "PM2 application reloaded"
else
    echo "ERROR: ecosystem.config.js not found"
    exit 1
fi
echo ""

# 8. Wait for application to start
echo "8. Waiting for application to start..."
sleep 5
echo ""

# 9. Check application status
echo "9. Checking application status..."
pm2 status
echo ""

# 10. Test local connectivity
echo "10. Testing local connectivity..."
if curl -s -I http://127.0.0.1:3000 > /dev/null; then
    echo "✅ Local application is responding"
else
    echo "❌ Local application is not responding"
    echo "Check PM2 logs: pm2 logs gear-score"
fi
echo ""

# 11. Test domain connectivity
echo "11. Testing domain connectivity..."
if curl -s -I https://gear-score.com > /dev/null; then
    echo "✅ Domain is accessible via HTTPS"
else
    echo "❌ Domain is not accessible via HTTPS"
    echo "This might be a DNS issue or SSL certificate problem"
fi
echo ""

# 12. Check SSL certificate
echo "12. Checking SSL certificate..."
if [ -f "/etc/letsencrypt/live/gear-score.com/fullchain.pem" ]; then
    CERT_EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/gear-score.com/fullchain.pem -noout -enddate | cut -d= -f2)
    echo "SSL Certificate expires: $CERT_EXPIRY"
    
    # Check if certificate is expiring soon (within 30 days)
    if openssl x509 -in /etc/letsencrypt/live/gear-score.com/fullchain.pem -noout -checkend 2592000; then
        echo "✅ SSL Certificate is valid"
    else
        echo "⚠️  SSL Certificate is expiring soon or expired"
        echo "Run: sudo certbot renew"
    fi
else
    echo "❌ SSL Certificate not found"
    echo "You may need to obtain an SSL certificate:"
    echo "sudo certbot --nginx -d gear-score.com -d www.gear-score.com"
fi
echo ""

echo "=== Fix Application Complete ==="
echo ""
echo "Next steps if domain still doesn't work:"
echo "1. Check DNS settings at your domain registrar"
echo "2. Ensure A records point to your server IP: 62.169.19.154"
echo "3. Wait for DNS propagation (can take up to 48 hours)"
echo "4. Check firewall settings: ufw status"
echo "5. Monitor logs: pm2 logs gear-score"
echo ""
echo "Test your domain: https://gear-score.com"