require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import notification service
const { sendDatabaseNotification } = require('./services/databaseNotificationService');

async function autoFixAllNotifications() {
  try {
    console.log('🔍 Checking all recent orders for missing notifications...');
    
    // Get all orders from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentOrders = await prisma.order.findMany({
      where: {
        date: {
          gte: today
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    console.log(`\n📋 Found ${recentOrders.length} orders from today`);
    
    let fixedCount = 0;
    let alreadyExistCount = 0;
    
    for (const order of recentOrders) {
      console.log(`\n🔍 Checking order: ${order.id}`);
      console.log(`   Game: ${order.game}`);
      console.log(`   Service: ${order.service}`);
      console.log(`   Price: $${order.price}`);
      console.log(`   User: ${order.userId}`);
      console.log(`   Created: ${order.date}`);
      
      // Check if notification already exists
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: order.userId,
          type: 'payment-confirmed',
          message: {
            contains: order.id
          }
        }
      });
      
      if (existingNotification) {
        console.log('   ✅ Notification already exists');
        alreadyExistCount++;
        continue;
      }
      
      console.log('   ❌ No notification found. Creating one...');
      
      // Create payment confirmation notification data
      const notificationData = {
        userId: order.userId,
        orderId: order.id,
        paymentId: order.paymentId,
        price: order.price,
        game: order.game,
        service: order.service
      };
      
      try {
        // Send notification using the service with correct parameters
        await sendDatabaseNotification('payment-confirmed', notificationData);
        console.log('   ✅ Notification created successfully!');
        fixedCount++;
        
        // Add small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (notificationError) {
        console.error(`   ❌ Error creating notification for order ${order.id}:`, notificationError.message);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Total orders checked: ${recentOrders.length}`);
    console.log(`   Notifications already existed: ${alreadyExistCount}`);
    console.log(`   New notifications created: ${fixedCount}`);
    
    if (fixedCount > 0) {
      console.log('\n🔔 Verifying all notifications were created...');
      
      // Get all notifications for today
      const todayNotifications = await prisma.notification.findMany({
        where: {
          type: 'payment-confirmed',
          createdAt: {
            gte: today
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`\n✅ Total payment confirmation notifications today: ${todayNotifications.length}`);
      
      todayNotifications.forEach((notification, index) => {
        const orderIdMatch = notification.message.match(/cm_order_[a-zA-Z0-9_]+/);
        const orderId = orderIdMatch ? orderIdMatch[0] : 'Unknown';
        console.log(`   ${index + 1}. Order: ${orderId} - Created: ${notification.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in auto-fix process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

autoFixAllNotifications();