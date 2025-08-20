const { PrismaClient } = require('@prisma/client');
const { sendDatabaseNotification } = require('./services/databaseNotificationService');

const prisma = new PrismaClient();

async function simpleNotificationTest() {
  try {
    console.log('🧪 اختبار بسيط لنظام الإشعارات الجديد...');
    
    const testOrderId = 'simple_test_' + Date.now();
    
    // إرسال إشعار payment-confirmed
    console.log('📤 إرسال إشعار payment-confirmed...');
    await sendDatabaseNotification('payment-confirmed', {
      userId: '7d14fc11-a0bf-6c3e9faa8841',
      orderId: testOrderId,
      customerName: 'عميل تجريبي',
      game: 'لعبة تجريبية',
      service: 'خدمة تجريبية',
      price: 15,
      status: 'pending',
      paymentMethod: 'Cryptomus',
      timestamp: new Date().toISOString(),
      customerEmail: 'test@example.com'
    });
    
    // انتظار قصير للتأكد من حفظ البيانات
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // فحص الإشعارات المُنشأة
    console.log('\n🔍 فحص الإشعارات المُنشأة...');
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
        userId: true,
        data: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📊 النتائج:`);
    console.log(`عدد الإشعارات المُنشأة: ${notifications.length}`);
    
    if (notifications.length === 1) {
      console.log('✅ ممتاز! تم إنشاء إشعار واحد فقط (جماعي للإدارة)');
      const notification = notifications[0];
      console.log('\n📋 تفاصيل الإشعار الجماعي:');
      console.log(`   - ID: ${notification.id}`);
      console.log(`   - النوع: ${notification.type}`);
      console.log(`   - المستخدم الأساسي: ${notification.userId}`);
      console.log(`   - إشعار جماعي: ${notification.data.isCollectiveAdminNotification ? 'نعم' : 'لا'}`);
      console.log(`   - عدد الأدمن المستهدفين: ${notification.data.adminUserIds?.length || 0}`);
      if (notification.data.adminEmails) {
        console.log(`   - إيميلات الأدمن: ${notification.data.adminEmails.join(', ')}`);
      }
    } else if (notifications.length > 1) {
      console.log('❌ تحذير! تم إنشاء أكثر من إشعار واحد:');
      notifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ID: ${notif.id}, المستخدم: ${notif.userId}, النوع: ${notif.type}`);
        console.log(`      إشعار جماعي: ${notif.data.isCollectiveAdminNotification ? 'نعم' : 'لا'}`);
      });
    } else {
      console.log('❌ خطأ! لم يتم إنشاء أي إشعارات');
    }
    
    // تنظيف البيانات التجريبية
    console.log('\n🧹 تنظيف البيانات التجريبية...');
    const deletedCount = await prisma.notification.deleteMany({
      where: {
        data: {
          path: ['orderId'],
          equals: testOrderId
        }
      }
    });
    console.log(`تم حذف ${deletedCount.count} إشعار`);
    
    console.log('\n✅ انتهى الاختبار!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// تشغيل الاختبار
simpleNotificationTest();