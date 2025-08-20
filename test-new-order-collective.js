const { sendDatabaseNotification } = require('./services/databaseNotificationService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewOrderCollective() {
  try {
    console.log('🧪 اختبار النظام الجماعي مع طلب جديد...');
    
    // Create a test order first
    const testOrderId = `test_new_order_${Date.now()}`;
    
    console.log('📝 إنشاء طلب تجريبي جديد...');
    const testOrder = await prisma.order.create({
      data: {
        id: testOrderId,
        userId: '7d14fc11-a0bf-449f-97af-6c3e9faa8841',
        customerName: 'test@example.com',
        game: 'Call of Duty: Modern Warfare',
        service: 'Damascus Camo Unlock',
        price: 149.99,
        status: 'pending',
        date: new Date(),
        paymentId: 'test_payment_' + Date.now() // This will trigger payment-confirmed notification
      }
    });
    
    console.log('✅ تم إنشاء الطلب:', testOrder.id);
    
    // Send payment-confirmed notification using the new system
    console.log('📤 إرسال إشعار payment-confirmed باستخدام النظام الجماعي...');
    await sendDatabaseNotification('payment-confirmed', {
      userId: testOrder.userId,
      orderId: testOrder.id,
      customerName: testOrder.customerName,
      game: testOrder.game,
      service: testOrder.service,
      price: testOrder.price,
      status: testOrder.status,
      paymentMethod: 'Cryptomus (USDT)',
      timestamp: testOrder.date.toISOString(),
      customerEmail: testOrder.customerName
    });
    
    // Wait a moment for the notification to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check the created notifications
    console.log('\n🔍 فحص الإشعارات للطلب الجديد...');
    const notifications = await prisma.notification.findMany({
      where: {
        data: {
          path: ['orderId'],
          equals: testOrder.id
        }
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
      const userNotifications = notifications.filter(n => !n.isCollectiveAdminNotification);
      
      console.log(`\n📊 النتائج:`);
      console.log(`- إشعارات جماعية للأدمن: ${collectiveNotifications.length}`);
      console.log(`- إشعارات للعملاء: ${userNotifications.length}`);
      console.log(`- إجمالي الإشعارات: ${notifications.length}`);
      
      if (collectiveNotifications.length > 0) {
        console.log('\n✅ النظام الجماعي يعمل بنجاح!');
        console.log('🎉 تم تقليل عدد الإشعارات من 3 إلى 1 للأدمن!');
      } else {
        console.log('\n❌ النظام القديم ما زال يعمل - إشعارات منفصلة لكل أدمن');
      }
    }
    
    // Clean up - delete the test order
    console.log('\n🧹 تنظيف البيانات التجريبية...');
    await prisma.order.delete({
      where: { id: testOrder.id }
    });
    console.log('✅ تم حذف الطلب التجريبي');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewOrderCollective();