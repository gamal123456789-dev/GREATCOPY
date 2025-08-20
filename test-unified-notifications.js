/**
 * Test Unified Notification System
 * Tests the consolidated notification system with sound support
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUnifiedNotifications() {
  console.log('🧪 Testing unified notification system with sound support...');
  
  try {
    // Create a test user first
    const testOrderId = `unified_test_${Date.now()}`;
    const testUserId = 'test_user_unified';
    
    console.log('1️⃣ Creating test user...');
    const testUser = await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        email: 'unified-test@gear-score.com',
        name: 'Unified Test User',
        role: 'user'
      }
    });
    
    console.log('✅ Test user created/found:', testUser.id);
    
    console.log('2️⃣ Creating test payment session...');
    const paymentSession = await prisma.paymentSession.create({
      data: {
        orderId: testOrderId,
        userId: testUserId,
        amount: 25.00,
        currency: 'USD',
        game: 'Path of Exile 2',
        service: 'Currency Boost',
        customerEmail: 'unified-test@gear-score.com',
        paymentId: `unified_${Date.now()}`,
        paymentProvider: 'cryptomus',
        status: 'pending'
      }
    });
    
    console.log('✅ Payment session created:', paymentSession.orderId);
    
    // Create an existing order
    console.log('3️⃣ Creating existing order...');
    const existingOrder = await prisma.order.create({
      data: {
        id: testOrderId,
        userId: testUserId,
        customerName: 'unified-test@gear-score.com',
        date: new Date(),
        game: 'Path of Exile 2',
        service: 'Currency Boost',
        price: 25.00,
        status: 'created',
        paymentId: null,
        notes: 'Unified notification test order'
      }
    });
    
    console.log('✅ Existing order created:', existingOrder.id);
    
    // Count notifications before
    const notificationsBefore = await prisma.notification.count({
      where: {
        type: 'payment-confirmed',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      }
    });
    
    console.log(`📊 Payment-confirmed notifications before: ${notificationsBefore}`);
    
    // Test the unified notification system
    console.log('4️⃣ Testing unified notification system...');
    
    // Import the main notification service (only one call should be made)
    const { sendDatabaseNotification } = require('./services/databaseNotificationService');
    
    // Update order status first
    const updatedOrder = await prisma.order.update({
      where: { id: testOrderId },
      data: {
        status: 'pending',
        paymentId: `unified_payment_${Date.now()}`,
        notes: existingOrder.notes + '\n\n✅ تم تأكيد الدفع بنجاح (Unified Test)'
      }
    });
    
    console.log('✅ Order updated with payment confirmation');
    
    // Send SINGLE unified notification with sound support
    console.log('🔔 Sending unified notification with sound...');
    try {
      await sendDatabaseNotification('payment-confirmed', {
        userId: paymentSession.userId,
        orderId: updatedOrder.id,
        customerName: updatedOrder.customerName,
        game: updatedOrder.game,
        service: updatedOrder.service,
        price: updatedOrder.price,
        status: updatedOrder.status,
        paymentMethod: 'Cryptomus (USDT)',
        timestamp: updatedOrder.date.toISOString(),
        customerEmail: paymentSession.customerEmail
      });
      console.log('✅ Unified notification with sound sent successfully');
    } catch (notificationError) {
      console.error('❌ Unified notification failed:', notificationError.message);
    }
    
    // Wait for processing
    console.log('⏳ Waiting for notification processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Count notifications after
    const notificationsAfter = await prisma.notification.count({
      where: {
        type: 'payment-confirmed',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      }
    });
    
    console.log(`📊 Payment-confirmed notifications after: ${notificationsAfter}`);
    
    // Calculate difference
    const notificationDifference = notificationsAfter - notificationsBefore;
    console.log(`📈 New notifications created: ${notificationDifference}`);
    
    // Test result
    if (notificationDifference === 2) {
      console.log('✅ SUCCESS: Correct notifications created (1 admin collective + 1 user)');
    } else if (notificationDifference > 2) {
      console.log(`❌ FAILURE: ${notificationDifference} notifications created (expected 2: 1 admin + 1 user)`);
    } else {
      console.log('⚠️ WARNING: Insufficient notifications created (expected 2)');
    }
    
    // Check recent notifications
    const recentNotifications = await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`\n📬 Recent notifications (${recentNotifications.length}):`);
    recentNotifications.forEach((n, i) => {
      console.log(`${i+1}. Type: ${n.type} | Title: ${n.title}`);
      if (n.data?.orderId) {
        console.log(`   Order ID: ${n.data.orderId}`);
      }
      console.log(`   Created: ${n.createdAt}`);
    });
    
    // Update payment session status
    await prisma.paymentSession.update({
      where: { orderId: testOrderId },
      data: { status: 'completed' }
    });
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.order.delete({ where: { id: testOrderId } });
    await prisma.paymentSession.delete({ where: { orderId: testOrderId } });
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testUnifiedNotifications();