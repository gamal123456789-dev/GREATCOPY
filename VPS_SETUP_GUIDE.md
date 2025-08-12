# VPS Setup Guide for Image and File Upload

## Required Libraries

### 1. Node.js Dependencies (already installed)
```bash
npm install multer@1.4.5-lts.1
npm install sharp@0.33.5
npm install uuid@11.1.0
npm install @types/multer@1.4.12
```

### 2. System Dependencies (required on VPS)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install system libraries required for Sharp
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

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for management
npm install -g pm2
```

### 3. Nginx Configuration (required)
```bash
# Install Nginx
sudo apt install nginx -y

# Copy configuration file
sudo cp nginx-gear-score.conf /etc/nginx/sites-available/gear-score
sudo ln -s /etc/nginx/sites-available/gear-score /etc/nginx/sites-enabled/

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 4. Folder and Permissions Setup
```bash
# Create upload folder
mkdir -p public/uploads

# Set appropriate permissions
chmod 755 public/uploads
chown -R $USER:$USER public/uploads

# Setup Nginx permissions
sudo chown -R www-data:www-data /var/www/gear-score/public/uploads
sudo chmod -R 755 /var/www/gear-score/public/uploads
```

### 5. Environment Variables (.env)
```bash
# Make sure these variables exist in .env file
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=1073741824  # 1 Gigabyte (1GB)
MAX_FILES=10              # Number of allowed files
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
NODE_ENV=production
```

### 6. Startup Commands
```bash
# Install dependencies
npm install

# Build project
npm run build

# Run database
npx prisma migrate deploy
npx prisma generate

# Start server using PM2
pm2 start ecosystem.config.js --env production

# Monitor server
pm2 logs gear-score
pm2 status
```

### 7. Troubleshooting

#### If images are not uploading:
```bash
# Check upload folder
ls -la public/uploads

# Check folder permissions
stat public/uploads

# Check logs
pm2 logs gear-score
tail -f /var/log/nginx/error.log
```

#### If there's an error with Sharp:
```bash
# Reinstall Sharp
npm uninstall sharp
npm install sharp@0.33.5

# Or install the appropriate version for the system
npm install --platform=linux --arch=x64 sharp
```

#### If there's a memory error:
```bash
# Increase swap memory
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 8. System Testing
```bash
# Test file upload
curl -X POST -F "image=@test.jpg" http://localhost:5200/api/upload-image

# Test file access
curl -I http://localhost:5200/uploads/test.jpg
```

## Important Notes:

1. **Make sure to install all system libraries before running npm install**
2. **Check uploads folder permissions**
3. **Make sure Nginx is running with correct settings**
4. **Monitor memory usage when uploading large files**
5. **Use PM2 to manage the process in production**

## Support:
If you encounter any problems, check:
- `pm2 logs gear-score`
- `/var/log/nginx/error.log`
- `journalctl -u nginx`