// Using built-in fetch for Node.js 18+

async function testRegistrationFix() {
  console.log('🧪 Testing Registration Fix...');
  console.log('=' .repeat(50));

  const testCases = [
    {
      name: 'Valid Registration',
      data: {
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123',
        username: `testuser${Date.now()}`
      },
      expectedStatus: 200
    },
    {
      name: 'Weak Password (no uppercase)',
      data: {
        email: `test${Date.now()}@example.com`,
        password: 'testpassword123',
        username: `testuser${Date.now()}`
      },
      expectedStatus: 400
    },
    {
      name: 'Weak Password (no number)',
      data: {
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword',
        username: `testuser${Date.now()}`
      },
      expectedStatus: 400
    },
    {
      name: 'Short Username',
      data: {
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123',
        username: 'ab'
      },
      expectedStatus: 400
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data)
      });

      console.log(`📊 Status: ${response.status} (Expected: ${testCase.expectedStatus})`);
      
      const responseText = await response.text();
      
      try {
        const responseData = JSON.parse(responseText);
        console.log(`✅ Valid JSON Response`);
        console.log(`📋 Success: ${responseData.success}`);
        console.log(`💬 Message: ${responseData.message}`);
        
        if (response.status === testCase.expectedStatus) {
          console.log(`✅ Test PASSED`);
        } else {
          console.log(`❌ Test FAILED - Status mismatch`);
        }
      } catch (jsonError) {
        console.log(`❌ Invalid JSON Response`);
        console.log(`🔍 Raw response: ${responseText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.error(`❌ Request failed:`, error.message);
    }
  }
}

// Run the test
testRegistrationFix();