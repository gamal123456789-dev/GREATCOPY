const { PrismaClient } = require('@prisma/client');
const { emitToAdmin } = require('./lib/socket-cjs');
const { sendCompleteOrderNotifications } = require('./lib/notificationService');

const prisma = new PrismaClient();

async function testAdminNotifications() {
  console.log('🔍 Testing Admin Notifications System...');
  console.log('Time:', new Date().toISOString());
  
  try {
    // Test 1: Check Socket.IO availability
    console.log('\n1️⃣ Testing Socket.IO availability:');
    const { getSocketIO } = require('./lib/socket-cjs');
    const io = getSocketIO();
    
    if (io) {
      console.log('✅ Socket.IO instance available');
      console.log('🏠 Current rooms:', Array.from(io.sockets.adapter.rooms.keys()));
      console.log('👥 Connected sockets:', io.sockets.sockets.size);
    } else {
      console.log('❌ Socket.IO instance not available');
      console.log('💡 This might be why admin notifications are not working');
    }
    
    // Test 2: Test direct admin emission
    console.log('\n2️⃣ Testing direct admin emission:');
    const testNotification = {
      orderId: 'test_' + Date.now(),
      customerName: 'Test Customer',
      game: 'Test Game',
      service: 'Test Service',
      price: 100,
      status: 'pending',
      paymentMethod: 'Test Payment',
      createdAt: new Date(),
      message: 'اختبار إشعار الإدارة - Test Admin Notification',
      type: 'new_order',
      priority: 'high'
    };
    
    try {
      emitToAdmin('newOrder', testNotification);
      console.log('✅ Direct admin emission completed');
    } catch (error) {
      console.log('❌ Direct admin emission failed:', error.message);
    }
    
    // Test 3: Test notification service
    console.log('\n3️⃣ Testing notification service:');
    try {
      const { sendNewOrderNotification } = require('./lib/notificationService');
      const result = sendNewOrderNotification(testNotification);
      console.log('✅ Notification service result:', result);
    } catch (error) {
      console.log('❌ Notification service failed:', error.message);
    }
    
    // Test 4: Create a real test order to verify the full flow
    console.log('\n4️⃣ Testing full order creation flow:');
    
    // Find a test user
    const testUser = await prisma.user.findFirst({
      where: {
        email: { contains: '@' }
      }
    });
    
    if (!testUser) {
      console.log('❌ No test user found in database');
      return;
    }
    
    console.log('👤 Using test user:', testUser.email);
    
    // Create test order
    const testOrder = await prisma.order.create({
      data: {
        id: `test_order_${Date.now()}`,
        userId: testUser.id,
        customerName: testUser.username || testUser.email,
        game: 'Test Game - Admin Notification Test',
        service: 'Test Service - Admin Notification Test',
        status: 'pending', // Using pending as requested
        price: 150.00,
        date: new Date(),
        paymentId: `test_payment_${Date.now()}`
      }
    });
    
    console.log('✅ Test order created:', testOrder.id);
    
    // Test complete notification flow
    console.log('\n5️⃣ Testing complete notification flow:');
    const orderData = {
      orderId: testOrder.id,
      customerName: testOrder.customerName,
      game: testOrder.game,
      service: testOrder.service,
      price: testOrder.price,
      status: testOrder.status,
      paymentMethod: 'Test Payment',
      createdAt: testOrder.date
    };
    
    try {
      const result = sendCompleteOrderNotifications(testUser.id, orderData);
      console.log('✅ Complete notification flow result:', result);
    } catch (error) {
      console.log('❌ Complete notification flow failed:', error.message);
    }
    
    // Clean up test order
    console.log('\n🧹 Cleaning up test order...');
    await prisma.order.delete({
      where: { id: testOrder.id }
    });
    console.log('✅ Test order cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAdminNotifications().catch(console.error);