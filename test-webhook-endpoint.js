const axios = require('axios');
const crypto = require('crypto');

async function testWebhookEndpoint() {
  console.log('🧪 Testing webhook endpoint directly...');
  
  // Simple test payload
  const testPayload = {
    order_id: 'test_endpoint_' + Date.now(),
    status: 'paid',
    amount: '10.00',
    currency: 'USD',
    uuid: 'test_uuid_' + Date.now(),
    additional_data: 'endpoint_test'
  };
  
  // Create signature
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const dataString = Buffer.from(JSON.stringify(testPayload)).toString('base64');
  const signature = crypto.createHash('md5').update(dataString + apiKey).digest('hex');
  
  console.log('📡 Sending test request to webhook endpoint...');
  console.log('URL: http://localhost:5201/api/pay/cryptomus/webhook');
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  console.log('Signature:', signature);
  
  try {
    const response = await axios.post('http://localhost:5201/api/pay/cryptomus/webhook', testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      },
      timeout: 15000
    });
    
    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check webhook debug log
    const fs = require('fs');
    try {
      const debugLog = fs.readFileSync('logs/webhook-debug.log', 'utf8');
      console.log('\n📋 Webhook debug log content:');
      if (debugLog.trim()) {
        console.log(debugLog);
      } else {
        console.log('(empty)');
      }
    } catch (e) {
      console.log('❌ Could not read webhook debug log:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Request failed:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    if (error.code) {
      console.error('Code:', error.code);
    }
  }
}

testWebhookEndpoint().catch(console.error);