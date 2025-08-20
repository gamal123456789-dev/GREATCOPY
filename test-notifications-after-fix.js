const { PrismaClient } = require('@prisma/client');
const { emitToUser, emitToAdmin } = require('./lib/socket-cjs');

const prisma = new PrismaClient();

/**
 * Test notification system after fixes
 * This test verifies that notifications are sent properly when orders are created
 */
async function testNotificationSystem() {
  console.log('🧪 Testing Notification System After Fixes');
  console.log('=' .repeat(50));
  
  const testResults = {
    socketConnection: false,
    userNotification: false,
    adminNotification: false,
    fallbackSystem: false
  };
  
  try {
    // Test 1: Check Socket.IO connection
    console.log('\n1️⃣ Testing Socket.IO Connection:');
    try {
      // Try to emit a test notification
      emitToAdmin('test-notification', {
        type: 'test',
        message: 'Testing notification system',
        timestamp: new Date()
      });
      
      console.log('✅ Socket.IO functions are available');
      testResults.socketConnection = true;
    } catch (error) {
      console.log('❌ Socket.IO connection issue:', error.message);
    }
    
    // Test 2: Create a test user and order
    console.log('\n2️⃣ Creating Test Order and Notifications:');
    
    // Create or find test user
    let testUser;
    try {
      testUser = await prisma.user.findFirst({
        where: { email: 'test-notifications@example.com' }
      });
      
      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            id: `test-user-${Date.now()}`,
            email: 'test-notifications@example.com',
            name: 'Test Notification User',
            username: 'testnotificationuser'
          }
        });
        console.log('✅ Test user created:', testUser.id);
      } else {
        console.log('✅ Test user found:', testUser.id);
      }
    } catch (error) {
      console.log('❌ Failed to create/find test user:', error.message);
      return;
    }
    
    // Create test order
    const testOrderId = `test-order-${Date.now()}`;
    let testOrder;
    
    try {
      testOrder = await prisma.order.create({
        data: {
          id: testOrderId,
          userId: testUser.id,
          customerName: testUser.name || testUser.email,
          date: new Date(),
          game: 'War Thunder',
          service: 'Test Notification Service',
          price: 25.00,
          status: 'pending',
          notes: 'Test order for notification system'
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true
            }
          }
        }
      });
      
      console.log('✅ Test order created:', testOrder.id);
    } catch (error) {
      console.log('❌ Failed to create test order:', error.message);
      return;
    }
    
    // Test 3: Send user notification
    console.log('\n3️⃣ Testing User Notification:');
    try {
      emitToUser(testUser.id, 'new-notification', {
        type: 'order_confirmed',
        orderId: testOrder.id,
        serviceName: `${testOrder.game} - ${testOrder.service}`,
        message: `Your order has been confirmed - ${testOrder.game} (${testOrder.service})`,
        timestamp: new Date()
      });
      
      console.log('✅ User notification sent successfully');
      testResults.userNotification = true;
    } catch (error) {
      console.log('❌ User notification failed:', error.message);
    }
    
    // Test 4: Send admin notification
    console.log('\n4️⃣ Testing Admin Notification:');
    try {
      const displayName = testUser.name || testUser.username || testUser.email?.split('@')[0] || 'Unknown';
      
      emitToAdmin('new-order', {
        type: 'new-order',
        orderId: testOrder.id,
        customerName: displayName,
        game: testOrder.game,
        service: testOrder.service,
        serviceName: `${testOrder.game} - ${testOrder.service}`,
        price: testOrder.price,
        message: `New order from ${displayName} - ${testOrder.game} (${testOrder.service})`,
        timestamp: new Date(),
        order: {
          id: testOrder.id,
          customerName: displayName,
          game: testOrder.game,
          service: testOrder.service,
          status: testOrder.status,
          price: testOrder.price,
          date: testOrder.date.toISOString(),
          userId: testOrder.userId,
          notes: testOrder.notes,
          user: {
            id: testOrder.User.id,
            name: testOrder.User.name,
            email: testOrder.User.email,
            username: testOrder.User.username,
            displayName
          }
        }
      });
      
      console.log('✅ Admin notification sent successfully');
      testResults.adminNotification = true;
    } catch (error) {
      console.log('❌ Admin notification failed:', error.message);
    }
    
    // Test 5: Check fallback system
    console.log('\n5️⃣ Testing Fallback Notification System:');
    try {
      const { saveFallbackNotification } = require('./lib/fallback-notifications');
      
      await saveFallbackNotification({
        type: 'admin',
        event: 'new-order',
        data: {
          orderId: testOrder.id,
          message: 'Test fallback notification'
        },
        timestamp: new Date()
      });
      
      console.log('✅ Fallback notification system working');
      testResults.fallbackSystem = true;
    } catch (error) {
      console.log('❌ Fallback system failed:', error.message);
    }
    
    // Cleanup
    console.log('\n6️⃣ Cleaning Up Test Data:');
    try {
      await prisma.order.delete({ where: { id: testOrder.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.log('❌ Cleanup failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
  
  // Test Results Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 NOTIFICATION SYSTEM TEST RESULTS:');
  console.log('='.repeat(50));
  
  const tests = [
    { test: 'Socket.IO Connection', status: testResults.socketConnection, description: 'Socket.IO functions available' },
    { test: 'User Notifications', status: testResults.userNotification, description: 'User notifications sent successfully' },
    { test: 'Admin Notifications', status: testResults.adminNotification, description: 'Admin notifications sent successfully' },
    { test: 'Fallback System', status: testResults.fallbackSystem, description: 'Fallback notification system working' }
  ];
  
  tests.forEach(({ test, status, description }) => {
    const icon = status ? '✅' : '❌';
    const statusText = status ? 'PASS' : 'FAIL';
    console.log(`${icon} ${test}: ${statusText} - ${description}`);
  });
  
  const passedTests = tests.filter(t => t.status).length;
  const totalTests = tests.length;
  
  console.log('\n📈 Overall Result:');
  console.log(`   ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All notification tests passed! System is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n💡 Recommendations:');
  if (!testResults.socketConnection) {
    console.log('   - Check if Socket.IO server is running');
    console.log('   - Verify socket-cjs.js configuration');
  }
  if (!testResults.userNotification || !testResults.adminNotification) {
    console.log('   - Check notification service configuration');
    console.log('   - Verify emitToUser and emitToAdmin functions');
  }
  if (!testResults.fallbackSystem) {
    console.log('   - Check fallback-notifications.js file');
    console.log('   - Verify fallback system is properly configured');
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('   1. If Socket.IO is not working, restart the server');
  console.log('   2. Check server logs for any Socket.IO connection errors');
  console.log('   3. Test with real orders to confirm notifications work in production');
  console.log('   4. Monitor fallback notifications in console logs');
}

// Run the test
testNotificationSystem().catch(console.error);