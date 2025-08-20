const axios = require('axios');
const crypto = require('crypto');
const { prisma, setupDatabaseMonitoring } = require('./services/databaseNotificationService');

async function testCryptomusWebhook() {
  console.log('🔧 Setting up database monitoring...');
  setupDatabaseMonitoring();
  
  console.log('🔍 Finding a real user...');
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('❌ No users found in database');
    return;
  }
  
  console.log(`✅ Using user: ${user.email} (ID: ${user.id})`);
  
  const orderId = `test_webhook_${Date.now()}`;
  
  // Create payment session
  console.log('💳 Creating payment session...');
  const paymentSession = await prisma.paymentSession.create({
    data: {
      orderId: orderId,
      userId: user.id,
      customerEmail: user.email,
      game: 'Test Game',
      service: 'Test Service',
      serviceDetails: 'Testing webhook notification system with detailed logging',
      amount: 25.99,
      currency: 'USD',
      paymentProvider: 'Cryptomus',
      paymentId: `cryptomus_${Date.now()}`,
      status: 'pending'
    }
  });
  
  console.log(`✅ Payment session created: ${paymentSession.orderId}`);
  
  // Prepare webhook payload
  const webhookPayload = {
    order_id: orderId,
    status: 'paid',
    amount: '25.99',
    currency: 'USD',
    uuid: `cryptomus_${Date.now()}`,
    additional_data: 'test_webhook'
  };
  
  // Create signature
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const dataString = Buffer.from(JSON.stringify(webhookPayload)).toString('base64');
  const signature = crypto.createHash('md5').update(dataString + apiKey).digest('hex');
  
  console.log('📡 Sending webhook request with detailed logging...');
  console.log('Payload:', JSON.stringify(webhookPayload, null, 2));
  console.log('Signature:', signature);
  
  try {
    const response = await axios.post('http://localhost:5201/api/pay/cryptomus/webhook', webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      },
      timeout: 10000
    });
    
    console.log('✅ Webhook response:', response.status, response.data);
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    
  } catch (error) {
    console.error('❌ Webhook request failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCryptomusWebhook().catch(console.error);