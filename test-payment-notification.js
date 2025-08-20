/**
 * Test Payment Notification - Real-time delivery
 * Tests payment confirmation notification with correct data structure
 */

require('dotenv').config();
const { emitToUser } = require('./lib/socket-cjs');
const prisma = require('./lib/prisma.js');

async function testPaymentNotification() {
  console.log('🔍 Testing Payment Notification Real-time Delivery...');
  
  try {
    const userId = '7d14fc11-a0bf-449f-97af-6c3e9faa8841';
    
    // Create a test notification in database first
    const notification = await prisma.notification.create({
      data: {
        type: 'payment-confirmed',
        title: 'تأكيد دفع',
        message: 'تم تأكيد دفعتك بنجاح - اختبار فوري',
        data: {
          orderId: 'test_order_' + Date.now(),
          amount: 100,
          currency: 'USD',
          testMode: true
        },
        userId: userId,
        read: false
      }
    });
    
    console.log('✅ Notification created in database:', notification.id);
    
    // Test real-time emission
    console.log('📡 Testing real-time Socket.IO emission...');
    
    const emissionResult = emitToUser(userId, 'payment-confirmed', {
      id: notification.id,
      type: 'payment-confirmed',
      title: 'تأكيد دفع',
      message: 'تم تأكيد دفعتك بنجاح - اختبار فوري',
      data: notification.data,
      timestamp: notification.createdAt.toISOString(),
      read: false
    });
    
    if (emissionResult) {
      console.log('✅ Real-time notification sent successfully!');
      console.log('🔔 User should receive notification instantly on gear-score.com');
    } else {
      console.log('❌ Real-time emission failed - user not connected');
      console.log('📱 Notification stored in database for later retrieval');
    }
    
    // Test admin notification as well
    console.log('\n👑 Testing admin notification...');
    const { emitToAdmin } = require('./lib/socket-cjs');
    
    const adminEmissionResult = emitToAdmin('new-notification', {
      type: 'payment-confirmed',
      title: 'دفعة جديدة مؤكدة',
      message: `تم تأكيد دفعة للمستخدم ${userId}`,
      userId: userId,
      orderId: notification.data.orderId,
      timestamp: new Date().toISOString()
    });
    
    if (adminEmissionResult) {
      console.log('✅ Admin notification sent successfully!');
    } else {
      console.log('❌ Admin notification failed - no admin connected');
    }
    
    console.log('\n📊 Test Summary:');
    console.log('✅ Database notification: SUCCESS');
    console.log(`✅ Real-time user notification: ${emissionResult ? 'SUCCESS' : 'FAILED (user not connected)'}`);
    console.log(`✅ Real-time admin notification: ${adminEmissionResult ? 'SUCCESS' : 'FAILED (admin not connected)'}`);
    console.log('\n💡 Next Steps:');
    console.log('1. User should log into gear-score.com to see notifications');
    console.log('2. If user is already logged in, notification should appear instantly');
    console.log('3. Check notification bell icon on the website');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Run the test
testPaymentNotification();