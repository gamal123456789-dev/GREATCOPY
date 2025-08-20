const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestOrders() {
  try {
    // Check latest orders
    const orders = await prisma.order.findMany({
      orderBy: { date: 'desc' },
      take: 3
    });
    
    console.log('آخر 3 طلبات:');
    orders.forEach((order, i) => {
      console.log(`${i+1}. ID: ${order.id}, تاريخ الإنشاء: ${order.date}, الحالة: ${order.status}`);
    });
    
    // Check notifications for the specific order mentioned by user
    const orderId = 'cm_order_1755593731197_cv3whdzbx';
    console.log('\n--- فحص الطلب المذكور من المستخدم ---');
    
    const notifications = await prisma.notification.findMany({
      where: {
        data: {
          path: ['orderId'],
          equals: orderId
        }
      }
    });
    
    console.log(`عدد الإشعارات للطلب ${orderId}:`, notifications.length);
    
    if (notifications.length > 0) {
      console.log('\nتفاصيل الإشعارات:');
      notifications.forEach((n, i) => {
        console.log(`${i+1}. النوع: ${n.type}, المستخدم: ${n.userId}`);
        console.log(`   الرسالة: ${n.message.substring(0, 80)}...`);
        console.log(`   التاريخ: ${n.createdAt}`);
        console.log('   ---');
      });
      
      // Check if this is the new collective notification system
      const collectiveNotifications = notifications.filter(n => n.isCollectiveAdminNotification);
      if (collectiveNotifications.length > 0) {
        console.log('\n✅ النظام الجديد للإشعارات الجماعية يعمل!');
        console.log(`عدد الإشعارات الجماعية: ${collectiveNotifications.length}`);
      } else {
        console.log('\n❌ النظام القديم ما زال يعمل - إشعارات منفصلة لكل أدمن');
      }
    }
    
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestOrders();