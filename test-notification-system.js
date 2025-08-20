const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

// Use the same prisma instance as webhook
const { prisma, setupDatabaseMonitoring, sendDatabaseNotification } = require('./services/databaseNotificationService');

// Setup database monitoring (same as webhook)
setupDatabaseMonitoring();

async function testNotificationSystem() {
  console.log('🔔 Testing notification system with proper prisma instance...');
  
  try {
    // Clear logs first
    fs.writeFileSync('logs/webhook-debug.log', '');
    console.log('📝 Cleared webhook-debug.log');
    
    // Create a payment session first using the monitored prisma instance
    const orderId = `notification_test_${Date.now()}`;
    const paymentSession = await prisma.paymentSession.create({
      data: {
        orderId: orderId,
        userId: '7d14fc11-a0bf-449f-97af-6c3e9faa8841',
        customerEmail: 'test@gear-score.com',
        game: 'World of Warcraft',
        service: 'Mythic+ Boost',
        serviceDetails: 'Notification system test',
        amount: 35.99,
        currency: 'USD',
        paymentProvider: 'Cryptomus',
        status: 'pending'
      }
    });
    
    console.log('💳 Created payment session:', orderId);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send webhook request
    const webhookData = {
      order_id: orderId,
      status: 'paid',
      amount: '35.99',
      currency: 'USD',
      uuid: `uuid_${Date.now()}`,
      additional_data: JSON.stringify({
        test: true,
        source: 'notification_test'
      })
    };
    
    // Create signature
    const apiKey = process.env.CRYPTOMUS_API_KEY || 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
    const signature = crypto
      .createHash('md5')
      .update(Buffer.from(JSON.stringify(webhookData)).toString('base64') + apiKey)
      .digest('hex');
    
    console.log('📡 Sending webhook request...');
    
    const response = await axios.post('http://localhost:5201/api/pay/cryptomus/webhook', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      }
    });
    
    console.log('✅ Webhook response:', response.status, response.data);
    
    // Wait for processing and notification
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if order was created
    const createdOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (createdOrder) {
      console.log('✅ Order created successfully:', {
        id: createdOrder.id,
        customerName: createdOrder.customerName,
        game: createdOrder.game,
        service: createdOrder.service,
        price: createdOrder.price,
        status: createdOrder.status
      });
    } else {
      console.log('❌ Order not found in database');
    }
    
    // Check admin notifications log for our new order
    console.log('\n📋 Checking Admin Notifications Log for new order...');
    try {
      const adminLog = fs.readFileSync('logs/admin-notifications.log', 'utf8');
      const lines = adminLog.trim().split('\n').filter(line => line.trim());
      
      // Look for our specific order
      const ourOrderNotification = lines.find(line => line.includes(orderId));
      
      if (ourOrderNotification) {
        console.log('✅ Found notification for our order:');
        console.log(ourOrderNotification);
      } else {
        console.log('❌ No notification found for our order');
        console.log('Last few notifications:');
        const lastFewLines = lines.slice(-3);
        lastFewLines.forEach(line => console.log(line));
      }
    } catch (err) {
      console.log('Error reading admin-notifications.log:', err.message);
    }
    
    // Test direct notification sending
    console.log('\n🧪 Testing direct notification sending...');
    await sendDatabaseNotification('new_order', {
      orderId: `direct_notification_test_${Date.now()}`,
      customerName: 'Direct Test Customer',
      game: 'Test Game Direct',
      service: 'Direct Notification Test',
      price: 99.99,
      status: 'pending',
      paymentMethod: 'Direct Test',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Direct notification sent');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationSystem();