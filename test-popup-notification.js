/**
 * Test script for popup notification system
 * This script creates a test order and triggers the popup notification system
 */

const { PrismaClient } = require('@prisma/client');
const { sendDatabaseNotification } = require('./services/databaseNotificationService');

const prisma = new PrismaClient();

async function testPopupNotificationSystem() {
  console.log('🧪 Testing Popup Notification System...');
  console.log('================================================================================');
  
  try {
    // Find or create a test user
    let testUser = await prisma.user.findFirst({
      where: {
        email: 'testuser@gear-score.com'
      }
    });
    
    if (!testUser) {
      console.log('👤 Creating test user...');
      testUser = await prisma.user.create({
        data: {
          id: `test_user_${Date.now()}`,
          email: 'testuser@gear-score.com',
          name: 'Test User for Popup',
          role: 'USER'
        }
      });
      console.log('✅ Test user created:', testUser.email);
    } else {
      console.log('✅ Test user found:', testUser.email);
    }
    
    // Create a test order
    const testOrderId = `popup_test_${Date.now()}`;
    console.log('📦 Creating test order:', testOrderId);
    
    const testOrder = await prisma.order.create({
      data: {
        id: testOrderId,
        customerName: 'Popup Test Customer',
        game: 'Destiny 2',
        service: 'Nightfall Completion - Popup Test',
        price: 39.99,
        status: 'pending',
        date: new Date(),
        userId: testUser.id,
        paymentId: `popup_payment_${Date.now()}`
      }
    });
    
    console.log('✅ Test order created successfully');
    console.log('📋 Order details:', {
      id: testOrder.id,
      customerName: testOrder.customerName,
      game: testOrder.game,
      service: testOrder.service,
      price: testOrder.price,
      status: testOrder.status
    });
    
    // Wait a moment
    console.log('⏳ Waiting 2 seconds before sending notification...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send database notification (this should trigger the popup)
    console.log('🔔 Sending database notification with popup...');
    await sendDatabaseNotification('new_order', {
      orderId: testOrder.id,
      customerName: testOrder.customerName,
      game: testOrder.game,
      service: testOrder.service,
      price: testOrder.price,
      status: testOrder.status,
      paymentMethod: testOrder.paymentMethod || 'Cryptomus',
      timestamp: testOrder.date.toISOString()
    });
    
    console.log('✅ Database notification sent successfully!');
    console.log('🪟 Check the console output above for the popup URL');
    console.log('💡 Copy the popup URL and open it in a new browser window to see the popup');
    
    // Wait a moment before cleanup
    console.log('⏳ Waiting 3 seconds before cleanup...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Cleanup test data
    console.log('🧹 Cleaning up test data...');
    await prisma.order.delete({
      where: { id: testOrder.id }
    });
    
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    
    console.log('✅ Test data cleaned up successfully');
    console.log('================================================================================');
    console.log('🎉 Popup notification test completed!');
    console.log('📋 What to do next:');
    console.log('   1. Look for the popup URL in the console output above');
    console.log('   2. Copy the URL and open it in a new browser window');
    console.log('   3. You should see a beautiful popup notification');
    console.log('   4. The popup should auto-close after 30 seconds');
    console.log('   5. You can also manually close it or mark as read');
    
  } catch (error) {
    console.error('❌ Error during popup notification test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPopupNotificationSystem().catch(console.error);