const axios = require('axios');
const crypto = require('crypto');
const { prisma, setupDatabaseMonitoring } = require('./services/databaseNotificationService');

async function testCryptomusNotification() {
  console.log('🔧 Setting up database monitoring...');
  setupDatabaseMonitoring();
  
  console.log('🔍 Finding a real user...');
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('❌ No users found in database');
    return;
  }
  
  console.log(`✅ Using user: ${user.email} (ID: ${user.id})`);
  
  const orderId = `cryptomus_test_${Date.now()}`;
  
  // Create payment session first
  console.log('💳 Creating payment session...');
  const paymentSession = await prisma.paymentSession.create({
    data: {
      orderId: orderId,
      userId: user.id,
      customerEmail: user.email,
      game: 'Fortnite',
      service: 'Battle Pass Purchase',
      serviceDetails: 'Season 5 Battle Pass with exclusive skins and rewards',
      amount: 29.99,
      currency: 'USD',
      paymentProvider: 'Cryptomus',
      paymentId: `cryptomus_${Date.now()}`,
      status: 'pending'
    }
  });
  
  console.log(`✅ Payment session created: ${paymentSession.orderId}`);
  
  // Clear webhook debug log
  const fs = require('fs');
  try {
    fs.writeFileSync('logs/webhook-debug.log', '');
    console.log('✅ Webhook debug log cleared');
  } catch (e) {
    console.log('ℹ️ Webhook debug log will be created');
  }
  
  // Prepare webhook payload for successful payment
  const webhookPayload = {
    order_id: orderId,
    status: 'paid',
    amount: '29.99',
    currency: 'USD',
    uuid: `cryptomus_payment_${Date.now()}`,
    additional_data: JSON.stringify({
      test: true,
      notification_test: 'cryptomus_webhook'
    })
  };
  
  // Create signature for webhook authentication
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const dataString = Buffer.from(JSON.stringify(webhookPayload)).toString('base64');
  const signature = crypto.createHash('md5').update(dataString + apiKey).digest('hex');
  
  console.log('📡 Sending Cryptomus webhook request...');
  console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
  console.log('Signature:', signature);
  
  try {
    const response = await axios.post('http://localhost:5201/api/pay/cryptomus/webhook', webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      },
      timeout: 15000
    });
    
    console.log('✅ Webhook response:', response.status, response.data);
    
    // Wait for processing and notifications
    console.log('⏳ Waiting for webhook processing and notifications...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if order was created
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (order) {
      console.log('✅ Order created successfully:', {
        id: order.id,
        customerName: order.customerName,
        game: order.game,
        service: order.service,
        price: order.price,
        status: order.status,
        paymentId: order.paymentId
      });
    } else {
      console.log('❌ Order was not created');
    }
    
    // Check webhook debug log
    console.log('\n📋 Checking webhook debug log...');
    try {
      const debugLog = fs.readFileSync('logs/webhook-debug.log', 'utf8');
      if (debugLog.trim()) {
        console.log('Webhook Debug Log:');
        console.log(debugLog);
      } else {
        console.log('❌ No entries in webhook debug log');
      }
    } catch (e) {
      console.log('❌ Could not read webhook debug log');
    }
    
    // Check admin notifications log
    console.log('\n📋 Checking admin notifications log...');
    try {
      const adminLog = fs.readFileSync('logs/admin-notifications.log', 'utf8');
      const lines = adminLog.trim().split('\n').filter(line => line.trim());
      
      // Look for our specific order
      const orderNotifications = lines.filter(line => {
        try {
          const logEntry = JSON.parse(line);
          return logEntry.orderId === orderId;
        } catch (e) {
          return false;
        }
      });
      
      if (orderNotifications.length > 0) {
        console.log(`✅ Found ${orderNotifications.length} notification(s) for order ${orderId}:`);
        orderNotifications.forEach((notification, index) => {
          const logEntry = JSON.parse(notification);
          console.log(`${index + 1}. Type: ${logEntry.type}, Time: ${logEntry.timestamp}`);
        });
      } else {
        console.log(`❌ No notifications found for order ${orderId}`);
        console.log(`Total log entries: ${lines.length}`);
        if (lines.length > 0) {
          console.log('Recent log entries:');
          lines.slice(-3).forEach(line => {
            try {
              const logEntry = JSON.parse(line);
              console.log(`- ${logEntry.type} at ${logEntry.timestamp}`);
            } catch (e) {
              console.log(`- ${line}`);
            }
          });
        }
      }
    } catch (e) {
      console.log('❌ Could not read admin notifications log:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Webhook request failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      await prisma.order.deleteMany({
        where: { id: orderId }
      });
      await prisma.paymentSession.deleteMany({
        where: { orderId: orderId }
      });
      console.log('✅ Test data cleaned up');
    } catch (e) {
      console.log('⚠️ Error cleaning up test data:', e.message);
    }
  }
}

testCryptomusNotification().catch(console.error).finally(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
});