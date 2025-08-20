const axios = require('axios');
const crypto = require('crypto');
const { prisma } = require('./services/databaseNotificationService');

async function testWebhookClean() {
  console.log('🧪 Testing webhook with completely clean state...');
  
  // Get a real user from database
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('❌ No users found in database');
    return;
  }
  
  console.log(`✅ Using user: ${user.email} (ID: ${user.id})`);
  
  const orderId = `clean_webhook_${Date.now()}`;
  
  // Make sure no order exists
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId }
  });
  
  if (existingOrder) {
    console.log('⚠️ Order already exists, deleting it first...');
    await prisma.order.delete({
      where: { id: orderId }
    });
    console.log('✅ Existing order deleted');
  }
  
  // Make sure no payment session exists
  const existingSession = await prisma.paymentSession.findUnique({
    where: { orderId: orderId }
  });
  
  if (existingSession) {
    console.log('⚠️ Payment session already exists, deleting it first...');
    await prisma.paymentSession.delete({
      where: { orderId: orderId }
    });
    console.log('✅ Existing payment session deleted');
  }
  
  // Create payment session
  console.log('💳 Creating payment session...');
  const paymentSession = await prisma.paymentSession.create({
    data: {
      orderId: orderId,
      userId: user.id,
      customerEmail: user.email,
      game: 'Clean Webhook Test',
      service: 'Clean Test Service',
      serviceDetails: 'Testing webhook notification with clean state',
      amount: 45.99,
      currency: 'USD',
      paymentProvider: 'Cryptomus',
      paymentId: `cryptomus_${Date.now()}`,
      status: 'pending'
    }
  });
  
  console.log(`✅ Payment session created: ${paymentSession.orderId}`);
  
  // Clear any existing webhook debug log
  const fs = require('fs');
  try {
    fs.writeFileSync('logs/webhook-debug.log', '');
    console.log('✅ Webhook debug log cleared');
  } catch (e) {
    console.log('ℹ️ Webhook debug log will be created');
  }
  
  // Prepare webhook payload
  const webhookPayload = {
    order_id: orderId,
    status: 'paid',
    amount: '45.99',
    currency: 'USD',
    uuid: `cryptomus_${Date.now()}`,
    additional_data: 'clean_test'
  };
  
  // Create signature
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const dataString = Buffer.from(JSON.stringify(webhookPayload)).toString('base64');
  const signature = crypto.createHash('md5').update(dataString + apiKey).digest('hex');
  
  console.log('📡 Sending webhook request...');
  console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
  
  try {
    const response = await axios.post('http://localhost:5201/api/pay/cryptomus/webhook', webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      },
      timeout: 10000
    });
    
    console.log('✅ Webhook response:', response.status, response.data);
    
    // Wait for processing
    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
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
        status: order.status
      });
    } else {
      console.log('❌ Order was not created');
    }
    
    // Check webhook debug log
    try {
      const debugLog = fs.readFileSync('logs/webhook-debug.log', 'utf8');
      if (debugLog.trim()) {
        console.log('📋 Webhook debug log:');
        console.log(debugLog);
      } else {
        console.log('⚠️ Webhook debug log is empty');
      }
    } catch (e) {
      console.log('⚠️ Webhook debug log not found');
    }
    
    // Check admin notifications log
    try {
      const { execSync } = require('child_process');
      const lastNotification = execSync('tail -1 logs/admin-notifications.log', { encoding: 'utf8' });
      console.log('📋 Last admin notification:');
      console.log(lastNotification);
    } catch (e) {
      console.log('⚠️ Could not read admin notifications log');
    }
    
  } catch (error) {
    console.error('❌ Webhook request failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testWebhookClean().catch(console.error);