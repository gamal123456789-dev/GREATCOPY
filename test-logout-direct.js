#!/usr/bin/env node

/**
 * Direct Logout Test Script
 * Tests logout functionality directly on the running server
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:5201';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LogoutTest/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          cookies: res.headers['set-cookie'] || []
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testLogoutEndpoints() {
  console.log('🔍 Testing Logout Endpoints on', BASE_URL);
  console.log('=' .repeat(50));
  
  const tests = [
    {
      name: 'Home Page',
      url: `${BASE_URL}/`,
      method: 'GET'
    },
    {
      name: 'Auth Page',
      url: `${BASE_URL}/auth`,
      method: 'GET'
    },
    {
      name: 'NextAuth Signout',
      url: `${BASE_URL}/api/auth/signout`,
      method: 'GET'
    },
    {
      name: 'Force Logout',
      url: `${BASE_URL}/api/force-logout`,
      method: 'POST'
    },
    {
      name: 'Improved Logout',
      url: `${BASE_URL}/api/logout-improved`,
      method: 'POST'
    },
    {
      name: 'Session Status',
      url: `${BASE_URL}/api/auth/session`,
      method: 'GET'
    },
    {
      name: 'CSRF Token',
      url: `${BASE_URL}/api/auth/csrf`,
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing ${test.name}...`);
      const result = await makeRequest(test.url, { method: test.method });
      
      console.log(`✅ ${test.name}: Status ${result.status}`);
      
      if (result.cookies.length > 0) {
        console.log(`🍪 Cookies set: ${result.cookies.length}`);
        result.cookies.forEach(cookie => {
          const cookieName = cookie.split('=')[0];
          console.log(`   - ${cookieName}`);
        });
      }
      
      // Show response size
      if (result.data) {
        const size = result.data.length;
        if (size > 0) {
          console.log(`📄 Response size: ${size} bytes`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\n🔧 Recommendations:');
  console.log('=' .repeat(50));
  console.log('1. If all endpoints return 200/302, the backend is working');
  console.log('2. If logout endpoints work, the issue might be in the frontend');
  console.log('3. Check browser console for JavaScript errors');
  console.log('4. Clear browser cache and cookies');
  console.log('5. Test in incognito/private mode');
  
  console.log('\n🆘 Emergency Logout (run in browser console):');
  console.log('=' .repeat(50));
  console.log('localStorage.clear(); sessionStorage.clear(); document.cookie.split(";").forEach(c => { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); }); window.location.href="/auth";');
}

// Run the test
testLogoutEndpoints().catch(console.error);