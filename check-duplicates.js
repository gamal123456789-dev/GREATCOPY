const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    // Get notifications from the last 2 hours
    const notifications = await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n🔍 Found ${notifications.length} notifications in the last 2 hours`);
    
    // Group by order ID and type
    const grouped = {};
    
    notifications.forEach(n => {
      try {
        // Handle both JSON string and object data
        let data;
        if (typeof n.data === 'string') {
          data = JSON.parse(n.data);
        } else {
          data = n.data;
        }
        
        const orderId = data.orderId || data.order_id || 'unknown';
        
        if (!grouped[orderId]) {
          grouped[orderId] = {};
        }
        
        if (!grouped[orderId][n.type]) {
          grouped[orderId][n.type] = [];
        }
        
        grouped[orderId][n.type].push({
          id: n.id,
          createdAt: n.createdAt
        });
      } catch (e) {
        console.log('⚠️ Failed to process notification:', n.id, e.message);
      }
    });
    
    console.log('\n📊 Duplicate notifications analysis:');
    
    let foundDuplicates = false;
    
    Object.entries(grouped).forEach(([orderId, types]) => {
      console.log(`\n📋 Order: ${orderId}`);
      
      Object.entries(types).forEach(([type, notifications]) => {
        if (notifications.length > 1) {
          foundDuplicates = true;
          console.log(`  ❌ DUPLICATE ${type}: ${notifications.length} times`);
          notifications.forEach((notif, i) => {
            console.log(`    ${i + 1}. ${notif.createdAt.toISOString()} (ID: ${notif.id})`);
          });
        } else {
          console.log(`  ✅ OK ${type}: ${notifications.length} time`);
        }
      });
    });
    
    if (!foundDuplicates) {
      console.log('\n✅ No duplicate notifications found!');
    } else {
      console.log('\n❌ Duplicate notifications detected. The issue persists.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();