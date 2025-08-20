#!/bin/bash

# Deploy script for gear-score.com
# This script uploads the latest changes to the production server

echo "🚀 Deploying to gear-score.com production server..."
echo "Date: $(date)"
echo ""

# Production server details
PROD_SERVER="62.169.19.154"
PROD_USER="root"
PROD_PATH="/var/www/gear-score"

# Check if we have SSH access
echo "📡 Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 $PROD_USER@$PROD_SERVER "echo 'SSH connection successful'"; then
    echo "❌ Cannot connect to production server"
    echo "Please check:"
    echo "1. Server IP: $PROD_SERVER"
    echo "2. SSH key is configured"
    echo "3. Server is running"
    exit 1
fi

echo "✅ SSH connection successful"
echo ""

# Create backup on production server
echo "💾 Creating backup on production server..."
ssh $PROD_USER@$PROD_SERVER "mkdir -p /root/backups/$(date +%Y%m%d_%H%M%S) && cp -r $PROD_PATH/* /root/backups/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || echo 'No existing files to backup'"

# Upload updated files
echo "📤 Uploading updated files..."

# Upload main application files
echo "  - Uploading pages and components..."
rsync -avz --progress pages/ $PROD_USER@$PROD_SERVER:$PROD_PATH/pages/
rsync -avz --progress components/ $PROD_USER@$PROD_SERVER:$PROD_PATH/components/
rsync -avz --progress lib/ $PROD_USER@$PROD_SERVER:$PROD_PATH/lib/
rsync -avz --progress styles/ $PROD_USER@$PROD_SERVER:$PROD_PATH/styles/

# Upload configuration files
echo "  - Uploading configuration files..."
scp package.json $PROD_USER@$PROD_SERVER:$PROD_PATH/
scp server.js $PROD_USER@$PROD_SERVER:$PROD_PATH/
scp next.config.js $PROD_USER@$PROD_SERVER:$PROD_PATH/
scp prisma/schema.prisma $PROD_USER@$PROD_SERVER:$PROD_PATH/prisma/

# Upload environment file (if exists)
if [ -f ".env.production" ]; then
    echo "  - Uploading environment configuration..."
    scp .env.production $PROD_USER@$PROD_SERVER:$PROD_PATH/.env
fi

echo "✅ Files uploaded successfully"
echo ""

# Install dependencies and build on production server
echo "📦 Installing dependencies on production server..."
ssh $PROD_USER@$PROD_SERVER "cd $PROD_PATH && npm install --production"

echo "🔨 Building application on production server..."
ssh $PROD_USER@$PROD_SERVER "cd $PROD_PATH && npm run build"

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
ssh $PROD_USER@$PROD_SERVER "cd $PROD_PATH && npx prisma generate"

# Restart the application
echo "🔄 Restarting application..."
ssh $PROD_USER@$PROD_SERVER "cd $PROD_PATH && pm2 restart gear-score || pm2 start ecosystem.config.js"

# Wait a moment for the application to start
echo "⏳ Waiting for application to start..."
sleep 10

# Check if the application is running
echo "🔍 Checking application status..."
ssh $PROD_USER@$PROD_SERVER "pm2 status gear-score"

# Test the deployment
echo "🧪 Testing deployment..."
if curl -s -o /dev/null -w "%{http_code}" https://gear-score.com | grep -q "200\|301\|302"; then
    echo "✅ Deployment successful! Site is responding."
    echo "🌐 Your updated site is available at: https://gear-score.com"
    echo ""
    echo "📋 What was deployed:"
    echo "  ✅ All in Once page (components/AllInOncePage.tsx)"
    echo "  ✅ Updated admin dashboard (pages/admin/index.tsx)"
    echo "  ✅ Real-time notifications system"
    echo "  ✅ Database monitoring middleware"
    echo "  ✅ Socket.IO integration"
    echo ""
    echo "🔍 To verify the changes:"
    echo "  1. Go to https://gear-score.com/admin"
    echo "  2. Login with your admin account"
    echo "  3. Look for 'All in Once' tab in the sidebar"
    echo "  4. Clear browser cache if needed (Ctrl+F5)"
else
    echo "⚠️ Deployment completed but site may not be responding correctly"
    echo "Please check:"
    echo "1. PM2 logs: ssh $PROD_USER@$PROD_SERVER 'pm2 logs gear-score'"
    echo "2. Nginx logs: ssh $PROD_USER@$PROD_SERVER 'tail -f /var/log/nginx/gear-score.error.log'"
    echo "3. Application status: ssh $PROD_USER@$PROD_SERVER 'pm2 status'"
fi

echo ""
echo "🎉 Deployment process completed!"
echo "📅 Deployed at: $(date)"