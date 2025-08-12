// Test Discord OAuth flow configuration
const fetch = require('node-fetch');
require('dotenv').config();

async function testDiscordOAuthFlow() {
  console.log('🧪 Testing Discord OAuth Flow Configuration\n');
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  try {
    // Test 1: Check NextAuth providers endpoint
    console.log('1️⃣ Testing NextAuth providers endpoint...');
    const providersResponse = await fetch(`${baseUrl}/api/auth/providers`);
    const providers = await providersResponse.json();
    
    if (providers.discord) {
      console.log('✅ Discord provider is configured');
      console.log(`   Provider ID: ${providers.discord.id}`);
      console.log(`   Provider Name: ${providers.discord.name}`);
    } else {
      console.log('❌ Discord provider not found');
      return;
    }
    
    // Test 2: Check CSRF token endpoint
    console.log('\n2️⃣ Testing CSRF token endpoint...');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrf = await csrfResponse.json();
    
    if (csrf.csrfToken) {
      console.log('✅ CSRF token endpoint working');
    } else {
      console.log('❌ CSRF token endpoint failed');
    }
    
    // Test 3: Verify redirect URI configuration
    console.log('\n3️⃣ Verifying redirect URI configuration...');
    const expectedRedirectUri = `${baseUrl}/api/auth/callback/discord`;
    console.log(`Expected redirect URI: ${expectedRedirectUri}`);
    
    // Test 4: Check session endpoint
    console.log('\n4️⃣ Testing session endpoint...');
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
    const session = await sessionResponse.json();
    
    if (sessionResponse.ok) {
      console.log('✅ Session endpoint working');
      console.log(`   Current user: ${session.user ? session.user.email : 'Not logged in'}`);
    } else {
      console.log('❌ Session endpoint failed');
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Make sure Discord Developer Portal has this redirect URI:');
    console.log(`   ${expectedRedirectUri}`);
    console.log('2. Go to: http://localhost:3000/auth');
    console.log('3. Click "Login with Discord"');
    console.log('4. You should be redirected to Discord, then back to your app');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure your development server is running on port 3000');
    console.log('- Check your .env file configuration');
    console.log('- Verify Discord OAuth credentials');
  }
}

// Run the test
if (require.main === module) {
  testDiscordOAuthFlow();
}

module.exports = { testDiscordOAuthFlow };