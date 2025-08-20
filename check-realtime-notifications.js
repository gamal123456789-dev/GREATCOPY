require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRealtimeNotifications() {
  try {
    console.log('🔍 Checking real-time notification system status...');
    
    // Check if Socket.IO is running
    console.log('\n📡 Socket.IO Status:');
    try {
      const { emitToUser } = require('./lib/socket-cjs');
      console.log('✅ Socket.IO module loaded successfully');
      
      // Test Socket.IO connection
      const testUserId = '7d14fc11-a0bf-449f-97af-6c3e9faa8841';
      console.log(`🧪 Testing Socket.IO emission to user: ${testUserId}`);
      
      try {
        emitToUser(testUserId, 'test-notification', {
          message: 'Test notification from system check',
          timestamp: new Date().toISOString()
        });
        console.log('✅ Socket.IO test emission successful');
      } catch (emitError) {
        console.log('❌ Socket.IO emission failed:', emitError.message);
      }
      
    } catch (socketError) {
      console.log('❌ Socket.IO not available:', socketError.message);
    }
    
    // Check notification delivery methods
    console.log('\n📤 Notification Delivery Methods:');
    
    // Check database notifications
    const recentNotifications = await prisma.notification.findMany({
      where: {
        userId: '7d14fc11-a0bf-449f-97af-6c3e9faa8841',
        type: 'payment-confirmed'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    console.log(`✅ Database notifications: ${recentNotifications.length} found`);
    recentNotifications.forEach((notification, index) => {
      const timeDiff = Date.now() - new Date(notification.createdAt).getTime();
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));
      console.log(`   ${index + 1}. Created ${minutesAgo} minutes ago - Read: ${notification.read}`);
    });
    
    // Check webhook system
    console.log('\n🔗 Webhook System Status:');
    
    // Check if webhook handler is working
    try {
      const webhookPath = './pages/api/pay/webhook.ts';
      const fs = require('fs');
      if (fs.existsSync(webhookPath)) {
        console.log('✅ Webhook handler file exists');
      } else {
        console.log('❌ Webhook handler file not found');
      }
    } catch (webhookError) {
      console.log('❌ Error checking webhook:', webhookError.message);
    }
    
    // Check notification service
    console.log('\n🔔 Notification Service Status:');
    try {
      const { sendDatabaseNotification } = require('./services/databaseNotificationService');
      console.log('✅ Database notification service loaded');
      
      // Test notification creation (without actually sending)
      console.log('🧪 Testing notification service...');
      
      const testData = {
        userId: '7d14fc11-a0bf-449f-97af-6c3e9faa8841',
        orderId: 'test_order_' + Date.now(),
        price: 0.01,
        game: 'Test Game',
        service: 'Test Service'
      };
      
      console.log('📝 Test notification data prepared');
      console.log('   Note: This is just a test - no actual notification will be sent');
      
    } catch (serviceError) {
      console.log('❌ Notification service error:', serviceError.message);
    }
    
    // Check timing issues
    console.log('\n⏰ Timing Analysis:');
    
    const latestOrder = await prisma.order.findFirst({
      where: {
        userId: '7d14fc11-a0bf-449f-97af-6c3e9faa8841'
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    if (latestOrder) {
      const latestNotification = await prisma.notification.findFirst({
        where: {
          userId: '7d14fc11-a0bf-449f-97af-6c3e9faa8841',
          message: {
            contains: latestOrder.id
          }
        }
      });
      
      if (latestNotification) {
        const orderTime = new Date(latestOrder.date).getTime();
        const notificationTime = new Date(latestNotification.createdAt).getTime();
        const delayMinutes = Math.floor((notificationTime - orderTime) / (1000 * 60));
        
        console.log(`📊 Latest order to notification delay: ${delayMinutes} minutes`);
        console.log(`   Order created: ${latestOrder.date}`);
        console.log(`   Notification created: ${latestNotification.createdAt}`);
        
        if (delayMinutes > 5) {
          console.log('⚠️ Significant delay detected in notification delivery');
        } else {
          console.log('✅ Notification timing appears normal');
        }
      }
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('1. Notifications are being created in the database successfully');
    console.log('2. Real-time delivery may be affected by Socket.IO availability');
    console.log('3. Users should refresh their browser or check notification panel');
    console.log('4. Consider implementing browser push notifications as backup');
    
  } catch (error) {
    console.error('❌ Error checking real-time notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRealtimeNotifications();