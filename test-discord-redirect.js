// Test script to check Discord OAuth redirect URL configuration
require('dotenv').config();

console.log('🔍 Environment Variables Check:');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID ? 'Set' : 'Not set');
console.log('DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET ? 'Set' : 'Not set');

console.log('\n🔗 Expected Discord OAuth Redirect URI:');
const expectedRedirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/discord`;
console.log(expectedRedirectUri);

console.log('\n✅ For local development, this should be:');
console.log('http://localhost:3000/api/auth/callback/discord');

console.log('\n⚠️  If the expected redirect URI above is not localhost:3000,');
console.log('then your .env file has the wrong NEXTAUTH_URL value.');

console.log('\n📋 Discord Developer Portal should have these redirect URIs:');
console.log('- http://localhost:3000/api/auth/callback/discord (for local dev)');
console.log('- https://gear-score.com/api/auth/callback/discord (for production)');