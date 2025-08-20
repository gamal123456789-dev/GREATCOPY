require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLatestPayment() {
  try {
    const orderId = 'cm_order_1755507139724_lfqw076dy';
    const userId = '7d14fc11-a0bf-449f-97af-6c3e9faa8841';
    
    console.log('🔍 Checking latest payment:', orderId);
    console.log('============================================');
    
    // Check payment session
    const paymentSession = await prisma.paymentSession.findUnique({
      where: { orderId }
    });
    
    console.log('📋 Payment Session:');
    if (paymentSession) {
      console.log('  ✅ Found');
      console.log('  - Status:', paymentSession.status);
      console.log('  - Amount:', paymentSession.amount);
      console.log('  - Updated:', paymentSession.updatedAt);
    } else {
      console.log('  ❌ Not found');
    }
    
    // Check order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    console.log('\n📦 Order:');
    if (order) {
      console.log('  ✅ Found');
      console.log('  - Status:', order.status);
      console.log('  - Payment ID:', order.paymentId);
      console.log('  - Created:', order.createdAt);
    } else {
      console.log('  ❌ Not found');
    }
    
    // Check recent notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date('2025-08-18T08:53:00.000Z')
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n🔔 Recent Notifications (since 08:53):');
    console.log('  Count:', notifications.length);
    
    notifications.forEach((n, index) => {
      console.log(`  ${index + 1}. Type: ${n.type}`);
      console.log(`     Created: ${n.createdAt}`);
      console.log(`     Title: ${n.title}`);
      console.log(`     Message: ${n.message}`);
      console.log('     ---');
    });
    
    if (notifications.length === 0) {
      console.log('  ❌ No notifications found for this payment');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestPayment();