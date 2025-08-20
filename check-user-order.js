require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserOrder() {
  try {
    // Check the most recent order
    const recentOrder = await prisma.order.findFirst({
      orderBy: { date: 'desc' }
    });
    
    if (!recentOrder) {
      console.log('❌ No orders found');
      return;
    }
    
    console.log('🔍 Most Recent Order:');
    console.log('Order ID:', recentOrder.id);
    console.log('User ID:', recentOrder.userId);
    console.log('Customer Name:', recentOrder.customerName);
    console.log('Customer Email:', recentOrder.customerEmail);
    console.log('Game:', recentOrder.game);
    console.log('Service:', recentOrder.service);
    console.log('Price:', recentOrder.price);
    console.log('Status:', recentOrder.status);
    console.log('Date:', recentOrder.date);
    console.log('Payment ID:', recentOrder.paymentId);
    
    // Check notifications for this user
    if (recentOrder.userId) {
      console.log('\n🔔 Checking notifications for user:', recentOrder.userId);
      
      const userNotifications = await prisma.notification.findMany({
        where: {
          userId: recentOrder.userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });
      
      console.log(`Found ${userNotifications.length} notifications for this user:`);
      
      userNotifications.forEach((notif, index) => {
        console.log(`${index + 1}. Type: ${notif.type}`);
        console.log(`   Title: ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Read: ${notif.read}`);
        console.log(`   Created: ${notif.createdAt}`);
        if (notif.data && notif.data.orderId) {
          console.log(`   Order ID: ${notif.data.orderId}`);
        }
        console.log('   ---');
      });
      
      // Check specifically for payment-confirmed notifications
      const paymentNotifications = await prisma.notification.findMany({
        where: {
          userId: recentOrder.userId,
          type: 'payment-confirmed'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`\n💳 Payment confirmation notifications: ${paymentNotifications.length}`);
      
      if (paymentNotifications.length === 0) {
        console.log('❌ No payment confirmation notifications found for this user!');
        console.log('This explains why you didn\'t receive a notification.');
      } else {
        console.log('✅ Payment confirmation notifications exist:');
        paymentNotifications.forEach((notif, index) => {
          console.log(`${index + 1}. Order: ${notif.data?.orderId || 'N/A'}`);
          console.log(`   Created: ${notif.createdAt}`);
          console.log(`   Read: ${notif.read}`);
        });
      }
    } else {
      console.log('❌ No userId found for this order!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserOrder();