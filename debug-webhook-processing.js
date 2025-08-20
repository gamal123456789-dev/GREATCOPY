const crypto = require('crypto');
const { prisma } = require('./services/databaseNotificationService');

async function debugWebhookProcessing() {
  console.log('🔍 Starting webhook processing debug...');
  
  // Test data from actual webhook
  const testWebhookData = {
    "type": "payment",
    "uuid": "57e2ae53-f78b-4e8b-a0d6-bdbe033240b6",
    "order_id": "cm_order_1755432978430_uyt2emv8w",
    "amount": "0.56000000",
    "payment_amount": "0.55000000",
    "payment_amount_usd": "0.55",
    "merchant_amount": "0.53900000",
    "commission": "0.01100000",
    "is_final": true,
    "status": "paid",
    "from": null,
    "wallet_address_uuid": null,
    "network": "bsc",
    "currency": "USD",
    "payer_currency": "USDT",
    "payer_amount": "0.55000000",
    "payer_amount_exchange_rate": "1.00048341",
    "additional_data": "{\"user_id\":\"7d14fc11-a0bf-449f-97af-6c3e9faa8841\",\"game\":\"Black Desert Online\",\"service\":\"Power Leveling\",\"customer_email\":\"gamalkhaled981@gmail.com\"}",
    "transfer_id": "fb9fa611-e59b-4d3c-9433-442a5a16b8cb",
    "sign": "6488c59fcb499680a403d745e1b96488"
  };
  
  console.log('📋 Test webhook data:', JSON.stringify(testWebhookData, null, 2));
  
  // Test signature verification
  const apiKey = process.env.CRYPTOMUS_API_KEY || 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const receivedSign = testWebhookData.sign;
  const dataString = Buffer.from(JSON.stringify(testWebhookData)).toString('base64');
  const expectedSign = crypto
    .createHash('md5')
    .update(dataString + apiKey)
    .digest('hex');
    
  console.log('🔐 Signature verification:');
  console.log('  Received sign:', receivedSign);
  console.log('  Expected sign:', expectedSign);
  console.log('  Signatures match:', receivedSign === expectedSign);
  
  if (receivedSign !== expectedSign) {
    console.log('❌ Signature verification failed - this is why webhook processing stops!');
    return;
  }
  
  // Check payment session
  console.log('🔍 Checking payment session for order:', testWebhookData.order_id);
  const paymentSession = await prisma.paymentSession.findUnique({
    where: { orderId: testWebhookData.order_id }
  });
  
  if (!paymentSession) {
    console.log('❌ Payment session not found - this is why webhook processing stops!');
    return;
  }
  
  console.log('✅ Payment session found:', {
    id: paymentSession.id,
    userId: paymentSession.userId,
    customerEmail: paymentSession.customerEmail,
    game: paymentSession.game,
    service: paymentSession.service,
    amount: paymentSession.amount,
    status: paymentSession.status
  });
  
  // Check if order exists
  console.log('🔍 Checking if order already exists:', testWebhookData.order_id);
  const existingOrder = await prisma.order.findUnique({
    where: { id: testWebhookData.order_id }
  });
  
  if (existingOrder) {
    console.log('✅ Order already exists - should enter existing order branch');
    console.log('  Order details:', {
      id: existingOrder.id,
      status: existingOrder.status,
      customerName: existingOrder.customerName,
      game: existingOrder.game,
      service: existingOrder.service,
      price: existingOrder.price
    });
  } else {
    console.log('✅ Order does not exist - should enter new order creation branch');
  }
  
  console.log('🎯 Debug complete - webhook should process successfully with this data');
}

debugWebhookProcessing()
  .then(() => {
    console.log('✅ Debug completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });