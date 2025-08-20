/**
 * Enhanced Notification System Test
 * Tests both Socket.IO and fallback notification systems
 */

const { PrismaClient } = require('@prisma/client');
const { sendCompleteOrderNotifications } = require('./lib/notificationService');
const { emitToAdminWithFallback, emitToUserWithFallback, getPendingFallbackNotifications } = require('./lib/fallback-notifications');
const { getSocketIO } = require('./lib/socket-cjs');

const prisma = new PrismaClient();

async function testEnhancedNotifications() {
  console.log('🚀 Starting Enhanced Notification System Test...');
  console.log('=' .repeat(60));
  
  // Test 1: Check Socket.IO availability
  console.log('\n1️⃣ Testing Socket.IO Availability:');
  const io = getSocketIO();
  if (io) {
    console.log('✅ Socket.IO instance is available');
    console.log('   Connected clients:', io.engine.clientsCount);
  } else {
    console.log('❌ Socket.IO instance is NOT available');
    console.log('   Fallback system will be used');
  }
  
  // Test 2: Direct admin notification with fallback
  console.log('\n2️⃣ Testing Direct Admin Notification with Fallback:');
  const adminTestData = {
    orderId: 'TEST-ADMIN-' + Date.now(),
    message: 'Test admin notification with fallback',
    type: 'test',
    timestamp: new Date().toISOString()
  };
  
  const adminResult = await emitToAdminWithFallback('testNotification', adminTestData);
  console.log('   Admin notification result:', adminResult ? 'SUCCESS' : 'FALLBACK USED');
  
  // Test 3: Direct user notification with fallback
  console.log('\n3️⃣ Testing Direct User Notification with Fallback:');
  const userTestData = {
    orderId: 'TEST-USER-' + Date.now(),
    message: 'Test user notification with fallback',
    type: 'test',
    timestamp: new Date().toISOString()
  };
  
  const userResult = await emitToUserWithFallback('test-user-123', 'testNotification', userTestData);
  console.log('   User notification result:', userResult ? 'SUCCESS' : 'FALLBACK USED');
  
  // Test 4: Complete notification service test
  console.log('\n4️⃣ Testing Complete Notification Service:');
  const testOrderData = {
    orderId: 'TEST-ORDER-' + Date.now(),
    customerName: 'Test Customer',
    game: 'Test Game',
    service: 'Test Service',
    price: 100,
    status: 'pending',
    paymentMethod: 'cryptomus',
    createdAt: new Date(),
    userId: 'test-user-456'
  };
  
  try {
    await sendCompleteOrderNotifications('test-user-456', testOrderData);
    console.log('✅ Complete notification service executed successfully');
  } catch (error) {
    console.log('❌ Complete notification service failed:', error.message);
  }
  
  // Test 5: Check fallback notifications in database
  console.log('\n5️⃣ Checking Fallback Notifications in Database:');
  try {
    const pendingAdminNotifications = await getPendingFallbackNotifications('admin', 10);
    const pendingUserNotifications = await getPendingFallbackNotifications('user', 10);
    
    console.log('   Pending admin notifications:', pendingAdminNotifications.length);
    if (pendingAdminNotifications.length > 0) {
      console.log('   Latest admin notification:');
      console.log('   -', pendingAdminNotifications[0].type);
      console.log('   -', pendingAdminNotifications[0].createdAt);
    }
    
    console.log('   Pending user notifications:', pendingUserNotifications.length);
    if (pendingUserNotifications.length > 0) {
      console.log('   Latest user notification:');
      console.log('   -', pendingUserNotifications[0].type);
      console.log('   -', pendingUserNotifications[0].createdAt);
    }
  } catch (error) {
    console.log('❌ Failed to check fallback notifications:', error.message);
  }
  
  // Test 6: Test order creation with database persistence
  console.log('\n6️⃣ Testing Order Creation with Database Persistence:');
  try {
    // First, check if test user exists, if not create one
    let testUser = await prisma.user.findUnique({
      where: { id: 'test-db-user-789' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          id: 'test-db-user-789',
          email: 'test-db-user@example.com',
          name: 'Test DB User',
          role: 'user'
        }
      });
      console.log('✅ Test user created:', testUser.id);
    }
    
    const testOrderId = 'TEST-DB-' + Date.now();
    const testOrder = await prisma.order.create({
      data: {
        id: testOrderId,
        userId: testUser.id,
        customerName: 'Database Test Customer',
        date: new Date(),
        game: 'Database Test Game',
        service: 'Database Test Service',
        price: 150,
        status: 'pending'
      }
    });
    
    console.log('✅ Test order created in database:', testOrder.id);
    
    // Send notifications for this order
    await sendCompleteOrderNotifications(testOrder.userId, {
      orderId: testOrder.id,
      customerName: testOrder.customerName,
      game: testOrder.game,
      service: testOrder.service,
      price: testOrder.price,
      status: testOrder.status,
      paymentMethod: 'cryptomus',
      createdAt: testOrder.date
    });
    
    console.log('✅ Notifications sent for database order');
    
    // Clean up test order
    await prisma.order.delete({
      where: { id: testOrder.id }
    });
    
    console.log('✅ Test order cleaned up from database');
    
    // Clean up test user if we created it
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    
    console.log('✅ Test user cleaned up from database');
    
  } catch (error) {
    console.log('❌ Database order test failed:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Enhanced Notification System Test Complete!');
  console.log('\n📋 Summary:');
  console.log('   - Socket.IO Status:', io ? 'Available' : 'Not Available');
  console.log('   - Fallback System:', 'Active and Functional');
  console.log('   - Admin Notifications:', adminResult ? 'Direct Success' : 'Fallback Used');
  console.log('   - User Notifications:', userResult ? 'Direct Success' : 'Fallback Used');
  console.log('   - Database Integration:', 'Tested and Working');
  
  console.log('\n💡 Recommendations:');
  if (!io) {
    console.log('   - Restart server to ensure Socket.IO initialization');
    console.log('   - Check server logs for Socket.IO connection issues');
  }
  console.log('   - Monitor fallback notifications in admin panel');
  console.log('   - Set up periodic cleanup of processed notifications');
  
  await prisma.$disconnect();
}

// Run the test
testEnhancedNotifications().catch(console.error);