#!/usr/bin/env node

/**
 * Rate Limit Fix Validation Script
 * Tests authentication endpoints after nginx rate limiting fix
 */

const https = require('https');
const { performance } = require('perf_hooks');

class RateLimitValidator {
  constructor() {
    this.baseUrl = 'https://gear-score.com';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async makeRequest(endpoint, method = 'GET') {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const options = {
        hostname: 'gear-score.com',
        port: 443,
        path: endpoint,
        method: method,
        headers: {
          'User-Agent': 'Rate-Limit-Validator/1.0',
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const duration = performance.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            duration: Math.round(duration)
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  async testEndpoint(name, endpoint, expectedStatus = 200, maxRequests = 10) {
    console.log(`\n🧪 Testing ${name}...`);
    const results = [];
    let successCount = 0;
    let rateLimitCount = 0;

    for (let i = 1; i <= maxRequests; i++) {
      try {
        const result = await this.makeRequest(endpoint);
        results.push({
          request: i,
          status: result.statusCode,
          duration: result.duration
        });

        if (result.statusCode === expectedStatus) {
          successCount++;
          console.log(`   ✅ Request ${i}: ${result.statusCode} (${result.duration}ms)`);
        } else if (result.statusCode === 429 || result.statusCode === 503) {
          rateLimitCount++;
          console.log(`   ⚠️  Request ${i}: ${result.statusCode} - Rate Limited`);
        } else {
          console.log(`   ❌ Request ${i}: ${result.statusCode} (${result.duration}ms)`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`   ❌ Request ${i}: ERROR - ${error.message}`);
        results.push({
          request: i,
          status: 'ERROR',
          error: error.message
        });
      }
    }

    const testResult = {
      name,
      endpoint,
      totalRequests: maxRequests,
      successCount,
      rateLimitCount,
      successRate: (successCount / maxRequests * 100).toFixed(1),
      results
    };

    this.results.tests.push(testResult);

    if (successCount >= maxRequests * 0.8) { // 80% success rate acceptable
      this.results.passed++;
      console.log(`   ✅ PASSED: ${successCount}/${maxRequests} requests successful (${testResult.successRate}%)`);
    } else {
      this.results.failed++;
      console.log(`   ❌ FAILED: Only ${successCount}/${maxRequests} requests successful (${testResult.successRate}%)`);
    }

    return testResult;
  }

  async testRapidAuthFlow() {
    console.log(`\n🚀 Testing Rapid Authentication Flow...`);
    const endpoints = [
      '/api/auth/csrf',
      '/api/auth/session',
      '/api/auth/providers',
      '/api/auth/session'
    ];

    let allSuccessful = true;
    const flowResults = [];

    for (let flow = 1; flow <= 3; flow++) {
      console.log(`\n   Flow ${flow}:`);
      let flowSuccess = true;

      for (const endpoint of endpoints) {
        try {
          const result = await this.makeRequest(endpoint);
          const success = result.statusCode === 200;
          flowSuccess = flowSuccess && success;
          
          console.log(`     ${success ? '✅' : '❌'} ${endpoint}: ${result.statusCode} (${result.duration}ms)`);
          
          flowResults.push({
            flow,
            endpoint,
            status: result.statusCode,
            duration: result.duration,
            success
          });
        } catch (error) {
          console.log(`     ❌ ${endpoint}: ERROR - ${error.message}`);
          flowSuccess = false;
          flowResults.push({
            flow,
            endpoint,
            status: 'ERROR',
            error: error.message,
            success: false
          });
        }

        // Small delay between requests in flow
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      allSuccessful = allSuccessful && flowSuccess;
      console.log(`   Flow ${flow}: ${flowSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

      // Delay between flows
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (allSuccessful) {
      this.results.passed++;
      console.log(`\n   ✅ RAPID FLOW TEST PASSED: All authentication flows successful`);
    } else {
      this.results.failed++;
      console.log(`\n   ❌ RAPID FLOW TEST FAILED: Some flows had errors`);
    }

    return { allSuccessful, flowResults };
  }

  async runValidation() {
    console.log('🔍 NGINX Rate Limit Fix Validation');
    console.log('=' .repeat(50));
    console.log(`Testing: ${this.baseUrl}`);
    console.log(`Time: ${new Date().toISOString()}`);

    // Test individual endpoints
    await this.testEndpoint('Session Endpoint', '/api/auth/session', 200, 15);
    await this.testEndpoint('CSRF Endpoint', '/api/auth/csrf', 200, 10);
    await this.testEndpoint('Providers Endpoint', '/api/auth/providers', 200, 8);

    // Test rapid authentication flow
    await this.testRapidAuthFlow();

    // Generate summary
    this.generateSummary();
  }

  generateSummary() {
    console.log('\n' + '=' .repeat(50));
    console.log('📊 VALIDATION SUMMARY');
    console.log('=' .repeat(50));

    const totalTests = this.results.passed + this.results.failed;
    const successRate = totalTests > 0 ? (this.results.passed / totalTests * 100).toFixed(1) : 0;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${successRate}%`);

    if (this.results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ Rate limiting fix is working correctly');
      console.log('✅ Authentication endpoints are accessible');
      console.log('✅ Normal user flows should work without 503 errors');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED');
      console.log('❌ Rate limiting may still be too restrictive');
      console.log('❌ Further investigation needed');
    }

    console.log('\n📋 RECOMMENDATIONS:');
    if (this.results.failed === 0) {
      console.log('✅ Monitor nginx error logs for any remaining rate limit issues');
      console.log('✅ Set up alerts for 503 errors on authentication endpoints');
      console.log('✅ Consider implementing application-level monitoring');
    } else {
      console.log('🔧 Review nginx rate limiting configuration');
      console.log('🔧 Consider increasing burst limits further');
      console.log('🔧 Check for other potential causes of 503 errors');
    }

    console.log('\n' + '=' .repeat(50));
  }
}

// Run validation
if (require.main === module) {
  const validator = new RateLimitValidator();
  validator.runValidation().catch(console.error);
}

module.exports = RateLimitValidator;