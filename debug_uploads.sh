#!/bin/bash

# Image upload debugging script
# Image upload debugging script

echo "🔍 Checking image upload settings..."
echo "🔍 Checking image upload settings..."
echo "="*50

# Check Node.js and npm
echo "📦 Software versions:"
echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
echo "NPM: $(npm --version 2>/dev/null || echo 'Not installed')"
echo "PM2: $(pm2 --version 2>/dev/null || echo 'Not installed')"
echo "Nginx: $(nginx -v 2>&1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo 'Not installed')"
echo ""

# Check required libraries
echo "📚 Checking required libraries:"
for package in multer sharp uuid @types/multer; do
    if npm list $package &>/dev/null; then
        VERSION=$(npm list $package --depth=0 2>/dev/null | grep $package | awk '{print $2}' | head -1)
        echo "✅ $package: $VERSION"
    else
        echo "❌ $package: Not installed"
    fi
done
echo ""

# Check upload directory
echo "📁 Checking upload directory:"
if [ -d "public/uploads" ]; then
    echo "✅ public/uploads directory exists"
    echo "📊 Directory permissions: $(stat -c '%A %U:%G' public/uploads 2>/dev/null || ls -ld public/uploads | awk '{print $1, $3":"$4}')"
    echo "📊 Directory size: $(du -sh public/uploads 2>/dev/null | cut -f1)"
    echo "📊 Number of files: $(find public/uploads -type f 2>/dev/null | wc -l)"
else
    echo "❌ public/uploads directory does not exist"
    echo "🔧 Creating directory..."
    mkdir -p public/uploads
    chmod 755 public/uploads
    echo "✅ Directory created"
fi
echo ""

# Check configuration files
echo "⚙️ Checking configuration files:"
files=("package.json" "next.config.js" "ecosystem.config.js" "nginx-gear-score.conf" ".env")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file does not exist"
    fi
done
echo ""

# Check running processes
echo "🔄 Checking running processes:"
if command -v pm2 &> /dev/null; then
    echo "📊 PM2 status:"
    pm2 status 2>/dev/null || echo "No PM2 processes"
else
    echo "❌ PM2 not installed"
fi
echo ""

# Check Nginx
echo "🌐 Checking Nginx:"
if command -v nginx &> /dev/null; then
    if systemctl is-active --quiet nginx 2>/dev/null; then
        echo "✅ Nginx is running"
    else
        echo "❌ Nginx is stopped"
    fi
    
    if [ -f "/etc/nginx/sites-enabled/gear-score" ]; then
        echo "✅ gear-score configuration enabled"
    else
        echo "❌ gear-score configuration not enabled"
    fi
else
    echo "❌ Nginx not installed"
fi
echo ""

# Check ports
echo "🔌 Checking ports:"
for port in 5200 80 443; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "✅ Port $port is open"
    else
        echo "❌ Port $port is closed"
    fi
done
echo ""

# Check memory
echo "💾 Checking memory:"
echo "📊 Available memory: $(free -h | awk '/^Mem:/ {print $7}')"
echo "📊 Available Swap: $(free -h | awk '/^Swap:/ {print $4}')"
echo ""

# Check disk space
echo "💽 Checking disk space:"
echo "📊 Available space: $(df -h . | awk 'NR==2 {print $4}')"
echo ""

# Check logs
echo "📋 Latest system errors:"
if [ -f "/var/log/nginx/error.log" ]; then
    echo "🔍 Latest Nginx errors:"
    tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No recent errors"
fi
echo ""

# Test connection
echo "🧪 Testing connection:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5200 | grep -q "200\|404"; then
    echo "✅ Server responds on port 5200"
else
    echo "❌ Server does not respond on port 5200"
fi
echo ""

echo "="*50
echo "🏁 Debugging completed"
echo "🏁 Debugging completed"
echo ""
echo "💡 Troubleshooting tips:"
echo "💡 Troubleshooting tips:"
echo "1. Make sure all required libraries are installed"
echo "2. Check uploads directory permissions"
echo "3. Review logs using: pm2 logs gear-score"
echo "4. Make sure Nginx is running with correct configuration"
echo "5. Check environment variables in .env file"