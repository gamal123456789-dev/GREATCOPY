const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificationFix() {
  console.log('🔍 Testing notification system after fixes...');
  
  try {
    // Get recent orders with notifications
    const recentOrders = await prisma.order.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 5
    });
    
    console.log(`\n📊 Found ${recentOrders.length} recent orders`);
    
    for (const order of recentOrders) {
      console.log(`\n🔍 Analyzing order: ${order.id}`);
      console.log(`   Customer: ${order.customerName}`);
      console.log(`   Payment ID: ${order.paymentId || 'None'}`);
      console.log(`   Status: ${order.status}`);
      
      // Get notifications for this order
      const notifications = await prisma.notification.findMany({
        where: {
          OR: [
            {
              data: {
                path: ['orderId'],
                equals: order.id
              }
            },
            {
              data: {
                path: ['order_id'],
                equals: order.id
              }
            }
          ]
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      console.log(`   📬 Total notifications: ${notifications.length}`);
      
      // Group by type
      const notificationsByType = {};
      notifications.forEach(notif => {
        if (!notificationsByType[notif.type]) {
          notificationsByType[notif.type] = [];
        }
        notificationsByType[notif.type].push(notif);
      });
      
      // Check for duplicates
      let hasDuplicates = false;
      Object.entries(notificationsByType).forEach(([type, notifs]) => {
        console.log(`   📝 ${type}: ${notifs.length} notifications`);
        
        if (notifs.length > 1) {
          hasDuplicates = true;
          console.log(`   ⚠️  DUPLICATE DETECTED: ${type} has ${notifs.length} notifications`);
          
          // Show timestamps
          notifs.forEach((notif, index) => {
            console.log(`      ${index + 1}. ${notif.createdAt.toISOString()}`);
          });
        }
      });
      
      // Expected behavior check
      const hasPaymentId = order.paymentId && !order.paymentId.startsWith('test-uuid-');
      
      if (hasPaymentId) {
        // Webhook-created order should only have payment-confirmed
        const expectedTypes = ['payment-confirmed'];
        const actualTypes = Object.keys(notificationsByType);
        
        console.log(`   ✅ Expected for webhook order: ${expectedTypes.join(', ')}`);
        console.log(`   📋 Actual: ${actualTypes.join(', ')}`);
        
        if (actualTypes.includes('new-order')) {
          console.log(`   ❌ ERROR: Webhook order should not have new-order notifications`);
        }
        
        if (notificationsByType['payment-confirmed']?.length > 1) {
          console.log(`   ❌ ERROR: Multiple payment-confirmed notifications detected`);
        }
      } else {
        // Manual order should have new-order
        console.log(`   ✅ Manual order - should have new-order notification`);
      }
      
      if (!hasDuplicates) {
        console.log(`   ✅ No duplicates found for this order`);
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('✅ Notification system test completed');
    console.log('🔧 Recent fixes applied:');
    console.log('   - Middleware now skips notifications for orders with paymentId');
    console.log('   - Webhook no longer sends duplicate payment-confirmed for existing orders');
    console.log('   - Only new orders from webhook get payment-confirmed notifications');
    
  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationFix();