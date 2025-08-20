const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotifications() {
  try {
    // Get recent notifications (last 24 hours)
    const notifications = await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        userId: true,
        adminUserIds: true,
        isCollectiveAdminNotification: true,
        createdAt: true,
        data: true
      }
    });
    
    console.log(`Found ${notifications.length} notifications in the last 24 hours:\n`);
    
    notifications.forEach((n, i) => {
      console.log(`${i+1}. ID: ${n.id}`);
      console.log(`   Type: ${n.type}`);
      console.log(`   Title: ${n.title}`);
      console.log(`   UserId: ${n.userId}`);
      console.log(`   IsCollective: ${n.isCollectiveAdminNotification}`);
      console.log(`   AdminUserIds: ${JSON.stringify(n.adminUserIds)}`);
      console.log(`   OrderId: ${n.data?.orderId || 'N/A'}`);
      console.log(`   Created: ${n.createdAt}`);
      console.log('   ---\n');
    });
    
    // Group by order ID to see duplicates
    const orderGroups = {};
    notifications.forEach(n => {
      const orderId = n.data?.orderId;
      if (orderId) {
        if (!orderGroups[orderId]) {
          orderGroups[orderId] = [];
        }
        orderGroups[orderId].push(n);
      }
    });
    
    console.log('\n=== DUPLICATE ANALYSIS ===');
    Object.keys(orderGroups).forEach(orderId => {
      const group = orderGroups[orderId];
      if (group.length > 1) {
        console.log(`\n🚨 Order ${orderId} has ${group.length} notifications:`);
        group.forEach((n, i) => {
          console.log(`   ${i+1}. ${n.type} - ${n.isCollectiveAdminNotification ? 'Collective' : 'Individual'} - ${n.createdAt}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();