/**
 * Debug script for payment gateway issues
 * Tests authentication, payment creation, and error logging
 */

const https = require('https');
const http = require('http');

// Test configuration
const DOMAIN = 'gear-score.com';
const PORT = 5200;
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
        'User-Agent': 'Debug-Script/1.0',
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

async function testLogClientError() {
  console.log('\n🔍 Testing log-client-error API...');
  
  try {
    const result = await testEndpoint('/api/log-client-error', 'POST', {
      error: {
        message: 'Test error from debug script',
        name: 'TestError',
        stack: 'TestError: Test error\n    at test (debug-payment-issue.js:1:1)'
      },
      context: {
        source: 'debug-script',
        test: true
      }
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Response:`, result.body);
    
    if (result.status === 200) {
      console.log('✅ log-client-error API working correctly');
    } else {
      console.log('❌ log-client-error API has issues');
    }
  } catch (error) {
    console.log('❌ Failed to test log-client-error:', error.message);
  }
}

async function testPaymentEndpoint() {
  console.log('\n🔍 Testing payment endpoint (without auth)...');
  
  try {
    const result = await testEndpoint('/api/pay/coinbase/create-payment', 'POST', {
      amount: 10,
      game: 'Test Game',
      service: 'Test Service',
      currency: 'USD'
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Response:`, result.body);
    
    if (result.status === 401) {
      console.log('✅ Payment endpoint correctly requires authentication');
    } else if (result.status === 200) {
      console.log('⚠️  Payment endpoint working but should require auth');
    } else {
      console.log('❌ Payment endpoint has unexpected response');
    }
  } catch (error) {
    console.log('❌ Failed to test payment endpoint:', error.message);
  }
}

async function testServerHealth() {
  console.log('\n🔍 Testing server health...');
  
  try {
    const result = await testEndpoint('/');
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('✅ Server is responding');
    } else {
      console.log('❌ Server health check failed');
    }
  } catch (error) {
    console.log('❌ Server is not responding:', error.message);
  }
}

async function testAuthEndpoints() {
  console.log('\n🔍 Testing auth endpoints...');
  
  try {
    // Test session endpoint
    const sessionResult = await testEndpoint('/api/auth/session');
    console.log(`Session Status: ${sessionResult.status}`);
    
    // Test providers endpoint
    const providersResult = await testEndpoint('/api/auth/providers');
    console.log(`Providers Status: ${providersResult.status}`);
    
    if (sessionResult.status === 200 && providersResult.status === 200) {
      console.log('✅ Auth endpoints working');
    } else {
      console.log('❌ Auth endpoints have issues');
    }
  } catch (error) {
    console.log('❌ Failed to test auth endpoints:', error.message);
  }
}

// Main test function
async function runDiagnostics() {
  console.log('🚀 Starting Payment Gateway Diagnostics...');
  console.log(`Testing: ${BASE_URL}`);
  console.log('=' .repeat(50));
  
  await testServerHealth();
  await testAuthEndpoints();
  await testLogClientError();
  await testPaymentEndpoint();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Diagnostics Complete!');
  console.log('\n📋 Summary:');
  console.log('- If log-client-error is working: ✅ Error logging fixed');
  console.log('- If payment endpoint returns 401: ✅ Authentication required (normal)');
  console.log('- If server health is good: ✅ VPS is running');
  console.log('\n💡 Next steps:');
  console.log('1. Make sure users are logged in via Discord');
  console.log('2. Check browser console for authentication errors');
  console.log('3. Verify NEXTAUTH_URL in .env matches your domain');
}

// Run diagnostics
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { testEndpoint, runDiagnostics };