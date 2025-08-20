const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCollectiveNotifications() {
  try {
    console.log('🔍 فحص الإشعارات الجماعية في قاعدة البيانات...');
    
    // Check for collective notifications
    const collectiveNotifications = await prisma.notification.findMany({
      where: {
        isCollectiveAdminNotification: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`عدد الإشعارات الجماعية: ${collectiveNotifications.length}`);
    
    if (collectiveNotifications.length > 0) {
      console.log('\n📋 الإشعارات الجماعية الموجودة:');
      collectiveNotifications.forEach((n, i) => {
        console.log(`${i+1}. النوع: ${n.type}`);
        console.log(`   المعرف: ${n.id}`);
        console.log(`   المستخدم الأساسي: ${n.userId}`);
        console.log(`   إشعار جماعي: ${n.isCollectiveAdminNotification}`);
        console.log(`   معرفات الأدمن: ${JSON.stringify(n.adminUserIds)}`);
        console.log(`   الرسالة: ${n.message.substring(0, 80)}...`);
        console.log(`   تاريخ الإنشاء: ${n.createdAt}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ لا توجد إشعارات جماعية في قاعدة البيانات');
    }
    
    // Check recent notifications
    console.log('\n🕐 آخر 10 إشعارات:');
    const recentNotifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    recentNotifications.forEach((n, i) => {
      console.log(`${i+1}. ${n.type} - جماعي: ${n.isCollectiveAdminNotification || false} - المستخدم: ${n.userId}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في فحص الإشعارات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCollectiveNotifications();