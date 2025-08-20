const { PrismaClient } = require('@prisma/client');
const { sendDatabaseNotification, getAdminUsers } = require('./services/databaseNotificationService');

const prisma = new PrismaClient();

async function testNotificationLogic() {
  try {
    console.log('🧪 Testing notification logic...');
    
    // First, check admin users
    const adminUsers = await getAdminUsers();
    console.log('👥 Admin users found:', adminUsers.length);
    
    if (adminUsers.length === 0) {
      console.log('⚠️ No admin users found - this should prevent notifications');
    }
    
    // Test sending a payment-confirmed notification
    console.log('\n📤 Testing sendDatabaseNotification with payment-confirmed...');
    
    const testData = {
      userId: '7d14fc11-a0bf-449f-97af-6c3e9faa8841',
      orderId: 'test_notification_logic_' + Date.now(),
      customerName: 'Test Customer',
      game: 'Test Game',
      service: 'Test Service',
      price: 1,
      status: 'pending',
      paymentMethod: 'Test',
      timestamp: new Date().toISOString(),
      customerEmail: 'test@example.com'
    };
    
    await sendDatabaseNotification('payment-confirmed', testData);
    
    console.log('\n🔍 Checking notifications created...');
    
    // Check how many notifications were created
    const notifications = await prisma.notification.findMany({
      where: {
        data: {
          path: ['orderId'],
          equals: testData.orderId
        }
      },
      select: {
        id: true,
        type: true,
        userId: true,
        createdAt: true
      }
    });
    
    console.log('📊 Notifications created:', notifications.length);
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ID: ${notif.id}, Type: ${notif.type}, User: ${notif.userId}`);
    });
    
    // Clean up test notifications
    if (notifications.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          id: {
            in: notifications.map(n => n.id)
          }
        }
      });
      console.log('🧹 Cleaned up test notifications');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationLogic();