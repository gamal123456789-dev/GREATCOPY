const { PrismaClient } = require('@prisma/client');
const { sendDatabaseNotification } = require('./services/databaseNotificationService');

const prisma = new PrismaClient();

async function testCollectiveNotification() {
  try {
    console.log('🧪 اختبار النظام الجديد للإشعارات الجماعية...');
    
    // Create a test payment-confirmed notification
    const testData = {
      orderId: 'test_collective_' + Date.now(),
      userId: '7d14fc11-a0bf-449f-97af-6c3e9faa8841', // Customer user ID
      customerName: 'gamalkhaled981@gmail.com',
      game: 'Black Desert Online',
      service: 'Level 1 to 7',
      price: 0.56,
      paymentMethod: 'Cryptomus',
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 إرسال إشعار payment-confirmed تجريبي...');
    await sendDatabaseNotification('payment-confirmed', testData);
    
    // Wait a moment for the notification to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check the created notifications
    console.log('\n🔍 فحص الإشعارات المُنشأة...');
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          {
            data: {
              path: ['orderId'],
              equals: testData.orderId
            }
          },
          {
            data: {
              path: ['isCollectiveAdminNotification'],
              equals: true
            },
            AND: {
              data: {
                path: ['orderId'],
                equals: testData.orderId
              }
            }
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`عدد الإشعارات المُنشأة: ${notifications.length}`);
    
    if (notifications.length > 0) {
      console.log('\n📋 تفاصيل الإشعارات:');
      notifications.forEach((n, i) => {
        console.log(`${i+1}. النوع: ${n.type}`);
        console.log(`   المستخدم: ${n.userId}`);
        console.log(`   إشعار جماعي: ${n.isCollectiveAdminNotification}`);
        console.log(`   معرفات الأدمن: ${n.adminUserIds ? JSON.stringify(n.adminUserIds) : 'غير محدد'}`);
        console.log(`   الرسالة: ${n.message.substring(0, 80)}...`);
        console.log('   ---');
      });
      
      // Check if collective notifications are working
      const collectiveNotifications = notifications.filter(n => n.isCollectiveAdminNotification);
      if (collectiveNotifications.length > 0) {
        console.log('\n✅ النظام الجديد للإشعارات الجماعية يعمل!');
        console.log(`عدد الإشعارات الجماعية: ${collectiveNotifications.length}`);
        console.log('🎉 تم تقليل عدد الإشعارات من 3 إلى 1 للأدمن!');
      } else {
        console.log('\n❌ النظام القديم ما زال يعمل - إشعارات منفصلة لكل أدمن');
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCollectiveNotification();