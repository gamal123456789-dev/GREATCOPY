const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestOrderNotifications() {
  try {
    const orderId = 'cm_order_1755594771193_uupk6gj60';
    
    const notifications = await prisma.notification.findMany({
      where: {
        data: {
          path: ['orderId'],
          equals: orderId
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n=== تحليل إشعارات الطلب الجديد ===');
    console.log('معرف الطلب:', orderId);
    console.log('عدد الإشعارات:', notifications.length);
    
    let adminNotifications = 0;
    let userNotifications = 0;
    let collectiveNotifications = 0;
    
    notifications.forEach((notif, index) => {
      console.log(`\n${index + 1}. نوع الإشعار: ${notif.type}`);
      console.log(`   للمستخدم: ${notif.userId || 'إدارة'}`);
      console.log(`   جماعي للإدارة: ${notif.isCollectiveAdminNotification}`);
      console.log(`   معرفات الإدارة: ${notif.adminUserIds ? JSON.stringify(notif.adminUserIds) : 'لا يوجد'}`);
      console.log(`   تاريخ الإنشاء: ${notif.createdAt}`);
      
      if (notif.userId) {
        userNotifications++;
      } else if (notif.isCollectiveAdminNotification) {
        collectiveNotifications++;
      } else {
        adminNotifications++;
      }
    });
    
    console.log('\n=== ملخص الإشعارات ===');
    console.log('إشعارات المستخدم:', userNotifications);
    console.log('إشعارات الإدارة (فردية):', adminNotifications);
    console.log('إشعارات الإدارة (جماعية):', collectiveNotifications);
    
    if (collectiveNotifications > 0) {
      console.log('\n✅ النظام الجماعي يعمل!');
    } else {
      console.log('\n❌ النظام القديم ما زال يعمل!');
    }
    
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestOrderNotifications();