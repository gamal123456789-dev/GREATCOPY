const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLatestRealOrder() {
  try {
    console.log('🔍 فحص آخر طلب حقيقي...');
    
    // Get the latest order
    const latestOrder = await prisma.order.findFirst({
      orderBy: { date: 'desc' },
      include: { User: true }
    });
    
    if (!latestOrder) {
      console.log('❌ لا توجد طلبات');
      return;
    }
    
    console.log(`📦 آخر طلب: ${latestOrder.id}`);
    console.log(`👤 للمستخدم: ${latestOrder.User?.email || latestOrder.customerName || 'غير محدد'}`);
    console.log(`💰 السعر: $${latestOrder.price}`);
    console.log(`📅 التاريخ: ${latestOrder.date}`);
    console.log(`🔄 الحالة: ${latestOrder.status}`);
    console.log(`💳 معرف الدفع: ${latestOrder.paymentId || 'غير محدد'}`);
    
    // Get notifications for this order
    const notifications = await prisma.notification.findMany({
      where: {
        data: {
          path: ['orderId'],
          equals: latestOrder.id
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n📬 عدد الإشعارات: ${notifications.length}`);
    
    if (notifications.length > 0) {
      console.log('\n📋 تفاصيل الإشعارات:');
      notifications.forEach((n, i) => {
        console.log(`${i+1}. النوع: ${n.type}`);
        console.log(`   المستخدم: ${n.userId}`);
        console.log(`   إشعار جماعي: ${n.isCollectiveAdminNotification}`);
        console.log(`   معرفات الأدمن: ${n.adminUserIds ? JSON.stringify(n.adminUserIds) : 'غير محدد'}`);
        console.log(`   الرسالة: ${n.message.substring(0, 80)}...`);
        console.log(`   التاريخ: ${n.createdAt}`);
        console.log('   ---');
      });
      
      // Analyze notification types
      const adminNotifications = notifications.filter(n => n.type === 'payment-confirmed' && n.userId !== latestOrder.userId);
      const userNotifications = notifications.filter(n => n.userId === latestOrder.userId);
      const collectiveNotifications = notifications.filter(n => n.isCollectiveAdminNotification);
      
      console.log(`\n📊 تحليل الإشعارات:`);
      console.log(`- إشعارات الأدمن: ${adminNotifications.length}`);
      console.log(`- إشعارات العميل: ${userNotifications.length}`);
      console.log(`- إشعارات جماعية: ${collectiveNotifications.length}`);
      
      if (collectiveNotifications.length > 0) {
        console.log('\n✅ النظام الجماعي يعمل!');
      } else if (adminNotifications.length > 1) {
        console.log('\n❌ النظام القديم ما زال يعمل - إشعارات منفصلة لكل أدمن');
        console.log('🔧 يجب تطبيق النظام الجماعي على الطلبات الجديدة');
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في الفحص:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestRealOrder();