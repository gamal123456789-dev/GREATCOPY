require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { sendDatabaseNotification } = require('./services/databaseNotificationService');

const prisma = new PrismaClient();

async function checkLatestOrderNotification() {
  try {
    const latestOrderId = 'cm_order_1755510959567_iwmmf1jt4';
    const userId = '7d14fc11-a0bf-449f-97af-6c3e9faa8841';
    
    console.log('🔍 Checking latest order notification status...');
    console.log('Order ID:', latestOrderId);
    console.log('User ID:', userId);
    console.log('============================================');
    
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: latestOrderId }
    });
    
    if (!order) {
      console.log('❌ Order not found');
      return;
    }
    
    console.log('✅ Order found:');
    console.log('  - Status:', order.status);
    console.log('  - Payment ID:', order.paymentId);
    console.log('  - Game:', order.game);
    console.log('  - Service:', order.service);
    console.log('  - Price:', order.price);
    console.log('  - Customer:', order.customerName);
    
    // Check if there's a notification for this specific order
    const orderNotifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        data: {
          path: ['orderId'],
          equals: latestOrderId
        }
      }
    });
    
    console.log('\n🔔 Notifications for this specific order:', orderNotifications.length);
    
    if (orderNotifications.length === 0) {
      console.log('❌ No notification found for this order!');
      console.log('\n🚀 Creating missing notification...');
      
      try {
        await sendDatabaseNotification('payment-confirmed', {
          userId: userId,
          orderId: latestOrderId,
          customerName: order.customerName,
          game: order.game,
          service: order.service,
          price: order.price,
          paymentMethod: 'Cryptomus (USDT)',
          timestamp: order.date.toISOString()
        });
        
        console.log('✅ Notification created successfully!');
        
        // Verify the notification was created
        const newNotifications = await prisma.notification.findMany({
          where: {
            userId: userId,
            data: {
              path: ['orderId'],
              equals: latestOrderId
            }
          }
        });
        
        console.log('\n📬 Verification - Notifications now:', newNotifications.length);
        
        if (newNotifications.length > 0) {
          newNotifications.forEach((notif, index) => {
            console.log(`${index + 1}. Type: ${notif.type}`);
            console.log(`   Title: ${notif.title}`);
            console.log(`   Message: ${notif.message}`);
            console.log(`   Created: ${notif.createdAt}`);
          });
        }
        
      } catch (notificationError) {
        console.error('❌ Error creating notification:', notificationError);
      }
    } else {
      console.log('✅ Notification already exists for this order:');
      orderNotifications.forEach((notif, index) => {
        console.log(`${index + 1}. Type: ${notif.type}`);
        console.log(`   Title: ${notif.title}`);
        console.log(`   Created: ${notif.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestOrderNotification();