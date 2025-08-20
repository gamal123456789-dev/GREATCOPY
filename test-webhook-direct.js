const axios = require('axios');
const crypto = require('crypto');
const { prisma } = require('./services/databaseNotificationService');

async function testWebhookDirect() {
  console.log('🧪 Testing webhook without pre-existing payment session...');
  
  // Get a real user from database
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('❌ No users found in database');
    return;
  }
  
  console.log(`✅ Using user: ${user.email} (ID: ${user.id})`);
  
  const orderId = `direct_webhook_${Date.now()}`;
  
  // Create payment session first (this is what normally happens before webhook)
  console.log('💳 Creating payment session...');
  const paymentSession = await prisma.paymentSession.create({
    data: {
      orderId: orderId,
      userId: user.id,
      customerEmail: user.email,
      game: 'Direct Webhook Test',
      service: 'Direct Test Service',
      serviceDetails: 'Testing webhook notification without pre-existing order',
      amount: 35.99,
      currency: 'USD',
      paymentProvider: 'Cryptomus',
      paymentId: `cryptomus_${Date.now()}`,
      status: 'pending'
    }
  });
  
  console.log(`✅ Payment session created: ${paymentSession.orderId}`);
  
  // Make sure no order exists yet
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
  
  // Prepare webhook payload
  const webhookPayload = {
    order_id: orderId,
    status: 'paid',
    amount: '35.99',
    currency: 'USD',
    uuid: `cryptomus_${Date.now()}`,
    additional_data: 'direct_test'
  };
  
  // Create signature
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const dataString = Buffer.from(JSON.stringify(webhookPayload)).toString('base64');
  const signature = crypto.createHash('md5').update(dataString + apiKey).digest('hex');
  
  console.log('📡 Sending webhook request (should create NEW order)...');
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
    
    // Wait a moment for processing
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

testWebhookDirect().catch(console.error);