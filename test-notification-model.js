const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNotificationModel() {
  try {
    console.log('🧪 Testing Notification model...');
    
    // Create a test notification
    const testNotification = await prisma.notification.create({
      data: {
        type: 'test',
        title: 'Test Notification',
        message: 'Testing notification system after schema update'
      }
    });
    
    console.log('✅ Notification created successfully:', testNotification.id);
    
    // Count total notifications
    const totalCount = await prisma.notification.count();
    console.log('📊 Total notifications in database:', totalCount);
    
    // Check recent notifications
    const recentNotifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    console.log('\n📋 Recent notifications:');
    recentNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. Type: ${notif.type}`);
      console.log(`   Title: ${notif.title}`);
      console.log(`   Created: ${notif.createdAt}`);
      console.log(`   Read: ${notif.read}`);
      console.log('   ---');
    });
    
    console.log('\n✅ Notification model is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing notification model:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationModel();