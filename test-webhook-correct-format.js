const axios = require('axios');
const crypto = require('crypto');

async function testWebhookCorrectFormat() {
  console.log('🔍 Testing webhook with correct Cryptomus format...');
  
  // Real webhook data WITHOUT sign field (as it should be in headers)
  const webhookData = {
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
    "transfer_id": "fb9fa611-e59b-4d3c-9433-442a5a16b8cb"
  };
  
  // Calculate correct signature
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const dataString = Buffer.from(JSON.stringify(webhookData)).toString('base64');
  const calculatedSign = crypto
    .createHash('md5')
    .update(dataString + apiKey)
    .digest('hex');
  
  console.log('🔐 Calculated signature:', calculatedSign);
  console.log('📋 Original signature from logs: 6488c59fcb499680a403d745e1b96488');
  console.log('✅ Signatures match:', calculatedSign === '6488c59fcb499680a403d745e1b96488');
  
  try {
    console.log('📤 Sending webhook request to localhost...');
    
    const response = await axios.post('http://localhost:5201/api/pay/cryptomus/webhook', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'sign': calculatedSign  // Use calculated signature
      },
      timeout: 10000
    });
    
    console.log('✅ Webhook response:', response.status, response.data);
    
    // Check if notification was logged
    setTimeout(async () => {
      const fs = require('fs');
      try {
        const logContent = fs.readFileSync('logs/admin-notifications.log', 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());
        const lastFewLines = lines.slice(-5);
        
        console.log('\n📋 Last 5 admin notification entries:');
        lastFewLines.forEach((line, index) => {
          console.log(`  ${index + 1}. ${line}`);
        });
        
        const hasOrderNotification = logContent.includes('cm_order_1755432978430_uyt2emv8w');
        console.log('\n🎯 Order notification found:', hasOrderNotification ? '✅ YES' : '❌ NO');
        
        // Also check webhook debug log
        const webhookLogContent = fs.readFileSync('logs/webhook-debug.log', 'utf8');
        const hasWebhookProcessing = webhookLogContent.includes('PAYMENT CONFIRMATION NOTIFICATION SENT') || 
                                   webhookLogContent.includes('NEW ORDER NOTIFICATION SUCCESS');
        console.log('🎯 Webhook processing found:', hasWebhookProcessing ? '✅ YES' : '❌ NO');
        
      } catch (logError) {
        console.log('📋 Could not read logs:', logError.message);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Wait a bit then run the test
setTimeout(() => {
  testWebhookCorrectFormat();
}, 1000);

console.log('⏳ Starting webhook test in 1 second...');