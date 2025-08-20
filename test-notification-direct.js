const { sendDatabaseNotification } = require('./services/databaseNotificationService');

async function testNotificationDirect() {
  console.log('🔔 Testing sendDatabaseNotification directly...');
  
  try {
    await sendDatabaseNotification('new_order', {
      orderId: `direct_test_${Date.now()}`,
      customerName: 'gamalkhaled981@gmail.com',
      game: 'Direct Test Game',
      service: 'Direct Test Service',
      price: 15.99,
      status: 'pending',
      paymentMethod: 'Direct Test',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Direct notification sent successfully');
    
  } catch (error) {
    console.error('❌ Error sending direct notification:', error.message);
  }
}

testNotificationDirect();