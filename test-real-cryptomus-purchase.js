const axios = require('axios');
const crypto = require('crypto');
const { prisma, setupDatabaseMonitoring } = require('./services/databaseNotificationService');

async function testRealCryptomusPurchase() {
  console.log('🛒 Testing real Cryptomus purchase flow...');
  setupDatabaseMonitoring();
  
  // Find a real user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('❌ No users found in database');
    return;
  }
  
  console.log(`✅ Using user: ${user.email} (ID: ${user.id})`);
  
  const orderId = `real_purchase_${Date.now()}`;
  
  // Create payment session (simulating what happens when user clicks "Pay with Crypto")
  console.log('💳 Creating payment session...');
  const paymentSession = await prisma.paymentSession.create({
    data: {
      orderId: orderId,
      userId: user.id,
      customerEmail: user.email,
      game: 'Call of Duty: Modern Warfare',
      service: 'Damascus Camo Unlock',
      serviceDetails: 'Complete Damascus camo unlock for all weapons including assault rifles, SMGs, LMGs, marksman rifles, sniper rifles, shotguns, and pistols',
      amount: 149.99,
      currency: 'USD',
      paymentProvider: 'Cryptomus',
      paymentId: `cryptomus_${Date.now()}`,
      status: 'pending'
    }
  });
  
  console.log(`✅ Payment session created: ${paymentSession.orderId}`);
  console.log(`💰 Amount: $${paymentSession.amount}`);
  console.log(`🎮 Game: ${paymentSession.game}`);
  console.log(`⚡ Service: ${paymentSession.service}`);
  
  // Clear logs for clean testing
  const fs = require('fs');
  try {
    fs.writeFileSync('logs/webhook-debug.log', '');
    console.log('✅ Webhook debug log cleared');
  } catch (e) {
    console.log('ℹ️ Webhook debug log will be created');
  }
  
  // Simulate successful payment webhook from Cryptomus
  const webhookPayload = {
    order_id: orderId,
    status: 'paid',
    amount: '149.99',
    currency: 'USD',
    uuid: `cryptomus_payment_${Date.now()}`,
    additional_data: JSON.stringify({
      customer_email: user.email,
      payment_method: 'USDT',
      network: 'TRC20',
      real_purchase_test: true
    })
  };
  
  // Create signature for webhook authentication
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const dataString = Buffer.from(JSON.stringify(webhookPayload)).toString('base64');
  const signature = crypto.createHash('md5').update(dataString + apiKey).digest('hex');
  
  console.log('\n📡 Simulating Cryptomus payment confirmation webhook...');
  console.log('💳 Payment Method: USDT (TRC20)');
  console.log('💰 Amount: $149.99');
  console.log('🔐 Signature:', signature.substring(0, 8) + '...');
  
  try {
    const response = await axios.post('http://localhost:5201/api/pay/cryptomus/webhook', webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      },
      timeout: 15000
    });
    
    console.log('✅ Webhook response:', response.status, response.data);
    
    // Wait for processing
    console.log('⏳ Waiting for order creation and notifications...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if order was created
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (order) {
      console.log('\n✅ ORDER CREATED SUCCESSFULLY:');
      console.log('=====================================');
      console.log(`🆔 Order ID: ${order.id}`);
      console.log(`👤 Customer: ${order.customerName}`);
      console.log(`🎮 Game: ${order.game}`);
      console.log(`⚡ Service: ${order.service}`);
      console.log(`💰 Price: $${order.price}`);
      console.log(`📊 Status: ${order.status}`);
      console.log(`💳 Payment ID: ${order.paymentId}`);
      console.log(`📅 Date: ${order.date.toISOString()}`);
      console.log('=====================================');
    } else {
      console.log('❌ Order was not created');
    }
    
    // Check webhook debug log
    console.log('\n📋 Checking webhook processing log...');
    try {
      const debugLog = fs.readFileSync('logs/webhook-debug.log', 'utf8');
      if (debugLog.trim()) {
        console.log('Webhook Processing Log:');
        console.log('========================');
        debugLog.trim().split('\n').forEach(line => {
          console.log(`📝 ${line}`);
        });
        console.log('========================');
      } else {
        console.log('❌ No webhook processing logs found');
      }
    } catch (e) {
      console.log('❌ Could not read webhook debug log');
    }
    
    // Check admin notifications
    console.log('\n📋 Checking admin notifications...');
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
          console.log(`${index + 1}. 🔔 Type: ${logEntry.type}`);
          console.log(`   ⏰ Time: ${logEntry.timestamp}`);
          console.log(`   👥 Admins: ${logEntry.adminCount}`);
          console.log(`   📧 Emails: ${logEntry.adminEmails.join(', ')}`);
        });
      } else {
        console.log(`❌ No notifications found for order ${orderId}`);
      }
    } catch (e) {
      console.log('❌ Could not read admin notifications log:', e.message);
    }
    
    // Test notification popup URL
    if (order) {
      console.log('\n🪟 Testing notification popup...');
      const notificationData = {
        id: `new-order_${order.id}_${Date.now()}`,
        type: 'new-order',
        title: 'طلب جديد - New Order',
        message: `طلب جديد من ${order.customerName}`,
        data: {
          orderId: order.id,
          customerName: order.customerName,
          game: order.game,
          service: order.service,
          price: order.price,
          status: order.status,
          paymentMethod: 'Cryptomus (USDT)',
          timestamp: order.date.toISOString()
        },
        timestamp: new Date().toISOString(),
        read: false
      };
      
      const popupData = encodeURIComponent(JSON.stringify(notificationData));
      const popupUrl = `https://gear-score.com/admin/notification-popup?data=${popupData}`;
      
      console.log('🔗 Popup URL:', popupUrl);
      console.log('💡 Open this URL to test the notification popup');
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

testRealCryptomusPurchase().catch(console.error).finally(() => {
  console.log('\n🏁 Real purchase test completed');
  process.exit(0);
});