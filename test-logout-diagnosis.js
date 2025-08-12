#!/usr/bin/env node

// Logout Diagnosis Test
// Tests logout functionality and session management

const https = require('https');
const http = require('http');

const BASE_URL = 'https://gear-score.com';
const LOCAL_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retries: 3
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Logout-Diagnosis-Test/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: TEST_CONFIG.timeout
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🔍 Testing ${name}...`);
  
  try {
    const response = await makeRequest(url, options);
    
    console.log(`✅ ${name}: Status ${response.status}`);
    
    if (response.cookies.length > 0) {
      console.log(`🍪 Cookies set: ${response.cookies.length}`);
      response.cookies.forEach(cookie => {
        console.log(`   - ${cookie.split(';')[0]}`);
      });
    }
    
    // Try to parse JSON response
    try {
      const jsonData = JSON.parse(response.body);
      if (jsonData.message) {
        console.log(`📝 Message: ${jsonData.message}`);
      }
      if (jsonData.user) {
        console.log(`👤 User: ${jsonData.user.email || jsonData.user.id || 'Present'}`);
      }
    } catch (e) {
      // Not JSON, that's okay
      if (response.body.length < 200) {
        console.log(`📄 Response: ${response.body.substring(0, 100)}...`);
      }
    }
    
    return response;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return null;
  }
}

async function runLogoutDiagnosis() {
  console.log('🚪 Logout Functionality Diagnosis');
  console.log('=' .repeat(50));
  
  // Test both production and local if available
  const testUrls = [BASE_URL, LOCAL_URL];
  
  for (const baseUrl of testUrls) {
    console.log(`\n🌐 Testing: ${baseUrl}`);
    console.log('-'.repeat(30));
    
    // Test 1: Check current session status
    await testEndpoint(
      'Session Status',
      `${baseUrl}/api/auth/session`
    );
    
    // Test 2: Test NextAuth signout endpoint
    await testEndpoint(
      'NextAuth Signout',
      `${baseUrl}/api/auth/signout`,
      { method: 'POST' }
    );
    
    // Test 3: Test force logout endpoint
    await testEndpoint(
      'Force Logout',
      `${baseUrl}/api/force-logout`,
      { method: 'POST' }
    );
    
    // Test 4: Test improved logout endpoint
    await testEndpoint(
      'Improved Logout',
      `${baseUrl}/api/logout-improved`,
      { method: 'POST' }
    );
    
    // Test 5: Check session after logout attempts
    await testEndpoint(
      'Session After Logout',
      `${baseUrl}/api/auth/session`
    );
    
    // Test 6: Test CSRF token
    await testEndpoint(
      'CSRF Token',
      `${baseUrl}/api/auth/csrf`
    );
  }
  
  console.log('\n🔧 Diagnosis Recommendations:');
  console.log('=' .repeat(50));
  console.log('1. Check browser developer tools for:');
  console.log('   - Console errors during logout');
  console.log('   - Network tab for failed requests');
  console.log('   - Application tab for persistent cookies/storage');
  console.log('\n2. Test logout in different scenarios:');
  console.log('   - Fresh login → immediate logout');
  console.log('   - After page navigation → logout');
  console.log('   - In incognito/private mode');
  console.log('\n3. Check server logs for:');
  console.log('   - Authentication errors');
  console.log('   - Session management issues');
  console.log('   - Cookie clearing problems');
  
  console.log('\n🆘 Emergency Logout Commands:');
  console.log('=' .repeat(50));
  console.log('// In browser console:');
  console.log('localStorage.clear(); sessionStorage.clear(); window.location.href="/auth";');
  console.log('\n// Or use the emergency function:');
  console.log('emergencyLogout();');
}

// Run the diagnosis
if (require.main === module) {
  runLogoutDiagnosis().catch(console.error);
}

module.exports = { runLogoutDiagnosis, testEndpoint };