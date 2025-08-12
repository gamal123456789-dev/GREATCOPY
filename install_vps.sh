#!/bin/bash

# Auto installation script for VPS image upload setup
# Auto installation script for VPS image upload setup

set -e  # Exit on any error

echo "🚀 Starting VPS setup for image and file uploads..."
echo "🚀 Starting VPS setup for image and file uploads..."

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js already installed"
fi

# Install required system libraries for Sharp
echo "📦 Installing required system libraries..."
sudo apt install -y \
  libvips-dev \
  libvips42 \
  build-essential \
  python3 \
  make \
  g++ \
  libjpeg-dev \
  libpng-dev \
  libwebp-dev \
  libgif-dev \
  librsvg2-dev

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    sudo apt install nginx -y
else
    echo "✅ Nginx already installed"
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
else
    echo "✅ PM2 already installed"
fi

# Create upload directory
echo "📁 Creating upload directory..."
mkdir -p public/uploads
chmod 755 public/uploads

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Reinstall Sharp to ensure compatibility
echo "🔧 Reinstalling Sharp..."
npm uninstall sharp
npm install sharp@0.33.5

# Build project
echo "🔨 Building project..."
npm run build

# Setup database
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma migrate deploy

# Setup Nginx
echo "🌐 Setting up Nginx..."
if [ -f "nginx-gear-score.conf" ]; then
    sudo cp nginx-gear-score.conf /etc/nginx/sites-available/gear-score
    sudo ln -sf /etc/nginx/sites-available/gear-score /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    if sudo nginx -t; then
        echo "✅ Nginx configuration is correct"
        sudo systemctl restart nginx
        sudo systemctl enable nginx
    else
        echo "❌ Error in Nginx configuration"
        exit 1
    fi
else
    echo "⚠️ nginx-gear-score.conf file not found"
fi

# Setup folder permissions
echo "🔐 Setting up permissions..."
sudo chown -R $USER:$USER public/uploads
sudo chmod -R 755 public/uploads

# Setup Swap if less than 2GB
SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_SIZE" -lt 2048 ]; then
    echo "💾 Setting up Swap Memory..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
else
    echo "✅ Swap Memory is sufficient"
fi

# Start server
echo "🚀 Starting server..."
pm2 start ecosystem.config.js --env production

# Show status
echo "📊 Server status:"
pm2 status

echo ""
echo "✅ VPS setup completed successfully!"
echo "✅ VPS setup completed successfully!"
echo ""
echo "🔗 Server running on: http://your-server-ip:5200"
echo "🔗 Server running on: http://your-server-ip:5200"
echo ""
echo "📝 To monitor server use: pm2 logs gear-score"
echo "📝 To monitor server use: pm2 logs gear-score"
echo ""
echo "🧪 To test image upload:"
echo "🧪 To test image upload:"
echo "curl -X POST -F \"image=@test.jpg\" http://localhost:5200/api/upload-image"