const axios = require('axios');
const crypto = require('crypto');
const { prisma } = require('./services/databaseNotificationService');

async function debugRealPayment() {
  console.log('🔍 Debugging Real Payment Issue...');
  console.log('=' .repeat(60));
  
  const orderId = 'cm_order_1755500361359_f7si5rcix';
  
  // Check payment session
  console.log('\n📋 Checking Payment Session...');
  const paymentSession = await prisma.paymentSession.findUnique({
    where: { orderId }
  });
  
  if (!paymentSession) {
    console.log('❌ Payment session not found!');
    return;
  }
  
  console.log('✅ Payment Session found:', {
    orderId: paymentSession.orderId,
    status: paymentSession.status,
    amount: paymentSession.amount,
    updatedAt: paymentSession.updatedAt
  });
  
  // Check if order exists
  console.log('\n📋 Checking Order...');
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });
  
  if (order) {
    console.log('✅ Order exists:', {
      id: order.id,
      status: order.status,
      paymentId: order.paymentId
    });
  } else {
    console.log('❌ Order does not exist - this is the problem!');
  }
  
  // Recreate the exact webhook data that was received
  const webhookData = {
    "type": "payment",
    "uuid": "23311b3b-24c4-44cc-bd64-1da8fbb02e5c",
    "order_id": orderId,
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
    "payer_amount_exchange_rate": "1.00059841",
    "additional_data": "{\"user_id\":\"7d14fc11-a0bf-449f-97af-6c3e9faa8841\",\"game\":\"Black Desert Online\",\"service\":\"Power Leveling\",\"customer_email\":\"gamalkhaled981@gmail.com\"}",
    "transfer_id": "71b34ac6-7fc6-4b89-ba3c-ae7caa7a685e"
  };
  
  console.log('\n🔄 Resending webhook to fix the issue...');
  
  // Calculate signature
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const dataString = Buffer.from(JSON.stringify(webhookData)).toString('base64');
  const signature = crypto.createHash('md5').update(dataString + apiKey).digest('hex');
  
  try {
    const response = await axios.post('https://gear-score.com/api/pay/cryptomus/webhook', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature,
        'User-Agent': 'Cryptomus-Debug-Fix'
      },
      timeout: 15000
    });
    
    console.log('✅ Webhook response:', response.status, response.data);
    
    // Wait for processing
    console.log('\n⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check results
    const updatedSession = await prisma.paymentSession.findUnique({
      where: { orderId }
    });
    
    const createdOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    const notifications = await prisma.notification.findMany({
      where: {
        userId: '7d14fc11-a0bf-449f-97af-6c3e9faa8841',
        type: 'payment-confirmed',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📊 Results after webhook:');
    console.log('Payment Session Status:', updatedSession?.status);
    console.log('Order Created:', createdOrder ? 'YES' : 'NO');
    console.log('Recent Notifications:', notifications.length);
    
    if (notifications.length > 0) {
      console.log('\n🔔 Recent notifications:');
      notifications.forEach((n, i) => {
        console.log(`  ${i + 1}. ${n.title} - ${n.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Webhook failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  console.log('\n✅ Debug completed');
}

// Load environment variables
require('dotenv').config();

// Run the debug
debugRealPayment().catch(console.error).finally(() => {
  process.exit(0);
});