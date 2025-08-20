const { PrismaClient } = require('@prisma/client');
const { setupDatabaseMonitoring } = require('./services/databaseNotificationService');

const prisma = new PrismaClient();

/**
 * Test notifications after server restart
 */
async function testAfterRestart() {
  console.log('🔄 اختبار الإشعارات بعد إعادة تشغيل الخدمة');
  console.log('=' .repeat(50));
  
  try {
    // Setup middleware
    console.log('\n1️⃣ إعداد middleware...');
    setupDatabaseMonitoring(prisma);
    
    // Get existing users
    const existingUsers = await prisma.user.findMany({
      select: { id: true, email: true },
      take: 3
    });
    
    if (existingUsers.length === 0) {
      console.log('❌ لا توجد مستخدمين في قاعدة البيانات');
      return;
    }
    
    console.log(`\n2️⃣ تم العثور على ${existingUsers.length} مستخدمين`);
    
    // Count notifications before test
    const notificationsBefore = await prisma.notification.count();
    console.log(`\n3️⃣ عدد الإشعارات قبل الاختبار: ${notificationsBefore}`);
    
    // Create a manual order
    console.log('\n4️⃣ إنشاء طلب يدوي...');
    const testOrderId = `test_after_restart_${Date.now()}`;
    const manualOrder = await prisma.order.create({
      data: {
        id: testOrderId,
        userId: existingUsers[0].id,
        customerName: 'Test After Restart Customer',
        date: new Date(),
        game: 'Test Game',
        price: 35.00,
        service: 'Test Service After Restart',
        status: 'pending'
        // No paymentId - should trigger new-order notification
      }
    });
    
    console.log('✅ تم إنشاء الطلب:', manualOrder.id);
    
    // Wait for middleware to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Count notifications after
    const notificationsAfter = await prisma.notification.count();
    const newNotifications = notificationsAfter - notificationsBefore;
    console.log(`\n5️⃣ الإشعارات الجديدة المُنشأة: ${newNotifications}`);
    
    // Check specific notifications for this order
    const orderNotifications = await prisma.notification.findMany({
      where: {
        data: {
          path: ['orderId'],
          equals: testOrderId
        }
      },
      select: {
        id: true,
        type: true,
        createdAt: true
      }
    });
    
    console.log(`\n6️⃣ إشعارات الطلب ${testOrderId}: ${orderNotifications.length}`);
    
    orderNotifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. ${notification.type} - ${new Date(notification.createdAt).toLocaleString('ar-EG')}`);
    });
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 نتائج الاختبار:');
    console.log('=' .repeat(50));
    
    if (orderNotifications.length === 3) {
      console.log('✅ نجح الإصلاح! تم إرسال 3 إشعارات فقط (واحد لكل admin)');
    } else if (orderNotifications.length > 3) {
      console.log(`❌ المشكلة لا تزال موجودة! تم إرسال ${orderNotifications.length} إشعارات`);
    } else {
      console.log(`⚠️ عدد غير متوقع من الإشعارات: ${orderNotifications.length}`);
    }
    
  } catch (error) {
    console.error('❌ فشل الاختبار:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAfterRestart();