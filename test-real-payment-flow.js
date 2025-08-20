/**
 * Test Real Payment Flow
 * Creates a real small payment to test the complete notification flow on gear-score.com
 */

const axios = require('axios');
const crypto = require('crypto');
const { prisma } = require('./services/databaseNotificationService');

async function testRealPaymentFlow() {
  console.log('💰 Testing real payment flow on gear-score.com');
  console.log('⚠️  This will create a real payment invoice for $0.10');
  
  // Load environment variables
  require('dotenv').config();
  
  // Find a real user for testing
  console.log('👤 Finding a real user...');
  const user = await prisma.user.findFirst({
    where: {
      email: {
        not: ''
      }
    }
  });
  
  if (!user) {
    console.error('❌ No users found in database');
    return;
  }
  
  console.log(`✅ Using user: ${user.email} (ID: ${user.id})`);
  
  const orderId = `real_test_${Date.now()}`;
  
  // Create payment session
  console.log('💳 Creating payment session...');
  const paymentSession = await prisma.paymentSession.create({
    data: {
      orderId: orderId,
      userId: user.id,
      customerEmail: user.email,
      game: 'Real Payment Test',
      service: 'Notification System Test',
      serviceDetails: 'Testing complete payment flow with real Cryptomus payment',
      amount: 0.10, // Minimum amount
      currency: 'USD',
      paymentProvider: 'Cryptomus',
      paymentId: `cryptomus_real_${Date.now()}`,
      status: 'pending'
    }
  });
  
  console.log(`✅ Payment session created: ${paymentSession.orderId}`);
  
  // Cryptomus API configuration
  const apiKey = process.env.CRYPTOMUS_API_KEY;
  const merchantId = process.env.CRYPTOMUS_MERCHANT_ID;
  const baseUrl = 'https://api.cryptomus.com/v1';
  
  if (!apiKey || !merchantId) {
    console.error('❌ Cryptomus credentials not found in environment');
    return;
  }
  
  // Prepare invoice data
  const invoiceData = {
    amount: '0.10',
    currency: 'USD',
    order_id: orderId,
    url_return: `https://gear-score.com/pay/success?orderId=${orderId}&game=Real%20Payment%20Test&service=Notification%20System%20Test&amount=0.10`,
    url_callback: 'https://gear-score.com/api/pay/cryptomus/webhook',
    url_success: `https://gear-score.com/pay/success?orderId=${orderId}&game=Real%20Payment%20Test&service=Notification%20System%20Test&amount=0.10&currency=USD`,
    url_cancel: `https://gear-score.com/pay/failed?orderId=${orderId}`,
    is_payment_multiple: false,
    lifetime: 3600, // 1 hour
    to_currency: 'USDT',
    subtract: '1',
    accuracy_payment_percent: '1',
    additional_data: JSON.stringify({
      user_id: user.id,
      game: 'Real Payment Test',
      service: 'Notification System Test',
      customer_email: user.email,
      real_payment_test: true
    })
  };
  
  // Create signature
  const dataString = Buffer.from(JSON.stringify(invoiceData)).toString('base64');
  const signature = crypto
    .createHash('md5')
    .update(dataString + apiKey)
    .digest('hex');
  
  console.log('\n📡 Creating real payment invoice...');
  console.log('🎯 Webhook URL: https://gear-score.com/api/pay/cryptomus/webhook');
  console.log('💰 Amount: $0.10 USD');
  
  try {
    const response = await axios.post(`${baseUrl}/payment`, invoiceData, {
      headers: {
        'Content-Type': 'application/json',
        'merchant': merchantId,
        'sign': signature
      },
      timeout: 15000
    });
    
    if (response.data && response.data.result) {
      const result = response.data.result;
      
      console.log('\n✅ Real payment invoice created successfully!');
      console.log('📄 Payment Details:');
      console.log(`  Payment URL: ${result.url}`);
      console.log(`  Order ID: ${result.order_id}`);
      console.log(`  UUID: ${result.uuid}`);
      console.log(`  Amount: ${result.amount} ${result.currency}`);
      console.log(`  Expires: ${new Date(result.expired_at * 1000).toLocaleString()}`);
      
      console.log('\n🔗 PAYMENT LINK:');
      console.log(`${result.url}`);
      console.log('\n📝 Instructions:');
      console.log('1. Open the payment link above in your browser');
      console.log('2. Complete the payment with $0.10 USDT');
      console.log('3. After payment, Cryptomus will send webhook to:');
      console.log('   https://gear-score.com/api/pay/cryptomus/webhook');
      console.log('4. Check the gear-score.com website for notifications');
      
      console.log('\n⏳ Monitoring for webhook notifications...');
      console.log('   (This script will continue running to monitor for webhooks)');
      
      // Monitor for order updates
      let attempts = 0;
      const maxAttempts = 60; // Monitor for 10 minutes (60 * 10 seconds)
      
      const monitorInterval = setInterval(async () => {
        attempts++;
        
        try {
          // Check if order was created/updated
          const order = await prisma.order.findUnique({
            where: { id: orderId }
          });
          
          if (order && order.status !== 'pending') {
            console.log('\n🎉 Payment detected!');
            console.log('✅ Order updated:', {
              id: order.id,
              status: order.status,
              customerName: order.customerName,
              game: order.game,
              service: order.service,
              price: order.price
            });
            
            // Check for notifications
            try {
              const notifications = await prisma.notification.findMany({
                where: {
                  userId: user.id,
                  createdAt: {
                    gte: new Date(Date.now() - 300000) // Last 5 minutes
                  }
                },
                orderBy: {
                  createdAt: 'desc'
                }
              });
              
              console.log(`\n📬 Found ${notifications.length} recent notifications:`);
              notifications.forEach((notif, index) => {
                console.log(`  ${index + 1}. ${notif.title} - ${notif.message}`);
              });
              
              if (notifications.length > 0) {
                console.log('\n✅ SUCCESS: Notifications are working on production!');
              } else {
                console.log('\n⚠️ No notifications found - may need investigation');
              }
            } catch (notifError) {
              console.log('⚠️ Could not fetch notifications:', notifError.message);
            }
            
            clearInterval(monitorInterval);
            console.log('\n🏁 Real payment flow test completed');
            process.exit(0);
          }
          
          if (attempts >= maxAttempts) {
            console.log('\n⏰ Monitoring timeout reached (10 minutes)');
            console.log('💡 Payment may still be pending or webhook may not have been received');
            clearInterval(monitorInterval);
            process.exit(0);
          }
          
          if (attempts % 6 === 0) { // Every minute
            console.log(`⏳ Still monitoring... (${attempts}/60 attempts, ${Math.floor(attempts/6)} minutes)`);
          }
          
        } catch (error) {
          console.error('❌ Error during monitoring:', error.message);
        }
      }, 10000); // Check every 10 seconds
      
    } else {
      console.error('❌ Invalid response from Cryptomus API');
      console.error('Response:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Failed to create real payment invoice:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testRealPaymentFlow().catch(console.error);