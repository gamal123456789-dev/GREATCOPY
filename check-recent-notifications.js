const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentNotifications() {
  try {
    // Get notifications from the last hour
    const recent = await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
    
    console.log(`\n🔍 Found ${recent.length} notifications in the last hour:`);
    
    if (recent.length === 0) {
      console.log('✅ No recent notifications found.');
      return;
    }
    
    // Group by order ID to detect duplicates
    const notificationsByOrder = {};
    
    recent.forEach(notification => {
      try {
        const data = JSON.parse(notification.data);
        const orderId = data.orderId || data.order_id || 'Unknown';
        
        if (!notificationsByOrder[orderId]) {
          notificationsByOrder[orderId] = [];
        }
        
        notificationsByOrder[orderId].push({
          type: notification.type,
          createdAt: notification.createdAt,
          data: data
        });
      } catch (e) {
        console.log('⚠️ Failed to parse notification data:', notification.id);
      }
    });
    
    // Check for duplicates
    let foundDuplicates = false;
    
    Object.entries(notificationsByOrder).forEach(([orderId, notifications]) => {
      console.log(`\n📋 Order: ${orderId}`);
      
      // Group by type
      const byType = {};
      notifications.forEach(notif => {
        if (!byType[notif.type]) {
          byType[notif.type] = [];
        }
        byType[notif.type].push(notif);
      });
      
      Object.entries(byType).forEach(([type, notifs]) => {
        console.log(`   📝 ${type}: ${notifs.length} notifications`);
        
        if (notifs.length > 1) {
          foundDuplicates = true;
          console.log(`   ❌ DUPLICATE DETECTED: ${type}`);
          notifs.forEach((notif, index) => {
            console.log(`      ${index + 1}. ${notif.createdAt.toISOString()}`);
          });
        } else {
          console.log(`   ✅ No duplicates for ${type}`);
        }
      });
    });
    
    if (!foundDuplicates) {
      console.log('\n✅ No duplicate notifications found in recent activity!');
    } else {
      console.log('\n❌ Duplicate notifications still detected. The fixes may need additional work.');
    }
    
  } catch (error) {
    console.error('❌ Error checking notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentNotifications();