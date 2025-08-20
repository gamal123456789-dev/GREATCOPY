const axios = require('axios');

async function testWebhookWithLogs() {
  console.log('🧪 Testing webhook with debug logs...');
  
  const testData = {
    type: "payment",
    uuid: "test-uuid-123",
    order_id: "test_order_123",
    amount: "1.00",
    status: "paid",
    sign: "test_signature"
  };

  try {
    console.log('📡 Sending test request...');
    const response = await axios.post('http://localhost:3000/api/pay/cryptomus/webhook', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Don't throw on 4xx/5xx
    });

    console.log('📋 Response details:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
    // Wait a moment then check the log file
    setTimeout(() => {
      const fs = require('fs');
      try {
        const logContent = fs.readFileSync('logs/webhook-debug.log', 'utf8');
        const lines = logContent.split('\n');
        const lastLine = lines[lines.length - 2]; // -2 because last line is empty
        console.log('📝 Last log entry:', lastLine);
      } catch (err) {
        console.log('❌ Could not read log file:', err.message);
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testWebhookWithLogs();