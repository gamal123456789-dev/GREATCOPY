// Discord OAuth Diagnostic Tool
// Diagnoses Discord OAuth configuration issues

const https = require('https');
const http = require('http');
const { URL } = require('url');
require('dotenv').config();

class DiscordOAuthDiagnostic {
  constructor() {
    this.discordClientId = process.env.DISCORD_CLIENT_ID;
    this.discordClientSecret = process.env.DISCORD_CLIENT_SECRET;
    this.nextAuthUrl = process.env.NEXTAUTH_URL;
  }

  async makeHttpsRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'DiscordOAuthDiagnostic/1.0',
          'Accept': 'application/json',
          ...options.headers
        }
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
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

  checkEnvironmentVariables() {
    console.log('🔍 1. Checking Environment Variables...');
    
    const requiredVars = {
      'DISCORD_CLIENT_ID': this.discordClientId,
      'DISCORD_CLIENT_SECRET': this.discordClientSecret,
      'NEXTAUTH_URL': this.nextAuthUrl
    };

    let allValid = true;
    
    for (const [varName, value] of Object.entries(requiredVars)) {
      if (!value) {
        console.log(`   ❌ ${varName}: Missing`);
        allValid = false;
      } else {
        const displayValue = varName.includes('SECRET') 
          ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
          : value;
        console.log(`   ✅ ${varName}: ${displayValue}`);
      }
    }

    if (!allValid) {
      console.log('   ⚠️  Some environment variables are missing!');
      return false;
    }

    // Validate NEXTAUTH_URL format
    try {
      new URL(this.nextAuthUrl);
      console.log('   ✅ NEXTAUTH_URL format is valid');
    } catch (error) {
      console.log(`   ❌ NEXTAUTH_URL format is invalid: ${error.message}`);
      allValid = false;
    }

    return allValid;
  }

  async testDiscordAPI() {
    console.log('\n🔍 2. Testing Discord API Connectivity...');
    
    try {
      // Test Discord API endpoint
      const response = await this.makeHttpsRequest('https://discord.com/api/v10/applications/@me', {
        headers: {
          'Authorization': `Bot ${this.discordClientSecret}` // This will fail, but we can check connectivity
        }
      });
      
      console.log(`   Discord API Response: ${response.statusCode}`);
      
      if (response.statusCode === 401) {
        console.log('   ✅ Discord API is reachable (401 expected with invalid token)');
        return true;
      } else if (response.statusCode === 200) {
        console.log('   ✅ Discord API is reachable and responding');
        return true;
      } else {
        console.log(`   ⚠️  Unexpected response: ${response.data}`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Discord API connectivity failed: ${error.message}`);
      return false;
    }
  }

  validateOAuthConfiguration() {
    console.log('\n🔍 3. Validating OAuth Configuration...');
    
    const redirectUri = `${this.nextAuthUrl}/api/auth/callback/discord`;
    console.log(`   Expected Redirect URI: ${redirectUri}`);
    
    // Check if client ID looks valid (should be a snowflake ID)
    if (this.discordClientId && /^\d{17,19}$/.test(this.discordClientId)) {
      console.log('   ✅ Discord Client ID format looks valid');
    } else {
      console.log('   ❌ Discord Client ID format is invalid (should be 17-19 digits)');
      return false;
    }

    // Check if client secret looks valid
    if (this.discordClientSecret && this.discordClientSecret.length >= 32) {
      console.log('   ✅ Discord Client Secret length looks valid');
    } else {
      console.log('   ❌ Discord Client Secret is too short (should be at least 32 characters)');
      return false;
    }

    console.log('\n   📋 Discord Application Settings Checklist:');
    console.log('   □ Redirect URI in Discord app matches:', redirectUri);
    console.log('   □ OAuth2 scopes include: identify, email');
    console.log('   □ Application is not in development mode (if in production)');
    console.log('   □ Bot permissions are correctly set (if using bot features)');
    
    return true;
  }

  async testOAuthFlow() {
    console.log('\n🔍 4. Testing OAuth Flow...');
    
    try {
      // Test the authorization URL construction
      const authUrl = new URL('https://discord.com/api/oauth2/authorize');
      authUrl.searchParams.set('client_id', this.discordClientId);
      authUrl.searchParams.set('redirect_uri', `${this.nextAuthUrl}/api/auth/callback/discord`);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'identify email');
      authUrl.searchParams.set('prompt', 'consent');
      
      console.log('   ✅ OAuth Authorization URL constructed:');
      console.log(`     ${authUrl.toString()}`);
      
      // Test if the authorization endpoint is reachable
      const response = await this.makeHttpsRequest(authUrl.toString());
      
      if (response.statusCode === 200) {
        console.log('   ✅ Discord OAuth endpoint is reachable');
        
        // Check if the response contains expected Discord OAuth page elements
        if (response.data.includes('discord') || response.data.includes('oauth') || response.data.includes('authorize')) {
          console.log('   ✅ Response appears to be Discord OAuth page');
        } else {
          console.log('   ⚠️  Response doesn\'t look like Discord OAuth page');
        }
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        console.log(`   ✅ Discord OAuth endpoint redirected (${response.statusCode})`);
        console.log(`     Location: ${response.headers.location}`);
      } else {
        console.log(`   ❌ Unexpected response from Discord OAuth: ${response.statusCode}`);
        console.log(`     Response: ${response.data.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ OAuth flow test failed: ${error.message}`);
      return false;
    }
    
    return true;
  }

  async testLocalNextAuthEndpoint() {
    console.log('\n🔍 5. Testing Local NextAuth Discord Endpoint...');
    
    try {
      const response = await this.makeHttpsRequest('http://localhost:5200/api/auth/signin/discord', {
        headers: {
          'Host': 'gear-score.com',
          'X-Forwarded-Proto': 'https',
          'X-Forwarded-Host': 'gear-score.com'
        }
      });
      
      console.log(`   Local Discord signin: ${response.statusCode}`);
      
      if (response.statusCode === 302) {
        const location = response.headers.location;
        console.log(`   ✅ Redirecting to: ${location}`);
        
        if (location && location.includes('discord.com')) {
          console.log('   ✅ Redirect points to Discord (OAuth working)');
        } else if (location && location.includes('error=discord')) {
          console.log('   ❌ Error in Discord configuration detected');
          console.log('   💡 Check Discord app settings and credentials');
        } else {
          console.log(`   ⚠️  Unexpected redirect: ${location}`);
        }
      } else {
        console.log(`   ❌ Unexpected response: ${response.data.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Local endpoint test failed: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 DISCORD OAUTH DIAGNOSTIC REPORT');
    console.log('=' .repeat(60));
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('\n1. 🎯 Discord Application Settings:');
    console.log('   • Go to https://discord.com/developers/applications');
    console.log(`   • Select your application (ID: ${this.discordClientId})`);
    console.log('   • Go to OAuth2 → General');
    console.log(`   • Add redirect URI: ${this.nextAuthUrl}/api/auth/callback/discord`);
    console.log('   • Ensure scopes include: identify, email');
    
    console.log('\n2. 🔐 Environment Variables:');
    console.log('   • Verify DISCORD_CLIENT_ID matches your Discord app');
    console.log('   • Verify DISCORD_CLIENT_SECRET is correct and not expired');
    console.log('   • Ensure NEXTAUTH_URL matches your production domain');
    
    console.log('\n3. 🌐 Domain Configuration:');
    console.log('   • Ensure your domain SSL certificate is valid');
    console.log('   • Check that your domain resolves correctly');
    console.log('   • Verify Nginx/proxy configuration if applicable');
    
    console.log('\n4. 🚀 Testing Steps:');
    console.log('   • Test login in incognito/private browser');
    console.log('   • Clear browser cache and cookies');
    console.log('   • Try different browsers');
    console.log('   • Check browser developer console for errors');
    
    console.log('\n5. 🔍 Debug Mode:');
    console.log('   • Temporarily enable NextAuth debug mode');
    console.log('   • Check PM2 logs during login attempts');
    console.log('   • Monitor network requests in browser dev tools');
    
    console.log('\n' + '=' .repeat(60));
  }

  async runFullDiagnostic() {
    console.log('🚀 Starting Discord OAuth Diagnostic...');
    console.log('=' .repeat(50));
    
    try {
      const envValid = this.checkEnvironmentVariables();
      
      if (!envValid) {
        console.log('\n❌ Environment variables are not properly configured.');
        console.log('Please fix environment variables before proceeding.');
        return;
      }
      
      await this.testDiscordAPI();
      this.validateOAuthConfiguration();
      await this.testOAuthFlow();
      await this.testLocalNextAuthEndpoint();
      
      this.generateReport();
      
    } catch (error) {
      console.error('\n❌ Diagnostic failed:', error.message);
    }
  }
}

// Run diagnostic
if (require.main === module) {
  const diagnostic = new DiscordOAuthDiagnostic();
  diagnostic.runFullDiagnostic().catch(console.error);
}

module.exports = DiscordOAuthDiagnostic;