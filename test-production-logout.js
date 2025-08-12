// Test logout functionality on production domain (gear-score.com)
// This script tests the logout issue reported by the user

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://gear-score.com';
const LOCAL_URL = 'http://localhost:5201';

// Test endpoint function
async function testEndpoint(name, url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; LogoutTest/1.0)',
        ...options.headers
      },
      // For HTTPS requests
      rejectUnauthorized: false // Allow self-signed certificates for testing
    };

    console.log(`\n🔍 Testing ${name}...`);
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const cookies = res.headers['set-cookie'] || [];
        const status = res.statusCode;
        
        if (status >= 200 && status < 400) {
          console.log(`✅ ${name}: Status ${status}`);
        } else {
          console.log(`❌ ${name}: Status ${status}`);
        }
        
        if (cookies.length > 0) {
          console.log(`🍪 Cookies set: ${cookies.length}`);
          cookies.forEach((cookie, index) => {
            const cookieName = cookie.split('=')[0];
            console.log(`   - ${cookieName}`);
          });
        }
        
        console.log(`📄 Response size: ${data.length} bytes`);
        
        // Log first 200 characters of response for debugging
        if (data.length > 0 && status >= 400) {
          console.log(`📝 Response preview: ${data.substring(0, 200)}...`);
        }
        
        resolve({ status, data, cookies });
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${name}: Error - ${error.message}`);
      resolve({ status: 0, error: error.message });
    });
    
    req.setTimeout(10000, () => {
      console.log(`⏰ ${name}: Timeout`);
      req.destroy();
      resolve({ status: 0, error: 'Timeout' });
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Main test function
async function testProductionLogout() {
  console.log('🚪 Production Logout Test - gear-score.com');
  console.log('=' .repeat(60));
  console.log('🎯 Testing the reported logout issue:');
  console.log('   "لما بعمل logout بيشيل اليوزر فوق علي اليمين بس برجع اعمل login تاني مش عارف بيوديني ليه https://gear-score.com/api/auth/error"');
  console.log('=' .repeat(60));
  
  // Test both production and local
  const testUrls = [
    { name: 'Production (gear-score.com)', url: PRODUCTION_URL },
    { name: 'Local Development', url: LOCAL_URL }
  ];
  
  for (const testEnv of testUrls) {
    console.log(`\n🌐 Testing: ${testEnv.name}`);
    console.log('-'.repeat(40));
    
    // Test 1: Check home page accessibility
    await testEndpoint(
      'Home Page Access',
      `${testEnv.url}/`
    );
    
    // Test 2: Check auth page
    await testEndpoint(
      'Auth Page',
      `${testEnv.url}/auth`
    );
    
    // Test 3: Check current session status
    await testEndpoint(
      'Session Status',
      `${testEnv.url}/api/auth/session`
    );
    
    // Test 4: Test NextAuth signout endpoint
    await testEndpoint(
      'NextAuth Signout',
      `${testEnv.url}/api/auth/signout`,
      { method: 'POST' }
    );
    
    // Test 5: Test improved logout endpoint
    await testEndpoint(
      'Improved Logout (Enhanced)',
      `${testEnv.url}/api/logout-improved`,
      { method: 'POST' }
    );
    
    // Test 6: Test force logout endpoint
    await testEndpoint(
      'Force Logout',
      `${testEnv.url}/api/force-logout`,
      { method: 'POST' }
    );
    
    // Test 7: Check session after logout attempts
    await testEndpoint(
      'Session After Logout',
      `${testEnv.url}/api/auth/session`
    );
    
    // Test 8: Check CSRF token
    await testEndpoint(
      'CSRF Token',
      `${testEnv.url}/api/auth/csrf`
    );
    
    // Test 9: Check error page (the problematic endpoint)
    await testEndpoint(
      'Auth Error Page',
      `${testEnv.url}/api/auth/error`
    );
  }
  
  console.log('\n🔧 Diagnosis & Recommendations:');
  console.log('=' .repeat(60));
  console.log('\n📋 Common Logout Issues on Production:');
  console.log('1. 🍪 Cookie Domain Mismatch:');
  console.log('   - Cookies set for wrong domain (.gear-score.com vs gear-score.com)');
  console.log('   - Mixed HTTP/HTTPS cookie settings');
  console.log('   - SameSite policy conflicts');
  
  console.log('\n2. 🔐 NextAuth Configuration:');
  console.log('   - NEXTAUTH_URL mismatch with actual domain');
  console.log('   - Discord OAuth redirect URI not matching');
  console.log('   - Session strategy conflicts');
  
  console.log('\n3. 🌐 Browser/Network Issues:');
  console.log('   - Browser cache holding old session data');
  console.log('   - Multiple tabs with different session states');
  console.log('   - Network proxy/CDN caching issues');
  
  console.log('\n🛠️ Recommended Solutions:');
  console.log('1. Clear browser data completely');
  console.log('2. Test in incognito/private mode');
  console.log('3. Check Discord OAuth settings in Discord Developer Portal');
  console.log('4. Verify NEXTAUTH_URL matches exactly: https://gear-score.com');
  console.log('5. Use the enhanced logout endpoint we just created');
  
  console.log('\n🆘 Emergency Logout (Browser Console):');
  console.log('=' .repeat(60));
  console.log('// Copy and paste this in browser console on gear-score.com:');
  console.log('localStorage.clear();');
  console.log('sessionStorage.clear();');
  console.log('document.cookie.split(";").forEach(c => {');
  console.log('  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=.gear-score.com");');
  console.log('  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;domain=gear-score.com");');
  console.log('  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");');
  console.log('});');
  console.log('window.location.href="/auth";');
}

// Run the test
if (require.main === module) {
  testProductionLogout().catch(console.error);
}

module.exports = { testProductionLogout, testEndpoint };