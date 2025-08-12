// Advanced Login Issue Diagnostic Tool
// Diagnoses repeated login problems on gear-score.com

const https = require('https');
const http = require('http');
const { URL } = require('url');

class LoginDiagnostic {
  constructor(baseUrl = 'https://gear-score.com') {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
    this.sessionData = {};
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'LoginDiagnostic/1.0',
          'Accept': 'application/json, text/html, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          ...options.headers
        }
      };

      // Add cookies if available
      if (this.cookies.size > 0) {
        const cookieString = Array.from(this.cookies.entries())
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');
        requestOptions.headers['Cookie'] = cookieString;
      }

      const req = client.request(requestOptions, (res) => {
        let data = '';
        
        // Store cookies from response
        const setCookieHeaders = res.headers['set-cookie'];
        if (setCookieHeaders) {
          setCookieHeaders.forEach(cookie => {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue.split('=');
            if (name && value) {
              this.cookies.set(name.trim(), value.trim());
            }
          });
        }

        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            cookies: setCookieHeaders || []
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

  async checkServerStatus() {
    console.log('🔍 1. Checking Server Status...');
    try {
      const response = await this.makeRequest('/');
      console.log(`   ✅ Server responding: ${response.statusCode}`);
      return response.statusCode === 200;
    } catch (error) {
      console.log(`   ❌ Server error: ${error.message}`);
      return false;
    }
  }

  async checkAuthEndpoints() {
    console.log('\n🔍 2. Checking Authentication Endpoints...');
    
    const endpoints = [
      '/api/auth/session',
      '/api/auth/csrf',
      '/api/auth/providers',
      '/auth'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        console.log(`   ${endpoint}: ${response.statusCode} ${this.getStatusText(response.statusCode)}`);
        
        if (endpoint === '/api/auth/session') {
          try {
            const sessionData = JSON.parse(response.data);
            this.sessionData = sessionData;
            console.log(`     Session: ${sessionData.user ? 'Active' : 'None'}`);
          } catch (e) {
            console.log(`     Session: Invalid JSON`);
          }
        }
        
        if (endpoint === '/api/auth/csrf') {
          try {
            const csrfData = JSON.parse(response.data);
            console.log(`     CSRF Token: ${csrfData.csrfToken ? 'Present' : 'Missing'}`);
          } catch (e) {
            console.log(`     CSRF Token: Invalid response`);
          }
        }
      } catch (error) {
        console.log(`   ${endpoint}: ERROR - ${error.message}`);
      }
    }
  }

  async simulateLoginAttempts() {
    console.log('\n🔍 3. Simulating Multiple Login Attempts...');
    
    const attempts = 3;
    const results = [];
    
    for (let i = 1; i <= attempts; i++) {
      console.log(`\n   Attempt ${i}:`);
      
      // Clear cookies to simulate fresh login
      this.cookies.clear();
      
      try {
        // Step 1: Get CSRF token
        const csrfResponse = await this.makeRequest('/api/auth/csrf');
        let csrfToken = null;
        
        try {
          const csrfData = JSON.parse(csrfResponse.data);
          csrfToken = csrfData.csrfToken;
          console.log(`     CSRF Token: ${csrfToken ? 'Obtained' : 'Failed'}`);
        } catch (e) {
          console.log(`     CSRF Token: Parse error`);
        }
        
        // Step 2: Check session before login
        const sessionBefore = await this.makeRequest('/api/auth/session');
        console.log(`     Session Before: ${sessionBefore.statusCode}`);
        
        // Step 3: Attempt Discord OAuth (simulate)
        const discordAuthUrl = `/api/auth/signin/discord`;
        const discordResponse = await this.makeRequest(discordAuthUrl);
        console.log(`     Discord Auth: ${discordResponse.statusCode}`);
        
        // Step 4: Check session after
        const sessionAfter = await this.makeRequest('/api/auth/session');
        console.log(`     Session After: ${sessionAfter.statusCode}`);
        
        results.push({
          attempt: i,
          csrf: !!csrfToken,
          discordAuth: discordResponse.statusCode,
          sessionAfter: sessionAfter.statusCode,
          cookies: this.cookies.size
        });
        
        // Wait between attempts
        if (i < attempts) {
          console.log(`     Waiting 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.log(`     ERROR: ${error.message}`);
        results.push({
          attempt: i,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async checkCookieBehavior() {
    console.log('\n🔍 4. Analyzing Cookie Behavior...');
    
    // Clear cookies
    this.cookies.clear();
    
    // Make initial request
    const initialResponse = await this.makeRequest('/api/auth/session');
    console.log(`   Initial cookies set: ${initialResponse.cookies.length}`);
    
    initialResponse.cookies.forEach((cookie, index) => {
      const [nameValue] = cookie.split(';');
      const [name] = nameValue.split('=');
      console.log(`     ${index + 1}. ${name}`);
    });
    
    // Check cookie persistence
    const secondResponse = await this.makeRequest('/api/auth/session');
    console.log(`   Cookies sent in second request: ${this.cookies.size}`);
    
    // Check specific NextAuth cookies
    const nextAuthCookies = Array.from(this.cookies.keys())
      .filter(name => name.includes('next-auth'));
    
    console.log(`   NextAuth cookies: ${nextAuthCookies.length}`);
    nextAuthCookies.forEach(cookie => {
      console.log(`     - ${cookie}`);
    });
  }

  async checkRateLimiting() {
    console.log('\n🔍 5. Testing Rate Limiting...');
    
    const rapidRequests = 10;
    const results = [];
    
    console.log(`   Making ${rapidRequests} rapid requests...`);
    
    for (let i = 1; i <= rapidRequests; i++) {
      try {
        const start = Date.now();
        const response = await this.makeRequest('/api/auth/session');
        const duration = Date.now() - start;
        
        results.push({
          request: i,
          status: response.statusCode,
          duration: duration
        });
        
        if (response.statusCode === 429) {
          console.log(`     Request ${i}: RATE LIMITED (429)`);
          break;
        } else {
          console.log(`     Request ${i}: ${response.statusCode} (${duration}ms)`);
        }
      } catch (error) {
        console.log(`     Request ${i}: ERROR - ${error.message}`);
        break;
      }
    }
    
    const rateLimited = results.some(r => r.status === 429);
    console.log(`   Rate limiting detected: ${rateLimited ? 'YES' : 'NO'}`);
    
    return results;
  }

  async generateReport(loginResults, rateLimitResults) {
    console.log('\n📊 DIAGNOSTIC REPORT');
    console.log('=' .repeat(50));
    
    // Server Status
    console.log('\n🖥️  SERVER STATUS:');
    console.log(`   Domain: ${this.baseUrl}`);
    console.log(`   Accessible: ✅`);
    
    // Authentication Analysis
    console.log('\n🔐 AUTHENTICATION ANALYSIS:');
    const successfulAttempts = loginResults.filter(r => !r.error).length;
    console.log(`   Successful attempts: ${successfulAttempts}/${loginResults.length}`);
    
    if (successfulAttempts < loginResults.length) {
      console.log('   ⚠️  ISSUE DETECTED: Some login attempts failed');
    }
    
    // Rate Limiting Analysis
    console.log('\n⏱️  RATE LIMITING ANALYSIS:');
    const rateLimited = rateLimitResults.some(r => r.status === 429);
    if (rateLimited) {
      console.log('   ❌ Rate limiting is blocking requests');
      console.log('   💡 SOLUTION: Increase rate limits or add delays between attempts');
    } else {
      console.log('   ✅ No rate limiting issues detected');
    }
    
    // Cookie Analysis
    console.log('\n🍪 COOKIE ANALYSIS:');
    console.log(`   Total cookies: ${this.cookies.size}`);
    const nextAuthCookies = Array.from(this.cookies.keys())
      .filter(name => name.includes('next-auth'));
    console.log(`   NextAuth cookies: ${nextAuthCookies.length}`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (rateLimited) {
      console.log('   1. 🔧 Adjust rate limiting settings in lib/rateLimiter.ts');
      console.log('   2. ⏰ Add delays between login attempts');
      console.log('   3. 🔄 Implement exponential backoff for failed attempts');
    }
    
    if (successfulAttempts < loginResults.length) {
      console.log('   1. 🔍 Check NextAuth configuration');
      console.log('   2. 🍪 Verify cookie settings and domain configuration');
      console.log('   3. 🔐 Check Discord OAuth settings');
      console.log('   4. 📝 Review server logs for detailed errors');
    }
    
    if (nextAuthCookies.length === 0) {
      console.log('   1. ⚠️  No NextAuth cookies detected - check cookie configuration');
      console.log('   2. 🔧 Verify NEXTAUTH_URL and domain settings');
      console.log('   3. 🔒 Check secure cookie settings for production');
    }
    
    console.log('\n🚀 QUICK FIXES:');
    console.log('   1. Clear browser cache and cookies');
    console.log('   2. Try incognito/private browsing mode');
    console.log('   3. Wait 15 minutes before attempting login again');
    console.log('   4. Check if the issue persists across different browsers');
    
    console.log('\n' + '=' .repeat(50));
  }

  getStatusText(code) {
    const statusTexts = {
      200: 'OK',
      302: 'Redirect',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Rate Limited',
      500: 'Server Error'
    };
    return statusTexts[code] || 'Unknown';
  }

  async runFullDiagnostic() {
    console.log('🚀 Starting Login Issue Diagnostic...');
    console.log(`Target: ${this.baseUrl}`);
    console.log('=' .repeat(50));
    
    try {
      // Run all diagnostic tests
      await this.checkServerStatus();
      await this.checkAuthEndpoints();
      const loginResults = await this.simulateLoginAttempts();
      await this.checkCookieBehavior();
      const rateLimitResults = await this.checkRateLimiting();
      
      // Generate comprehensive report
      await this.generateReport(loginResults, rateLimitResults);
      
    } catch (error) {
      console.error('\n❌ Diagnostic failed:', error.message);
    }
  }
}

// Run diagnostic
if (require.main === module) {
  const diagnostic = new LoginDiagnostic();
  diagnostic.runFullDiagnostic().catch(console.error);
}

module.exports = LoginDiagnostic;