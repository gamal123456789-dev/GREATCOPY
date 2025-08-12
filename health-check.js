// Health Check Script
// Monitors login functionality

const http = require('http');

class LoginHealthCheck {
  async checkAuthEndpoints() {
    const endpoints = [
      '/api/auth/session',
      '/api/auth/csrf',
      '/api/auth/providers'
    ];

    console.log('🔍 Checking auth endpoints...');
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        const status = response.statusCode === 200 ? '✅' : '❌';
        console.log(`   ${status} ${endpoint}: ${response.statusCode}`);
      } catch (error) {
        console.log(`   ❌ ${endpoint}: ERROR - ${error.message}`);
      }
    }
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5200,
        path: path,
        method: 'GET',
        headers: {
          'Host': 'gear-score.com',
          'X-Forwarded-Proto': 'https'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      
      req.on('error', reject);
      req.end();
    });
  }

  async runHealthCheck() {
    console.log('🏥 Running Login Health Check...');
    console.log('=' .repeat(40));
    
    await this.checkAuthEndpoints();
    
    console.log('\n💡 If any endpoints show errors:');
    console.log('   1. Check PM2 logs: pm2 logs gear-score');
    console.log('   2. Restart the application: pm2 restart gear-score');
    console.log('   3. Check database connectivity');
    console.log('   4. Verify environment variables');
  }
}

if (require.main === module) {
  const healthCheck = new LoginHealthCheck();
  healthCheck.runHealthCheck().catch(console.error);
}

module.exports = LoginHealthCheck;