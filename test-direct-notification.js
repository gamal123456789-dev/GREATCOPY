const { sendDatabaseNotification } = require('./services/databaseNotificationService');

async function testDirectNotification() {
  console.log('🔔 Testing direct notification sending...');
  
  const testData = {
    orderId: `direct_test_${Date.now()}`,
    customerName: 'Direct Test Customer',
    game: 'Test Game',
    service: 'Direct Notification Test',
    price: 99.99,
    status: 'pending',
    paymentMethod: 'Direct Test',
    timestamp: new Date().toISOString()
  };
  
  console.log('📋 Test data:', JSON.stringify(testData, null, 2));
  
  try {
    await sendDatabaseNotification('new-order', testData);
    console.log('✅ Direct notification sent successfully');
    
    // Wait a moment then check the log
    setTimeout(() => {
      const fs = require('fs');
      try {
        const logContent = fs.readFileSync('logs/admin-notifications.log', 'utf8');
        const lines = logContent.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        
        if (lastLine.includes(testData.orderId)) {
          console.log('✅ Notification found in log file');
          console.log('📋 Last log entry:', lastLine);
        } else {
          console.log('❌ Notification not found in log file');
          console.log('📋 Last log entry:', lastLine);
        }
      } catch (e) {
        console.log('❌ Error reading log file:', e.message);
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error sending direct notification:', error);
  }
}

testDirectNotification().catch(console.error);