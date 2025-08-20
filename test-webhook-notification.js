const { sendDatabaseNotification } = require('./services/databaseNotificationService');
const fs = require('fs');

async function testWebhookNotification() {
  console.log('🔔 Testing webhook notification exactly as called from webhook.ts...');
  
  const orderId = `webhook_test_${Date.now()}`;
  
  // This is exactly the same data structure used in webhook.ts
  const notificationData = {
    orderId: orderId,
    customerName: 'test@example.com',
    game: 'Call of Duty: Modern Warfare',
    service: 'Complete Damascus camo unlock for all weapons including assault rifles, SMGs, LMGs, marksman rifles, sniper rifles, shotguns, and pistols',
    price: 149.99,
    status: 'pending',
    paymentMethod: 'Cryptomus (USDT)',
    timestamp: new Date().toISOString()
  };
  
  console.log('📋 Notification data:', JSON.stringify(notificationData, null, 2));
  
  try {
    console.log('📤 Calling sendDatabaseNotification with type "new-order"...');
    
    await sendDatabaseNotification('new-order', notificationData);
    
    console.log('✅ sendDatabaseNotification completed');
    
    // Wait a moment then check the log
    setTimeout(() => {
      try {
        const logContent = fs.readFileSync('logs/admin-notifications.log', 'utf8');
        const lines = logContent.trim().split('\n').filter(line => line.trim());
        
        console.log(`\n📋 Log file contains ${lines.length} entries`);
        
        // Look for our test entry
        const testEntry = lines.find(line => {
          try {
            const entry = JSON.parse(line);
            return entry.orderId === orderId;
          } catch (e) {
            return false;
          }
        });
        
        if (testEntry) {
          console.log('✅ Webhook test entry found in log:');
          console.log(testEntry);
        } else {
          console.log('❌ Webhook test entry not found in log');
          console.log('📋 Last 3 entries:');
          lines.slice(-3).forEach((line, index) => {
            console.log(`${index + 1}. ${line}`);
          });
        }
        
      } catch (e) {
        console.log('❌ Error reading log file:', e.message);
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error in webhook notification test:', error);
  }
}

testWebhookNotification().catch(console.error);