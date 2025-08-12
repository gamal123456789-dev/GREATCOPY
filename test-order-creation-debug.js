const http = require('http');

// Test order data that matches the PaymentSystem structure
const testOrder = {
  id: 'test-order-' + Date.now(),
  customerName: 'Test User',
  game: 'New World',
  service: 'Leveling Boost',
  status: 'pending',
  price: 50.00,
  date: new Date().toISOString()
};

console.log('🧪 Testing order creation with data:', testOrder);

// Prepare the POST data
const postData = JSON.stringify(testOrder);

// Configure the request
const options = {
  hostname: 'localhost',
  port: 5200,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    // Note: This test won't have authentication, so we expect a 401 error
    // But we want to see if the error handling works correctly
  }
};

// Make the request
const req = http.request(options, (res) => {
  console.log('📡 Response Status:', res.statusCode, res.statusMessage);
  console.log('📋 Response Headers:', res.headers);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsedResponse = JSON.parse(responseData);
      console.log('📄 Response Body:', parsedResponse);
    } catch (error) {
      console.log('📄 Raw Response Body:', responseData);
    }
    
    if (res.statusCode === 401) {
      console.log('✅ Expected 401 error (no authentication) - API endpoint is working');
    } else if (res.statusCode === 500) {
      console.log('❌ Unexpected 500 error - there might be a server-side issue');
    } else {
      console.log('🤔 Unexpected response code:', res.statusCode);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

// Send the request
req.write(postData);
req.end();

console.log('🚀 Test request sent to http://localhost:5200/api/orders');