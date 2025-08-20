const axios = require('axios');
const crypto = require('crypto');
const { prisma } = require('./services/databaseNotificationService');

async function testRealCryptomusWebhook() {
  console.log('🧪 Testing Real Cryptomus Webhook with Production Data...');
  console.log('=' .repeat(60));
  
  // Use the exact webhook data from production logs
  const realWebhookData = {
    "type": "payment",
    "uuid": "edc5dfca-f452-4920-8331-2aba316d9422",
    "order_id": "cm_order_1755498279904_s66vmiv4y",
    "amount": "0.65000000",
    "payment_amount": "0.64000000",
    "payment_amount_usd": "0.64",
    "merchant_amount": "0.62720000",
    "commission": "0.01280000",
    "is_final": true,
    "status": "paid",
    "from": null,
    "wallet_address_uuid": null,
    "network": "bsc",
    "currency": "USD",
    "payer_currency": "USDT",
    "payer_amount": "0.64000000",
    "payer_amount_exchange_rate": "1.00076057",
    "additional_data": "{\"user_id\":\"7d14fc11-a0bf-449f-97af-6c3e9faa8841\",\"game\":\"Black Desert Online\",\"service\":\"Power Leveling\",\"customer_email\":\"gamalkhaled981@gmail.com\"}",
    "transfer_id": "fde9046e-26a0-419b-b00d-04a05a2fde29"
  };
  
  console.log('📋 Real webhook data:');
  console.log(JSON.stringify(realWebhookData, null, 2));
  
  // Check if payment session exists for this order
  console.log('\n🔍 Checking if payment session exists...');
  const paymentSession = await prisma.paymentSession.findUnique({
    where: { orderId: realWebhookData.order_id }
  });
  
  if (paymentSession) {
    console.log('✅ Payment session found:', {
      orderId: paymentSession.orderId,
      userId: paymentSession.userId,
      customerEmail: paymentSession.customerEmail,
      game: paymentSession.game,
      service: paymentSession.service,
      amount: paymentSession.amount,
      status: paymentSession.status
    });
  } else {
    console.log('❌ Payment session NOT found for order:', realWebhookData.order_id);
    
    // Create payment session based on additional_data
    console.log('🔧 Creating payment session from webhook data...');
    const additionalData = JSON.parse(realWebhookData.additional_data);
    
    const newPaymentSession = await prisma.paymentSession.create({
      data: {
        orderId: realWebhookData.order_id,
        userId: additionalData.user_id,
        customerEmail: additionalData.customer_email,
        game: additionalData.game,
        service: additionalData.service,
        serviceDetails: additionalData.service,
        amount: parseFloat(realWebhookData.amount),
        currency: realWebhookData.currency,
        paymentProvider: 'Cryptomus',
        paymentId: realWebhookData.uuid,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Payment session created:', newPaymentSession.orderId);
  }
  
  // Check if order already exists
  console.log('\n🔍 Checking if order exists...');
  const existingOrder = await prisma.order.findUnique({
    where: { id: realWebhookData.order_id }
  });
  
  if (existingOrder) {
    console.log('✅ Order already exists:', {
      id: existingOrder.id,
      customerName: existingOrder.customerName,
      game: existingOrder.game,
      service: existingOrder.service,
      status: existingOrder.status,
      paymentId: existingOrder.paymentId
    });
  } else {
    console.log('❌ Order does NOT exist for:', realWebhookData.order_id);
  }
  
  // Create signature for webhook
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const dataString = Buffer.from(JSON.stringify(realWebhookData)).toString('base64');
  const signature = crypto.createHash('md5').update(dataString + apiKey).digest('hex');
  
  console.log('\n📡 Sending webhook to local server...');
  console.log('Signature:', signature);
  
  try {
    const response = await axios.post('http://localhost:5201/api/pay/cryptomus/webhook', realWebhookData, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      },
      timeout: 15000
    });
    
    console.log('✅ Webhook response:', response.status, response.data);
    
    // Wait for processing
    console.log('\n⏳ Waiting for webhook processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check order status after webhook
    const updatedOrder = await prisma.order.findUnique({
      where: { id: realWebhookData.order_id }
    });
    
    if (updatedOrder) {
      console.log('\n✅ Order after webhook processing:', {
        id: updatedOrder.id,
        customerName: updatedOrder.customerName,
        game: updatedOrder.game,
        service: updatedOrder.service,
        status: updatedOrder.status,
        paymentId: updatedOrder.paymentId,
        price: updatedOrder.price
      });
    } else {
      console.log('\n❌ Order still does not exist after webhook processing');
    }
    
    // Check notifications
    console.log('\n🔔 Checking notifications...');
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'payment-confirmed',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`Found ${notifications.length} recent payment-confirmed notifications:`);
    notifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.title} - ${notif.createdAt.toISOString()}`);
    });
    
  } catch (error) {
    console.error('❌ Webhook request failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  console.log('\n🏁 Test completed!');
}

// Run the test
testRealCryptomusWebhook()
  .then(() => {
    console.log('\n✅ Test finished successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });