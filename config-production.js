const fs = require('fs');
const path = require('path');

console.log('🌐 Configuring for PRODUCTION...');

const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Update for production
envContent = envContent
  .replace(/NEXTAUTH_URL=.*/g, 'NEXTAUTH_URL=https://gear-score.com')
  .replace(/NEXT_PUBLIC_BASE_URL=.*/g, 'NEXT_PUBLIC_BASE_URL=https://gear-score.com')
  .replace(/NEXT_PUBLIC_WEBSOCKET_URL=.*/g, 'NEXT_PUBLIC_WEBSOCKET_URL=wss://gear-score.com')
  .replace(/NODE_ENV=.*/g, 'NODE_ENV=production');

fs.writeFileSync(envPath, envContent);
console.log('✅ Configured for production');
console.log('📧 Email verification: ENABLED');
console.log('🔐 Immediate login: DISABLED');
