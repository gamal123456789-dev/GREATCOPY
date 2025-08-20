require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { sendDatabaseNotification } = require('./services/databaseNotificationService');

const prisma = new PrismaClient();

async function sendMissingNotification() {
  try {
    const orderId = 'cm_order_1755507139724_lfqw076dy';
    const userId = '7d14fc11-a0bf-449f-97af-6c3e9faa8841';
    
    console.log('🔔 Sending missing payment confirmation notification...');
    console.log('Order ID:', orderId);
    console.log('User ID:', userId);
    console.log('============================================');
    
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      console.log('❌ Order not found');
      return;
    }
    
    console.log('✅ Order found:', {
      id: order.id,
      status: order.status,
      paymentId: order.paymentId
    });
    
    // Send notification directly
    console.log('📤 Sending payment confirmation notification...');
    
    await sendDatabaseNotification('payment-confirmed', {
      userId: userId,
      orderId: orderId,
      paymentAmount: '0.56',
      currency: 'USD',
      game: 'Black Desert Online',
      service: 'Power Leveling',
      customerEmail: 'gamalkhaled981@gmail.com'
    });
    
    console.log('✅ Notification sent successfully!');
    
    // Verify notification was created
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n📊 Verification:');
    console.log('New notifications:', notifications.length);
    
    notifications.forEach((n, index) => {
      console.log(`${index + 1}. Type: ${n.type}`);
      console.log(`   Title: ${n.title}`);
      console.log(`   Message: ${n.message}`);
      console.log(`   Created: ${n.createdAt}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

sendMissingNotification();