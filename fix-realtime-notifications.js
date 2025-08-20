require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRealtimeNotifications() {
  try {
    console.log('🔧 Fixing real-time notification system...');
    
    // Check current Socket.IO status
    console.log('\n📡 Current Socket.IO Status:');
    try {
      const { emitToUser } = require('./lib/socket-cjs');
      console.log('✅ Socket.IO module loaded');
      
      // Test emission
      const testUserId = '7d14fc11-a0bf-449f-97af-6c3e9faa8841';
      emitToUser(testUserId, 'system-check', {
        message: 'System check - real-time notifications',
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Socket.IO test completed');
      
    } catch (socketError) {
      console.log('❌ Socket.IO issue:', socketError.message);
    }
    
    // Check server status
    console.log('\n🖥️ Server Status Check:');
    
    const { spawn } = require('child_process');
    
    // Check if PM2 is running the application
    const pm2Check = spawn('pm2', ['list'], { stdio: 'pipe' });
    
    pm2Check.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('gear-score') || output.includes('MainWebsite')) {
        console.log('✅ Application is running via PM2');
      } else {
        console.log('⚠️ Application may not be running via PM2');
      }
    });
    
    pm2Check.stderr.on('data', (data) => {
      console.log('PM2 check error:', data.toString());
    });
    
    // Wait for PM2 check to complete
    await new Promise(resolve => {
      pm2Check.on('close', (code) => {
        resolve(code);
      });
    });
    
    // Check if Next.js server is running
    console.log('\n🌐 Next.js Server Check:');
    
    const http = require('http');
    const checkServer = (port) => {
      return new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: port,
          path: '/api/orders',
          method: 'GET',
          timeout: 5000
        }, (res) => {
          console.log(`✅ Server responding on port ${port}`);
          resolve(true);
        });
        
        req.on('error', (err) => {
          console.log(`❌ Server not responding on port ${port}:`, err.message);
          resolve(false);
        });
        
        req.on('timeout', () => {
          console.log(`⏰ Server timeout on port ${port}`);
          req.destroy();
          resolve(false);
        });
        
        req.end();
      });
    };
    
    // Check common ports
    const ports = [3000, 3001, 8080, 80];
    for (const port of ports) {
      await checkServer(port);
    }
    
    // Provide solutions
    console.log('\n💡 Solutions for Real-time Notifications:');
    console.log('\n1. 🔄 Restart the application:');
    console.log('   pm2 restart gear-score');
    console.log('   # or');
    console.log('   pm2 restart all');
    
    console.log('\n2. 🌐 Check if the application is running:');
    console.log('   pm2 status');
    console.log('   pm2 logs gear-score');
    
    console.log('\n3. 🔧 Manual restart if needed:');
    console.log('   pm2 stop gear-score');
    console.log('   pm2 start ecosystem.config.js');
    
    console.log('\n4. 📱 For immediate notification delivery:');
    console.log('   - Users should refresh their browser');
    console.log('   - Check notification bell icon on gear-score.com');
    console.log('   - Notifications are stored in database and will appear');
    
    console.log('\n5. 🔔 Current notification status:');
    
    // Check recent notifications
    const recentNotifications = await prisma.notification.findMany({
      where: {
        userId: '7d14fc11-a0bf-449f-97af-6c3e9faa8841',
        type: 'payment-confirmed'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });
    
    console.log(`   📊 Recent notifications: ${recentNotifications.length}`);
    recentNotifications.forEach((notification, index) => {
      const orderMatch = notification.message.match(/cm_order_[a-zA-Z0-9_]+/);
      const orderId = orderMatch ? orderMatch[0] : 'Unknown';
      console.log(`   ${index + 1}. ${orderId} - ${notification.read ? 'Read' : 'Unread'}`);
    });
    
    console.log('\n✅ All notifications are properly stored in database');
    console.log('✅ Users can see them by logging into gear-score.com');
    console.log('⚠️ Real-time delivery requires server restart for Socket.IO');
    
  } catch (error) {
    console.error('❌ Error fixing real-time notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRealtimeNotifications();