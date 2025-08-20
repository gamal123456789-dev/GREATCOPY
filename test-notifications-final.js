/**
 * Final test for notification system using notificationService
 * Tests the complete notification flow for order creation
 */

const { PrismaClient } = require('@prisma/client');
const { sendNewOrderNotification, sendCompleteOrderNotifications } = require('./lib/notificationService');

const prisma = new PrismaClient();

async function testNotificationSystem() {
  console.log('🧪 Testing Final Notification System');
  console.log('==================================================');

  try {
    // Test data for order
    const testOrderData = {
      orderId: 'TEST-ORDER-' + Date.now(),
      customerName: 'Test Customer',
      game: 'Destiny 2',
      service: 'Trials of Osiris Flawless',
      price: 50.00,
      status: 'pending',
      paymentMethod: 'Cryptomus',
      createdAt: new Date()
    };

    console.log('1️⃣ Testing admin notification via notificationService:');
    const adminResult = await sendNewOrderNotification(testOrderData);
    console.log(`   Admin notification result: ${adminResult ? '✅ SUCCESS' : '❌ FAILED'}`);

    console.log('\n2️⃣ Testing user notification via notificationService:');
    const userResult = await sendCompleteOrderNotifications('test-user-123', testOrderData);
    console.log(`   User notification result: ${userResult ? '✅ SUCCESS' : '❌ FAILED'}`);

    console.log('\n✅ Final Notification Test completed successfully!');
    
    console.log('\n📊 Test Results:');
    console.log(`- Admin Notifications: ${adminResult ? '✅ Working' : '❌ Failed'}`);
    console.log(`- User Notifications: ${userResult ? '✅ Working' : '❌ Failed'}`);
    
    console.log('\n🎯 The notification system is now using notificationService!');
    console.log('   This provides better fallback handling and consistency.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNotificationSystem();