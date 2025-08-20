const axios = require('axios');
const prisma = require('./lib/prisma');

async function testApiOrder() {
  try {
    console.log('🧪 Testing order creation via API...');
    
    // First, get a user to authenticate with
    const user = await prisma.user.findFirst({
      where: {
        email: { not: '' }
      }
    });
    
    if (!user) {
      console.log('❌ No user found in database');
      return;
    }
    
    console.log('📋 Using user:', user.email);
    
    // Create a simple session token (this is a simplified approach)
    // In a real scenario, you'd need proper NextAuth session handling
    const orderData = {
      id: `TEST-API-${Date.now()}`,
      customerName: 'API Test Customer',
      game: 'Test Game',
      service: 'Test Service',
      status: 'pending',
      price: 100,
      date: new Date().toISOString(),
      userId: user.id,
      paymentId: null
    };
    
    console.log('📤 Sending API request to create order...');
    
    // Make API call to create order
    try {
      const response = await axios.post('http://localhost:5201/api/orders', orderData, {
        headers: {
          'Content-Type': 'application/json',
          // Note: This won't work without proper session cookie
          // But we can see if the endpoint is reachable
        },
        timeout: 5000
      });
      
      console.log('✅ API Response:', response.status, response.statusText);
      console.log('📧 Order should have triggered middleware notification');
      
    } catch (apiError) {
      if (apiError.response) {
        console.log('⚠️ API Error:', apiError.response.status, apiError.response.data);
        if (apiError.response.status === 401) {
          console.log('🔐 Authentication required - this is expected');
        }
      } else {
        console.log('❌ Network Error:', apiError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testApiOrder().then(() => {
  console.log('🏁 API test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});