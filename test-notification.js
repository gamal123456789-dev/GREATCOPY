const { sendDatabaseNotification } = require('./services/databaseNotificationService');

async function testNotification() {
  try {
    console.log('🧪 Testing notification system...');
    
    // Test notification data
    const testData = {
      userId: 'test_user_' + Date.now(),
      orderId: 'test_order_' + Date.now(),
      customerName: 'Test Customer',
      game: 'Test Game',
      service: 'Test Service',
      price: 1.00,
      status: 'pending',
      paymentMethod: 'Test Payment',
      timestamp: new Date().toISOString(),
      customerEmail: 'test@example.com'
    };
    
    console.log('📤 Sending test notification with data:', testData);
    
    await sendDatabaseNotification('payment-confirmed', testData);
    
    console.log('✅ Test notification sent successfully!');
    
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
}

testNotification();