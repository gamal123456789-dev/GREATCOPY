#!/usr/bin/env node

// Test script to reproduce the rapid logout/login JSON parsing issue
// This script simulates the user behavior that causes the problem

const https = require('https');
const http = require('http');

const BASE_URL = 'https://gear-score.com';
const LOCAL_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  rapidInterval: 100, // milliseconds between logout and login
  testIterations: 5,
  timeout: 10000
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      },
      timeout: TEST_CONFIG.timeout
    };
    
    const requestOptions = { ...defaultOptions, ...options };
    
    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Try to parse as JSON first
          let parsedData;
          try {
            parsedData = JSON.parse(data);
          } catch (jsonError) {
            // If JSON parsing fails, check if it's HTML
            if (data.includes('<!DOCTYPE') || data.includes('<html')) {
              parsedData = {
                error: 'HTML_RESPONSE_INSTEAD_OF_JSON',
                htmlSnippet: data.substring(0, 200) + '...'
              };
            } else {
              parsedData = { rawResponse: data };
            }
          }
          
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            rawData: data
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (requestOptions.body) {
      req.write(requestOptions.body);
    }
    
    req.end();
  });
}

async function testLogoutEndpoint(baseUrl) {
  console.log(`\n🧪 Testing logout endpoint: ${baseUrl}/api/logout-improved`);
  
  try {
    const response = await makeRequest(`${baseUrl}/api/logout-improved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Status: ${response.statusCode}`);
    
    if (response.data.error === 'HTML_RESPONSE_INSTEAD_OF_JSON') {
      console.log(`❌ PROBLEM FOUND: Received HTML instead of JSON!`);
      console.log(`📄 HTML snippet: ${response.data.htmlSnippet}`);
      return false;
    } else {
      console.log(`✅ JSON Response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testForceLogoutEndpoint(baseUrl) {
  console.log(`\n🧪 Testing force-logout endpoint: ${baseUrl}/api/force-logout`);
  
  try {
    const response = await makeRequest(`${baseUrl}/api/force-logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Status: ${response.statusCode}`);
    
    if (response.data.error === 'HTML_RESPONSE_INSTEAD_OF_JSON') {
      console.log(`❌ PROBLEM FOUND: Received HTML instead of JSON!`);
      console.log(`📄 HTML snippet: ${response.data.htmlSnippet}`);
      return false;
    } else {
      console.log(`✅ JSON Response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testSessionEndpoint(baseUrl) {
  console.log(`\n🧪 Testing session endpoint: ${baseUrl}/api/auth/session`);
  
  try {
    const response = await makeRequest(`${baseUrl}/api/auth/session`);
    
    console.log(`✅ Status: ${response.statusCode}`);
    
    if (response.data.error === 'HTML_RESPONSE_INSTEAD_OF_JSON') {
      console.log(`❌ PROBLEM FOUND: Received HTML instead of JSON!`);
      console.log(`📄 HTML snippet: ${response.data.htmlSnippet}`);
      return false;
    } else {
      console.log(`✅ JSON Response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function simulateRapidLogoutLogin(baseUrl) {
  console.log(`\n🚀 Simulating rapid logout/login sequence...`);
  
  for (let i = 1; i <= TEST_CONFIG.testIterations; i++) {
    console.log(`\n--- Iteration ${i}/${TEST_CONFIG.testIterations} ---`);
    
    // Step 1: Logout
    console.log('🚪 Step 1: Logout...');
    const logoutSuccess = await testLogoutEndpoint(baseUrl);
    
    // Step 2: Wait briefly (simulating rapid user action)
    console.log(`⏱️ Step 2: Waiting ${TEST_CONFIG.rapidInterval}ms...`);
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.rapidInterval));
    
    // Step 3: Check session (simulating login attempt)
    console.log('🔍 Step 3: Checking session (simulating login)...');
    const sessionSuccess = await testSessionEndpoint(baseUrl);
    
    if (!logoutSuccess || !sessionSuccess) {
      console.log(`❌ Issue detected in iteration ${i}`);
      return false;
    }
  }
  
  return true;
}

async function runDiagnostic() {
  console.log('🔍 Rapid Logout/Login JSON Parsing Issue Diagnostic');
  console.log('=' .repeat(60));
  
  const testUrls = [BASE_URL];
  
  // Add localhost if available
  try {
    await makeRequest(`${LOCAL_URL}/api/auth/session`);
    testUrls.push(LOCAL_URL);
    console.log('✅ Local development server detected');
  } catch (error) {
    console.log('ℹ️ Local development server not available');
  }
  
  for (const baseUrl of testUrls) {
    console.log(`\n🌐 Testing: ${baseUrl}`);
    console.log('-'.repeat(40));
    
    // Test individual endpoints first
    await testLogoutEndpoint(baseUrl);
    await testForceLogoutEndpoint(baseUrl);
    await testSessionEndpoint(baseUrl);
    
    // Test rapid sequence
    const rapidTestSuccess = await simulateRapidLogoutLogin(baseUrl);
    
    if (rapidTestSuccess) {
      console.log(`\n✅ ${baseUrl}: All tests passed`);
    } else {
      console.log(`\n❌ ${baseUrl}: Issues detected`);
    }
  }
  
  console.log('\n📋 Diagnostic Summary:');
  console.log('=' .repeat(60));
  console.log('If you see "HTML_RESPONSE_INSTEAD_OF_JSON" errors above,');
  console.log('the issue is confirmed. The middleware or server is');
  console.log('returning HTML pages instead of JSON responses.');
  console.log('\nRecent fixes applied:');
  console.log('✅ Updated middleware.ts to exclude all /api/ routes');
  console.log('✅ Removed rate limiting from force-logout.js');
  console.log('\nIf issues persist, check:');
  console.log('- Server restart may be needed');
  console.log('- Browser cache clearing');
  console.log('- Network proxy/CDN configuration');
}

// Run the diagnostic
if (require.main === module) {
  runDiagnostic().catch(console.error);
}

module.exports = {
  runDiagnostic,
  simulateRapidLogoutLogin,
  testLogoutEndpoint,
  testForceLogoutEndpoint,
  testSessionEndpoint
};