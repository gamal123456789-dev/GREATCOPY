#!/bin/bash

# Script to update domain configuration for gear-score.com
# This script applies all necessary changes for the domain transition

echo "=== Updating Domain Configuration for gear-score.com ==="
echo "Date: $(date)"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script as root (use sudo)"
    exit 1
fi

# 1. Stop current services
echo "1. Stopping current services..."
pm2 stop gear-score 2>/dev/null || echo "PM2 process not running"
sudo systemctl stop nginx 2>/dev/null || echo "Nginx not running"
echo ""

# 2. Update nginx configuration
echo "2. Updating nginx configuration..."
if [ -f "/root/MainWebsite/nginx-gear-score.conf" ]; then
    cp /root/MainWebsite/nginx-gear-score.conf /etc/nginx/sites-available/gear-score.com
    echo "✅ Nginx configuration updated"
else
    echo "❌ nginx-gear-score.conf not found"
    exit 1
fi

# 3. Create symbolic link if it doesn't exist
echo "3. Creating nginx symbolic link..."
if [ ! -L "/etc/nginx/sites-enabled/gear-score.com" ]; then
    ln -s /etc/nginx/sites-available/gear-score.com /etc/nginx/sites-enabled/gear-score.com
    echo "✅ Symbolic link created"
else
    echo "✅ Symbolic link already exists"
fi

# 4. Remove default nginx site if it exists
echo "4. Removing default nginx site..."
rm -f /etc/nginx/sites-enabled/default
echo "✅ Default site removed"

# 5. Test nginx configuration
echo "5. Testing nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# 6. Start nginx
echo "6. Starting nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx
echo "✅ Nginx started"

# 7. Change to project directory
echo "7. Changing to project directory..."
cd /root/MainWebsite
echo "✅ Changed to /root/MainWebsite"

# 8. Install/update dependencies
echo "8. Installing dependencies..."
npm install --production
echo "✅ Dependencies installed"

# 9. Build the application
echo "9. Building application..."
npm run build
echo "✅ Application built"

# 10. Start PM2 application
echo "10. Starting PM2 application..."
pm2 start ecosystem.config.js --env production
pm2 save
echo "✅ PM2 application started"

# 11. Test local application
echo "11. Testing local application..."
sleep 5
if curl -s -I http://127.0.0.1:5200 > /dev/null; then
    echo "✅ Local application is responding on port 5200"
else
    echo "❌ Local application is not responding"
    echo "Check PM2 logs: pm2 logs gear-score"
fi

# 12. Test domain connectivity
echo "12. Testing domain connectivity..."
if curl -s -I https://gear-score.com > /dev/null; then
    echo "✅ Domain is accessible via HTTPS"
else
    echo "⚠️  Domain is not accessible via HTTPS yet"
    echo "This might be normal if DNS is still propagating"
fi

echo ""
echo "=== Domain Configuration Update Complete ==="
echo ""
echo "📋 Status Summary:"
echo "• Nginx: Updated to use port 5200"
echo "• PM2: Configured for production on port 5200"
echo "• Environment: Set to production with gear-score.com domain"
echo "• SSL: Should be handled by existing certificates"
echo ""
echo "🔍 Monitoring Commands:"
echo "• Check PM2 status: pm2 status"
echo "• Check PM2 logs: pm2 logs gear-score"
echo "• Check nginx status: sudo systemctl status nginx"
echo "• Test domain: curl -I https://gear-score.com"
echo ""
echo "🌐 Your site should be available at: https://gear-score.com"