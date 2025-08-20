const axios = require('axios');

async function testWebhookEndpoint() {
  try {
    console.log('🧪 Testing webhook endpoint accessibility...');
    
    // Test with minimal data to see if endpoint responds
    const testData = {
      "order_id": "test_order_123",
      "status": "paid",
      "sign": "test_signature"
    };
    
    console.log('📡 Sending test request...');
    
    try {
      const response = await axios.post('http://localhost:3000/api/pay/cryptomus/webhook', testData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log('✅ Response received:', response.status, response.data);
    } catch (error) {
      if (error.response) {
        console.log('📋 Response details:');
        console.log('Status:', error.response.status);
        console.log('Data:', error.response.data);
        console.log('Headers:', error.response.headers);
      } else if (error.request) {
        console.log('❌ No response received:', error.message);
      } else {
        console.log('❌ Request setup error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWebhookEndpoint();