// Local NextAuth Testing Tool
// Tests NextAuth functionality directly on the server

const http = require('http');
const { URL } = require('url');

class LocalNextAuthTester {
  constructor(baseUrl = 'http://localhost:5200') {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'LocalNextAuthTester/1.0',
          'Accept': 'application/json, text/html, */*',
          'Host': 'gear-score.com', // Important: use production domain
          'X-Forwarded-Proto': 'https',
          'X-Forwarded-Host': 'gear-score.com',
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

      const req = http.request(requestOptions, (res) => {
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

  async testBasicEndpoints() {
    console.log('🔍 Testing Basic Endpoints...');
    
    const endpoints = [
      '/',
      '/api/auth/session',
      '/api/auth/csrf',
      '/api/auth/providers'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        console.log(`   ${endpoint}: ${response.statusCode} ${this.getStatusText(response.statusCode)}`);
        
        if (response.statusCode >= 400) {
          console.log(`     Error data: ${response.data.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`   ${endpoint}: ERROR - ${error.message}`);
      }
    }
  }

  async testAuthFlow() {
    console.log('\n🔐 Testing Authentication Flow...');
    
    try {
      // Step 1: Get CSRF token
      console.log('   Step 1: Getting CSRF token...');
      const csrfResponse = await this.makeRequest('/api/auth/csrf');
      console.log(`     CSRF Response: ${csrfResponse.statusCode}`);
      
      if (csrfResponse.statusCode === 200) {
        try {
          const csrfData = JSON.parse(csrfResponse.data);
          console.log(`     CSRF Token: ${csrfData.csrfToken ? 'Present' : 'Missing'}`);
        } catch (e) {
          console.log(`     CSRF Parse Error: ${e.message}`);
          console.log(`     Raw data: ${csrfResponse.data.substring(0, 200)}`);
        }
      }

      // Step 2: Test session endpoint multiple times
      console.log('\n   Step 2: Testing session endpoint stability...');
      for (let i = 1; i <= 5; i++) {
        const sessionResponse = await this.makeRequest('/api/auth/session');
        console.log(`     Session Test ${i}: ${sessionResponse.statusCode}`);
        
        if (sessionResponse.statusCode !== 200) {
          console.log(`       Error: ${sessionResponse.data.substring(0, 100)}`);
          break;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 3: Test Discord provider
      console.log('\n   Step 3: Testing Discord provider...');
      const discordResponse = await this.makeRequest('/api/auth/signin/discord');
      console.log(`     Discord Provider: ${discordResponse.statusCode}`);
      
      if (discordResponse.statusCode === 302) {
        console.log(`     Redirect Location: ${discordResponse.headers.location}`);
      } else if (discordResponse.statusCode >= 400) {
        console.log(`     Error: ${discordResponse.data.substring(0, 200)}`);
      }

    } catch (error) {
      console.log(`   Auth Flow Error: ${error.message}`);
    }
  }

  async testWithDifferentHeaders() {
    console.log('\n🌐 Testing with Different Headers...');
    
    const headerVariations = [
      {
        name: 'Standard Headers',
        headers: {}
      },
      {
        name: 'Production-like Headers',
        headers: {
          'X-Forwarded-Proto': 'https',
          'X-Forwarded-Host': 'gear-score.com',
          'X-Real-IP': '1.2.3.4'
        }
      },
      {
        name: 'Nginx Proxy Headers',
        headers: {
          'X-Forwarded-Proto': 'https',
          'X-Forwarded-Host': 'gear-score.com',
          'X-Forwarded-For': '1.2.3.4',
          'X-Real-IP': '1.2.3.4',
          'Host': 'gear-score.com'
        }
      }
    ];

    for (const variation of headerVariations) {
      console.log(`\n   Testing: ${variation.name}`);
      
      try {
        const response = await this.makeRequest('/api/auth/session', {
          headers: variation.headers
        });
        console.log(`     Result: ${response.statusCode} ${this.getStatusText(response.statusCode)}`);
        
        if (response.statusCode >= 400) {
          console.log(`     Error: ${response.data.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`     Error: ${error.message}`);
      }
    }
  }

  async checkServerLogs() {
    console.log('\n📋 Checking Recent Server Activity...');
    
    // Make a request that should generate logs
    try {
      await this.makeRequest('/api/auth/session');
      console.log('   ✅ Test request sent to generate logs');
      console.log('   💡 Check PM2 logs with: pm2 logs gear-score --lines 10');
    } catch (error) {
      console.log(`   ❌ Failed to send test request: ${error.message}`);
    }
  }

  getStatusText(code) {
    const statusTexts = {
      200: 'OK',
      302: 'Redirect',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Rate Limited',
      500: 'Server Error',
      503: 'Service Unavailable'
    };
    return statusTexts[code] || 'Unknown';
  }

  async runFullTest() {
    console.log('🚀 Starting Local NextAuth Testing...');
    console.log(`Target: ${this.baseUrl}`);
    console.log('=' .repeat(50));
    
    try {
      await this.testBasicEndpoints();
      await this.testAuthFlow();
      await this.testWithDifferentHeaders();
      await this.checkServerLogs();
      
      console.log('\n' + '=' .repeat(50));
      console.log('✅ Local testing completed');
      console.log('💡 If issues persist, check:');
      console.log('   1. NextAuth configuration in pages/api/auth/[...nextauth].ts');
      console.log('   2. Environment variables in .env');
      console.log('   3. Database connectivity');
      console.log('   4. PM2 process logs');
      
    } catch (error) {
      console.error('\n❌ Testing failed:', error.message);
    }
  }
}

// Run test
if (require.main === module) {
  const tester = new LocalNextAuthTester();
  tester.runFullTest().catch(console.error);
}

module.exports = LocalNextAuthTester;