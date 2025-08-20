require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import notification service
const { sendDatabaseNotification } = require('./services/databaseNotificationService');

async function fixMissingNotification() {
  try {
    console.log('🔍 Checking for orders without payment notifications...');
    
    // Get the specific order that needs notification
    const orderToFix = 'cm_order_1755511573948_zkaclandj';
    const userId = '7d14fc11-a0bf-449f-97af-6c3e9faa8841';
    
    console.log(`\n📋 Checking order: ${orderToFix}`);
    
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderToFix }
    });
    
    if (!order) {
      console.log('❌ Order not found!');
      return;
    }
    
    console.log(`Order found: ${order.game} - ${order.service} - $${order.price}`);
    console.log(`Status: ${order.status}`);
    console.log(`Created: ${order.createdAt}`);
    
    // Check if notification already exists
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: userId,
        type: 'payment-confirmed',
        message: {
          contains: orderToFix
        }
      }
    });
    
    if (existingNotification) {
      console.log('✅ Notification already exists for this order');
      return;
    }
    
    console.log('❌ No notification found for this order. Creating one...');
    
    // Create payment confirmation notification data
    const notificationData = {
      userId: userId,
      orderId: orderToFix,
      paymentId: order.paymentId,
      price: order.price,
      game: order.game,
      service: order.service
    };
    
    console.log('\n📤 Creating notification...');
    
    // Send notification using the service with correct parameters
    await sendDatabaseNotification('payment-confirmed', notificationData);
    
    console.log('✅ Payment confirmation notification created successfully!');
    
    // Verify the notification was created
    const newNotification = await prisma.notification.findFirst({
      where: {
        userId: userId,
        type: 'payment-confirmed',
        message: {
          contains: orderToFix
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (newNotification) {
      console.log('\n✅ Verification successful:');
      console.log(`Title: ${newNotification.title}`);
      console.log(`Message: ${newNotification.message}`);
      console.log(`Created: ${newNotification.createdAt}`);
      console.log(`Read: ${newNotification.read}`);
    } else {
      console.log('❌ Verification failed - notification not found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing missing notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingNotification();