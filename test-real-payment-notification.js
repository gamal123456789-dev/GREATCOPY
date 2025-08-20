const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRealPaymentNotification() {
  console.log('🧪 Testing real payment notification flow...');
  
  try {
    // Create a test payment session first
    const testOrderId = `test_payment_${Date.now()}`;
    const testUserId = 'test_user_1755342678486';
    
    console.log('1️⃣ Creating test payment session...');
    const paymentSession = await prisma.paymentSession.create({
      data: {
        orderId: testOrderId,
        userId: testUserId,
        amount: 15.00,
        currency: 'USD',
        game: 'Black Desert Online',
        service: 'Power Leveling',
        customerEmail: 'test@gear-score.com',
        paymentId: `cryptomus_${Date.now()}`,
        paymentProvider: 'cryptomus',
        status: 'pending'
      }
    });
    
    console.log('✅ Payment session created:', paymentSession.orderId);
    
    // Create an existing order to simulate the real scenario
    console.log('2️⃣ Creating existing order...');
    const existingOrder = await prisma.order.create({
      data: {
        id: testOrderId,
        userId: testUserId,
        customerName: 'test@gear-score.com',
        date: new Date(),
        game: 'Black Desert Online',
        service: 'Power Leveling',
        price: 15.00,
        status: 'created',
        paymentId: null,
        notes: 'Test order for notification testing'
      }
    });
    
    console.log('✅ Existing order created:', existingOrder.id);
    
    // Check notifications before processing
    const notificationsBefore = await prisma.notification.count({
      where: {
        type: 'payment-confirmed',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      }
    });
    
    console.log(`📊 Payment-confirmed notifications before: ${notificationsBefore}`);
    
    // Simulate the webhook processing logic directly
    console.log('3️⃣ Simulating webhook processing logic...');
    
    // Import the notification service
    const { sendDatabaseNotification } = require('./services/databaseNotificationService');
    const { emitToUser } = require('./lib/socket-cjs');
    
    // Simulate the webhook data
    const webhookData = {
      type: 'payment',
      uuid: `test_uuid_${Date.now()}`,
      order_id: testOrderId,
      amount: '15.00000000',
      payment_amount: '15.00000000',
      payment_amount_usd: '15.00',
      merchant_amount: '14.70000000',
      commission: '0.30000000',
      is_final: true,
      status: 'paid',
      from: null,
      wallet_address_uuid: null,
      network: 'bsc',
      currency: 'USD',
      payer_currency: 'USDT',
      payer_amount: '15.00000000',
      payer_amount_exchange_rate: '1.00000000',
      additional_data: JSON.stringify({
        user_id: testUserId,
        game: 'Black Desert Online',
        service: 'Power Leveling',
        customer_email: 'test@gear-score.com'
      }),
      transfer_id: `transfer_${Date.now()}`,
      sign: 'test_signature'
    };
    
    // Simulate the webhook processing logic for existing orders
    console.log('🔄 Processing payment for existing order...');
    
    // Update payment session status
    await prisma.paymentSession.update({
      where: { orderId: testOrderId },
      data: { status: 'completed' }
    });
    
    // Update order status and add payment confirmation note
    const updatedOrder = await prisma.order.update({
      where: { id: testOrderId },
      data: {
        status: 'pending',
        paymentId: webhookData.uuid,
        notes: existingOrder.notes + '\n\n✅ تم تأكيد الدفع بنجاح'
      }
    });
    
    console.log('✅ Order updated with payment confirmation');
    
    // Send user notification
    console.log('📱 Sending user notification...');
    try {
      emitToUser(testUserId, 'paymentConfirmed', {
        orderId: testOrderId,
        game: updatedOrder.game,
        service: updatedOrder.service,
        amount: updatedOrder.price,
        status: 'pending',
        message: 'تم تأكيد الدفع بنجاح! طلبك قيد المعالجة وسيتم التواصل معك قريباً.'
      });
      console.log('✅ User notification sent');
    } catch (userNotifError) {
      console.log('⚠️ User notification failed (expected in test):', userNotifError.message);
    }
    
    // Skip admin notification - will be handled by main webhook
    console.log('⏭️ Skipping admin notification (handled by webhook)');
    console.log(`[${new Date().toISOString()}] Test notification skipped for order: ${updatedOrder.id}`);
    console.log('✅ Notification handling deferred to main Cryptomus webhook');
    
    // Wait for processing
    console.log('⏳ Waiting for notification processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check notifications after processing
    const notificationsAfter = await prisma.notification.count({
      where: {
        type: 'payment-confirmed',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      }
    });
    
    console.log(`📊 Payment-confirmed notifications after: ${notificationsAfter}`);
    
    // Check if order was updated
    const finalOrder = await prisma.order.findUnique({
      where: { id: testOrderId }
    });
    
    console.log('📋 Final order status:', finalOrder?.status);
    console.log('💳 Final payment ID:', finalOrder?.paymentId);
    
    // Check recent notifications
    const recentNotifications = await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`\n📬 Recent notifications (${recentNotifications.length}):`);
    recentNotifications.forEach((n, i) => {
      console.log(`${i+1}. Type: ${n.type} | Title: ${n.title}`);
      if (n.data?.orderId) {
        console.log(`   Order ID: ${n.data.orderId}`);
      }
      console.log(`   Created: ${n.createdAt}`);
    });
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.order.delete({ where: { id: testOrderId } });
    await prisma.paymentSession.delete({ where: { orderId: testOrderId } });
    
    // Delete test notifications
    await prisma.notification.deleteMany({
      where: {
        data: {
          path: ['orderId'],
          equals: testOrderId
        }
      }
    });
    
    console.log('✅ Cleanup completed');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`- Notifications before: ${notificationsBefore}`);
    console.log(`- Notifications after: ${notificationsAfter}`);
    console.log(`- New notifications created: ${notificationsAfter - notificationsBefore}`);
    console.log(`- Order status updated: ${finalOrder?.status === 'pending' ? 'Yes' : 'No'}`);
    console.log(`- Payment ID set: ${finalOrder?.paymentId ? 'Yes' : 'No'}`);
    
    if (notificationsAfter > notificationsBefore) {
      console.log('\n✅ SUCCESS: Payment confirmation notifications are working!');
    } else {
      console.log('\n❌ ISSUE: No payment confirmation notifications were created!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testRealPaymentNotification();