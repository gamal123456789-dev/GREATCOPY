// Using built-in fetch for Node.js 18+

async function testRegisterEndpoint() {
  console.log('🧪 Testing Register Endpoint Fix...');
  console.log('=' .repeat(50));

  try {
    // Test registration endpoint
    const registerResponse = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!',
        username: `testuser${Date.now()}`
      })
    });

    console.log(`📊 Register Status: ${registerResponse.status}`);
    
    const registerText = await registerResponse.text();
    console.log(`📄 Register Response: ${registerText.substring(0, 200)}...`);

    // Check if it's valid JSON
    try {
      const registerData = JSON.parse(registerText);
      console.log('✅ Response is valid JSON');
      console.log(`📋 Success: ${registerData.success}`);
      console.log(`💬 Message: ${registerData.message}`);
    } catch (jsonError) {
      console.log('❌ Response is NOT valid JSON');
      console.log(`🔍 Raw response: ${registerText}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRegisterEndpoint();