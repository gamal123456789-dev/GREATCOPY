const axios = require('axios');
const crypto = require('crypto');
const { prisma } = require('./services/databaseNotificationService');

async function testProductionWebhook() {
  console.log('🌐 Testing Webhook on Production Domain (gear-score.com)...');
  console.log('=' .repeat(60));
  
  // Use the exact webhook data from production logs
  const realWebhookData = {
    "type": "payment",
    "uuid": "test_production_" + Date.now(),
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
    "transfer_id": "test_production_transfer_" + Date.now()
  };
  
  console.log('📋 Production webhook test data:');
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
    console.log('❌ Payment session not found for order:', realWebhookData.order_id);
    return;
  }
  
  // Check if order exists
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
    console.log('❌ Order not found for:', realWebhookData.order_id);
    return;
  }
  
  // Calculate signature for production webhook
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const dataString = Buffer.from(JSON.stringify(realWebhookData)).toString('base64');
  const signature = crypto.createHash('md5').update(dataString + apiKey).digest('hex');
  
  console.log('\n📡 Sending webhook to PRODUCTION domain (gear-score.com)...');
  console.log('🔐 Signature:', signature);
  
  try {
    // Send to production domain
    const response = await axios.post('https://gear-score.com/api/pay/cryptomus/webhook', realWebhookData, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature,
        'User-Agent': 'Cryptomus-Webhook-Test'
      },
      timeout: 15000
    });
    
    console.log('✅ Production webhook response:', response.status, response.data);
    
    // Wait for processing
    console.log('\n⏳ Waiting for production webhook processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check order status after webhook
    const updatedOrder = await prisma.order.findUnique({
      where: { id: realWebhookData.order_id }
    });
    
    if (updatedOrder) {
      console.log('\n✅ Order after production webhook processing:', {
        id: updatedOrder.id,
        customerName: updatedOrder.customerName,
        game: updatedOrder.game,
        service: updatedOrder.service,
        status: updatedOrder.status,
        paymentId: updatedOrder.paymentId,
        price: updatedOrder.price
      });
    }
    
    // Check for recent notifications
    console.log('\n🔔 Checking for recent notifications...');
    const recentNotifications = await prisma.notification.findMany({
      where: {
        type: 'payment-confirmed',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (recentNotifications.length > 0) {
      console.log(`Found ${recentNotifications.length} recent payment-confirmed notifications:`);
      recentNotifications.forEach((notif, index) => {
        console.log(`  ${index + 1}. ${notif.title} - ${notif.game} - ${notif.createdAt}`);
      });
    } else {
      console.log('❌ No recent payment-confirmed notifications found!');
    }
    
    console.log('\n🏁 Production test completed!');
    
  } catch (error) {
    console.error('❌ Production webhook test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  console.log('\n✅ Production test finished');
}

// Load environment variables
require('dotenv').config();

// Run the production test
testProductionWebhook().catch(console.error).finally(() => {
  process.exit(0);
});