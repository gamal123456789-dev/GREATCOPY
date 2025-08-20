const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTestNotifications() {
  try {
    const testOrderId = 'test_duplicate_fix_1755569536980_2ykgd344z';
    
    console.log('🔍 Checking notifications for test order:', testOrderId);
    
    const notifications = await prisma.notification.findMany({
      where: {
        data: {
          path: ['orderId'],
          equals: testOrderId
        }
      },
      select: {
        id: true,
        type: true,
        title: true,
        userId: true,
        createdAt: true,
        data: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log('\n📊 Found', notifications.length, 'notifications:');
    console.log('=' .repeat(60));
    
    notifications.forEach((notification, index) => {
      console.log(`\n${index + 1}. Notification ID: ${notification.id}`);
      console.log(`   Type: ${notification.type}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   User ID: ${notification.userId}`);
      console.log(`   Created: ${notification.createdAt.toISOString()}`);
      console.log(`   Data:`, JSON.stringify(notification.data, null, 2));
    });
    
    // Group by type
    const byType = {};
    notifications.forEach(notif => {
      byType[notif.type] = (byType[notif.type] || 0) + 1;
    });
    
    console.log('\n📈 Breakdown by type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
    
    // Group by user
    const byUser = {};
    notifications.forEach(notif => {
      byUser[notif.userId] = (byUser[notif.userId] || 0) + 1;
    });
    
    console.log('\n👥 Breakdown by user:');
    Object.entries(byUser).forEach(([userId, count]) => {
      console.log(`   - ${userId}: ${count}`);
    });
    
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: testOrderId }
    });
    
    if (order) {
      console.log('\n📦 Order found:');
      console.log(`   ID: ${order.id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   User ID: ${order.userId}`);
      console.log(`   Payment ID: ${order.paymentId}`);
      console.log(`   Created: ${order.date.toISOString()}`);
    } else {
      console.log('\n❌ Order not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestNotifications();