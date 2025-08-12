#!/bin/bash

# Setup script for gear-score.com domain
# This script configures Nginx, SSL certificate, and domain settings

echo "🚀 Setting up gear-score.com domain..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root (use sudo)"
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt install -y nginx certbot python3-certbot-nginx ufw

# Configure firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 80
ufw allow 443

# Copy Nginx configuration
echo "⚙️ Setting up Nginx configuration..."
cp /root/MainWebsite/nginx-gear-score.conf /etc/nginx/sites-available/gear-score.com

# Remove default Nginx site
rm -f /etc/nginx/sites-enabled/default

# Enable the new site
ln -sf /etc/nginx/sites-available/gear-score.com /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors. Please check the config file."
    exit 1
fi

# Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx

# Check if domain points to this server
echo "🌐 Checking domain DNS..."
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short gear-score.com)

if [ "$SERVER_IP" = "$DOMAIN_IP" ]; then
    echo "✅ Domain gear-score.com points to this server ($SERVER_IP)"
    
    # Obtain SSL certificate
    echo "🔒 Obtaining SSL certificate..."
    certbot --nginx -d gear-score.com -d www.gear-score.com --non-interactive --agree-tos --email support@gear-score.com
    
    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate obtained successfully"
    else
        echo "⚠️ SSL certificate setup failed. You may need to configure it manually."
    fi
else
    echo "⚠️ Domain gear-score.com does not point to this server yet."
    echo "   Server IP: $SERVER_IP"
    echo "   Domain IP: $DOMAIN_IP"
    echo "   Please update your DNS settings and run this script again."
fi

# Setup automatic SSL renewal
echo "🔄 Setting up automatic SSL renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Create systemd service for the application
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/gear-score.service << EOF
[Unit]
Description=Gear Score Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/MainWebsite
Environment=NODE_ENV=production
Environment=PORT=5200
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable gear-score.service

echo "✅ Domain setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your domain DNS points to this server IP: $SERVER_IP"
echo "2. Start the application service: systemctl start gear-score"
echo "3. Check service status: systemctl status gear-score"
echo "4. View logs: journalctl -u gear-score -f"
echo ""
echo "🌐 Your site will be available at: https://gear-score.com"