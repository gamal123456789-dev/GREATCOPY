/**
 * Test live notification system
 * This test simulates creating a new order and checks if notifications are sent
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLiveNotifications() {
  console.log('🧪 Testing Live Notification System');
  console.log('=' .repeat(50));
  
  try {
    // Create a test user if not exists
    let testUser = await prisma.user.findFirst({
      where: { email: 'test-live-notifications@example.com' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          id: `test-live-${Date.now()}`,
          email: 'test-live-notifications@example.com',
          name: 'Test Live User',
          username: 'testliveuser',
          role: 'USER'
        }
      });
      console.log('✅ Created test user:', testUser.id);
    } else {
      console.log('✅ Using existing test user:', testUser.id);
    }
    
    // Create a test payment session
    const orderId = `test-order-${Date.now()}`;
    const paymentSession = await prisma.paymentSession.create({
      data: {
        orderId: orderId,
        userId: testUser.id,
        customerEmail: testUser.email,
        game: 'destiny2',
        service: 'Test Boost Service',
        serviceDetails: 'Test notification service',
        amount: 50.00,
        currency: 'USD',
        paymentProvider: 'crypto',
        status: 'completed'
      }
    });
    
    console.log('✅ Created test payment session:', paymentSession.id);
    
    // Simulate the order creation process that happens in auto-process-payments.js
    console.log('\n🔄 Simulating order creation process...');
    
    // Import the notification functions
    const { emitToUser, emitToAdmin } = require('./lib/socket-cjs');
    
    // Create the order
    const newOrder = await prisma.order.create({
      data: {
        id: orderId,
        userId: testUser.id,
        customerName: testUser.name || testUser.username || 'Test User',
        date: new Date(),
        game: paymentSession.game,
        service: paymentSession.service,
        price: paymentSession.amount,
        status: 'pending',
        paymentId: paymentSession.paymentId
      }
    });
    
    console.log('✅ Created test order:', newOrder.id);
    
    // Test user notification (same as in auto-process-payments.js)
    console.log('\n📤 Testing user notification...');
    const userNotificationData = {
      type: 'order_confirmed',
      message: `تم تأكيد طلبك ${newOrder.id} بنجاح! سيتم البدء في المعالجة قريباً.`,
      orderId: newOrder.id,
      amount: newOrder.price,
      currency: paymentSession.currency,
      serviceName: newOrder.service,
      gameId: newOrder.game,
      timestamp: new Date().toISOString()
    };
    
    const userNotificationResult = emitToUser(testUser.id, 'new-notification', userNotificationData);
    console.log('User notification result:', userNotificationResult ? 'SUCCESS' : 'FALLBACK USED');
    
    // Test admin notification (same as in auto-process-payments.js)
    console.log('\n📤 Testing admin notification...');
    const adminNotificationData = {
      type: 'new_order',
      orderId: newOrder.id,
      customerName: testUser.name || testUser.username,
      customerEmail: testUser.email,
      game: newOrder.game,
      service: newOrder.service,
      amount: newOrder.price,
      currency: paymentSession.currency,
      price: `${newOrder.price} ${paymentSession.currency}`,
      paymentMethod: paymentSession.paymentProvider,
      timestamp: new Date().toISOString(),
      order: newOrder
    };
    
    const adminNotificationResult = emitToAdmin('new-order', adminNotificationData);
    console.log('Admin notification result:', adminNotificationResult ? 'SUCCESS' : 'FALLBACK USED');
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.order.delete({ where: { id: newOrder.id } });
    await prisma.paymentSession.delete({ where: { id: paymentSession.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    
    console.log('✅ Test completed successfully!');
    console.log('\n📊 Test Results:');
    console.log('- User Notification:', userNotificationResult ? '✅ SUCCESS' : '⚠️  FALLBACK');
    console.log('- Admin Notification:', adminNotificationResult ? '✅ SUCCESS' : '⚠️  FALLBACK');
    
    if (!userNotificationResult || !adminNotificationResult) {
      console.log('\n⚠️  Some notifications used fallback system.');
      console.log('   This means Socket.IO is not available, but notifications are still logged.');
      console.log('   Check the server logs for fallback notification entries.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testLiveNotifications().catch(console.error);