#!/usr/bin/env node
// Quick test script to verify Discord OAuth configuration after fix

require('dotenv').config();
const https = require('https');
const http = require('http');

console.log('🔍 Testing Discord OAuth Configuration After Fix\n');

// Test environment variables
console.log('📋 Environment Variables:');
console.log(`✅ DISCORD_CLIENT_ID: ${process.env.DISCORD_CLIENT_ID ? 'Set' : '❌ Missing'}`);
console.log(`✅ DISCORD_CLIENT_SECRET: ${process.env.DISCORD_CLIENT_SECRET ? 'Set' : '❌ Missing'}`);
console.log(`✅ NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '❌ Missing'}`);
console.log(`✅ NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'Set' : '❌ Missing'}\n`);

// Expected redirect URI
const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/discord`;
console.log('🔗 Expected Redirect URI in Discord Developer Portal:');
console.log(`   ${redirectUri}\n`);

// Test Discord OAuth authorization URL
const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify+email&prompt=consent`;

console.log('🧪 Testing Discord OAuth Authorization URL:');
console.log(`   ${authUrl}\n`);

// Test if Discord accepts our client_id and redirect_uri
https.get(authUrl, (res) => {
  console.log('📡 Discord OAuth Response:');
  console.log(`   Status: ${res.statusCode}`);
  
  if (res.statusCode === 302 || res.statusCode === 200) {
    console.log('   ✅ Discord OAuth endpoint is accessible');
    if (res.headers.location) {
      console.log(`   🔄 Redirected to: ${res.headers.location}`);
    }
  } else {
    console.log('   ❌ Discord OAuth endpoint returned error');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Make sure you added the redirect URI in Discord Developer Portal:');
  console.log(`   ${redirectUri}`);
  console.log('2. Test login at: https://gear-score.com/auth');
  console.log('3. Check PM2 logs: pm2 logs gear-score --lines 10');
  
}).on('error', (err) => {
  console.log('❌ Error testing Discord OAuth:', err.message);
});

// Test local NextAuth endpoint
const localUrl = `${process.env.NEXTAUTH_URL}/api/auth/signin/discord`;
console.log('🏠 Testing Local NextAuth Discord Endpoint:');
console.log(`   ${localUrl}\n`);

const client = process.env.NEXTAUTH_URL.startsWith('https') ? https : http;

client.get(localUrl, (res) => {
  console.log('🏠 Local NextAuth Response:');
  console.log(`   Status: ${res.statusCode}`);
  
  if (res.statusCode === 302) {
    console.log('   ✅ NextAuth Discord provider is working');
    if (res.headers.location) {
      console.log(`   🔄 Redirected to: ${res.headers.location}`);
    }
  } else {
    console.log('   ❌ NextAuth Discord provider has issues');
  }
  
}).on('error', (err) => {
  console.log('❌ Error testing local NextAuth:', err.message);
});

setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 SUMMARY:');
  console.log('If you see ✅ for all tests above, Discord OAuth should work.');
  console.log('If you see ❌, check the Discord Developer Portal settings.');
  console.log('='.repeat(60));
}, 2000);