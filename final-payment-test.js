/**
 * Final Payment Gateway Test
 * Comprehensive test after all fixes
 */

const https = require('https');
const http = require('http');

// Test configuration
const DOMAIN = 'gear-score.com';
const BASE_URL = `https://${DOMAIN}`;

// Test functions
async function testEndpoint(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Final-Test-Script/1.0',
        ...headers
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testLogClientErrorFixed() {
  console.log('\n🔧 Testing FIXED log-client-error API...');
  
  try {
    const result = await testEndpoint('/api/log-client-error', 'POST', {
      error: {
        message: 'Test error after fix',
        name: 'TestError',
        stack: 'TestError: Test error after fix\n    at test (final-payment-test.js:1:1)'
      },
      context: {
        source: 'final-test-script',
        test: true,
        fixed: true
      }
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Response:`, result.body);
    
    if (result.status === 200 && result.body.success) {
      console.log('✅ log-client-error API is now working correctly!');
      return true;
    } else {
      console.log('❌ log-client-error API still has issues');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to test log-client-error:', error.message);
    return false;
  }
}

async function testAuthFlow() {
  console.log('\n🔐 Testing Authentication Flow...');
  
  try {
    // Test session endpoint
    const sessionResult = await testEndpoint('/api/auth/session');
    console.log(`Session Status: ${sessionResult.status}`);
    
    // Test providers endpoint
    const providersResult = await testEndpoint('/api/auth/providers');
    console.log(`Providers Status: ${providersResult.status}`);
    console.log('Providers:', providersResult.body);
    
    // Test CSRF endpoint
    const csrfResult = await testEndpoint('/api/auth/csrf');
    console.log(`CSRF Status: ${csrfResult.status}`);
    
    if (sessionResult.status === 200 && providersResult.status === 200 && csrfResult.status === 200) {
      console.log('✅ Authentication endpoints working correctly');
      
      // Check if Discord provider is configured
      if (providersResult.body && providersResult.body.discord) {
        console.log('✅ Discord OAuth provider is configured');
        return true;
      } else {
        console.log('⚠️  Discord OAuth provider not found in response');
        return false;
      }
    } else {
      console.log('❌ Authentication endpoints have issues');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to test auth flow:', error.message);
    return false;
  }
}

async function testPaymentEndpointAuth() {
  console.log('\n💳 Testing Payment Endpoint Authentication...');
  
  try {
    const result = await testEndpoint('/api/pay/coinbase/create-payment', 'POST', {
      amount: 10,
      game: 'Test Game',
      service: 'Test Service',
      currency: 'USD'
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Response:`, result.body);
    
    if (result.status === 401 && result.body.error === 'Unauthorized') {
      console.log('✅ Payment endpoint correctly requires authentication');
      return true;
    } else if (result.status === 500) {
      console.log('❌ Payment endpoint has server error');
      return false;
    } else {
      console.log('⚠️  Payment endpoint has unexpected response');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to test payment endpoint:', error.message);
    return false;
  }
}

async function testServerHealth() {
  console.log('\n🏥 Testing Server Health...');
  
  try {
    const result = await testEndpoint('/');
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('✅ Server is healthy and responding');
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not responding:', error.message);
    return false;
  }
}

// Main test function
async function runFinalTest() {
  console.log('🎯 Final Payment Gateway Test');
  console.log(`Testing: ${BASE_URL}`);
  console.log('After applying all fixes...');
  console.log('=' .repeat(60));
  
  const results = {
    serverHealth: await testServerHealth(),
    authFlow: await testAuthFlow(),
    logClientError: await testLogClientErrorFixed(),
    paymentAuth: await testPaymentEndpointAuth()
  };
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Final Test Results:');
  console.log('=' .repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} - ${testName}`);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('\n' + '=' .repeat(60));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Payment gateway should now work correctly');
    console.log('\n📋 User Instructions:');
    console.log('1. Go to https://gear-score.com');
    console.log('2. Click "Login / Register"');
    console.log('3. Sign in with Discord');
    console.log('4. Select a game and service');
    console.log('5. Click "Buy Now" - should redirect to payment page');
    console.log('\n🔧 If payment still fails:');
    console.log('- Check browser console for errors');
    console.log('- Verify Discord OAuth callback URLs');
    console.log('- Ensure user is properly logged in');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('❌ Payment gateway needs additional fixes');
    console.log('\n🔧 Next steps:');
    console.log('1. Check failed tests above');
    console.log('2. Review server logs for errors');
    console.log('3. Verify environment configuration');
  }
  
  console.log('\n💡 Remember:');
  console.log('- "Payment processed successfully!" message is normal');
  console.log('- The redirect should happen automatically after that message');
  console.log('- If no redirect occurs, check browser console for errors');
}

// Run final test
if (require.main === module) {
  runFinalTest().catch(console.error);
}

module.exports = { runFinalTest };