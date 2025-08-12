// PM2 Ecosystem Configuration for Gear Score
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'gear-score',
      script: 'server.js',
      cwd: '/var/www/gear-score', // Update this path to your actual project path
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Process management
      instances: 1, // Single instance for Socket.IO compatibility
      exec_mode: 'fork', // Use fork mode for Socket.IO
      
      // Auto restart settings
      autorestart: true,
      watch: false, // Disable watch in production
      max_memory_restart: '4G',  // Increased for large file handling
      
      // Logging
      log_file: '/var/log/pm2/gear-score.log',
      out_file: '/var/log/pm2/gear-score-out.log',
      error_file: '/var/log/pm2/gear-score-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced settings - Increased memory for large file uploads
      node_args: '--max-old-space-size=4096',
      
      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Source control
      post_update: ['npm install', 'npm run build'],
      
      // Environment variables (production)
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Add other production-specific env vars here
      }
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'root', // Update with your VPS username
      host: '62.169.19.154',
      ref: 'origin/main',
      repo: 'https://github.com/your-username/gear-score.git', // Update with your repo
      path: '/var/www/gear-score',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};

// PM2 Commands Reference:
// 
// Start application:
// pm2 start ecosystem.config.js
// 
// Start with specific environment:
// pm2 start ecosystem.config.js --env production
// 
// Reload application (zero-downtime):
// pm2 reload gear-score
// 
// Restart application:
// pm2 restart gear-score
// 
// Stop application:
// pm2 stop gear-score
// 
// Delete application:
// pm2 delete gear-score
// 
// View logs:
// pm2 logs gear-score
// 
// Monitor application:
// pm2 monit
// 
// Save PM2 configuration:
// pm2 save
// 
// Setup startup script:
// pm2 startup
// 
// Deploy to production:
// pm2 deploy production setup
// pm2 deploy production
// 
// Update deployment:
// pm2 deploy production update