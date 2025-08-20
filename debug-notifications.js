const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // فحص الإشعارات في آخر 24 ساعة
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'payment-confirmed',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: { email: true, role: true }
        }
      }
    });

    console.log('إجمالي الإشعارات في آخر 24 ساعة:', notifications.length);
    console.log('\n--- تحليل الإشعارات ---');

    const grouped = {};
    
    notifications.forEach(notification => {
      try {
        const data = typeof notification.data === 'string' 
          ? JSON.parse(notification.data) 
          : notification.data;
        
        const orderId = data?.orderId || 'unknown';
        
        if (!grouped[orderId]) {
          grouped[orderId] = [];
        }
        
        grouped[orderId].push({
          user: notification.User?.email,
          role: notification.User?.role,
          time: notification.createdAt,
          id: notification.id
        });
      } catch (parseError) {
        console.log('خطأ في تحليل البيانات للإشعار:', notification.id);
      }
    });

    // عرض الطلبات المكررة
    let duplicatesFound = false;
    Object.entries(grouped).forEach(([orderId, notifs]) => {
      if (notifs.length > 4) { // أكثر من 4 إشعارات (3 للإدارة + 1 للعميل)
        duplicatesFound = true;
        console.log(`\n🚨 طلب مكرر: ${orderId}`);
        console.log(`   عدد الإشعارات: ${notifs.length}`);
        notifs.forEach((n, i) => {
          console.log(`   ${i+1}. ${n.user} (${n.role}) - ${n.time}`);
        });
      } else if (notifs.length === 4) {
        console.log(`\n✅ طلب طبيعي: ${orderId} - 4 إشعارات (3 إدارة + 1 عميل)`);
      }
    });

    if (!duplicatesFound) {
      console.log('\n✅ لم يتم العثور على إشعارات مكررة غير طبيعية!');
      console.log('النظام يعمل كما هو مصمم: 3 إشعارات للإدارة + 1 للعميل = 4 إشعارات لكل طلب');
    }

    // فحص آخر طلب
    const latestOrder = Object.entries(grouped)[0];
    if (latestOrder) {
      console.log(`\n📋 آخر طلب: ${latestOrder[0]}`);
      console.log(`   عدد الإشعارات: ${latestOrder[1].length}`);
      latestOrder[1].forEach((n, i) => {
        console.log(`   ${i+1}. ${n.user} (${n.role})`);
      });
    }

  } catch (error) {
    console.error('خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();