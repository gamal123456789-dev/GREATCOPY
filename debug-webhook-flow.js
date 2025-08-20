const { prisma } = require('./services/databaseNotificationService');

async function debugWebhookFlow() {
  console.log('🔍 Debugging webhook flow...');
  
  const orderId = 'clean_webhook_1755384764105'; // Last test order
  
  console.log('\n=== CHECKING ORDER EXISTENCE ===');
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId }
  });
  
  if (existingOrder) {
    console.log('✅ Order EXISTS in database:');
    console.log({
      id: existingOrder.id,
      customerName: existingOrder.customerName,
      game: existingOrder.game,
      service: existingOrder.service,
      price: existingOrder.price,
      status: existingOrder.status,
      date: existingOrder.date,
      paymentId: existingOrder.paymentId
    });
  } else {
    console.log('❌ Order does NOT exist in database');
  }
  
  console.log('\n=== CHECKING PAYMENT SESSION ===');
  const paymentSession = await prisma.paymentSession.findUnique({
    where: { orderId: orderId }
  });
  
  if (paymentSession) {
    console.log('✅ Payment session EXISTS:');
    console.log({
      orderId: paymentSession.orderId,
      userId: paymentSession.userId,
      customerEmail: paymentSession.customerEmail,
      game: paymentSession.game,
      service: paymentSession.service,
      serviceDetails: paymentSession.serviceDetails,
      amount: paymentSession.amount,
      status: paymentSession.status,
      paymentProvider: paymentSession.paymentProvider
    });
  } else {
    console.log('❌ Payment session does NOT exist');
  }
  
  console.log('\n=== WEBHOOK LOGIC ANALYSIS ===');
  if (existingOrder && paymentSession) {
    console.log('🔄 WEBHOOK WOULD: Update existing order (payment confirmation)');
    console.log('   - This triggers the PAYMENT CONFIRMATION notification logic');
    console.log('   - NOT the NEW ORDER notification logic');
  } else if (!existingOrder && paymentSession) {
    console.log('🆕 WEBHOOK WOULD: Create new order from payment session');
    console.log('   - This triggers the NEW ORDER notification logic');
  } else {
    console.log('❌ WEBHOOK WOULD: Fail (no payment session found)');
  }
  
  console.log('\n=== RECOMMENDATION ===');
  if (existingOrder) {
    console.log('💡 The order already exists, so webhook enters UPDATE path');
    console.log('💡 To test NEW ORDER path, delete the existing order first');
    console.log('💡 Or use a completely new order ID that doesn\'t exist');
  }
}

debugWebhookFlow().catch(console.error);