const fs = require('fs');
const path = require('path');

console.log('🏠 Configuring for LOCAL DEVELOPMENT...');

const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Update for local development
envContent = envContent
  .replace(/NEXTAUTH_URL=.*/g, 'NEXTAUTH_URL=http://localhost:3000')
  .replace(/NEXT_PUBLIC_BASE_URL=.*/g, 'NEXT_PUBLIC_BASE_URL=http://localhost:3000')
  .replace(/NEXT_PUBLIC_WEBSOCKET_URL=.*/g, 'NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000')
  .replace(/NODE_ENV=.*/g, 'NODE_ENV=development');

fs.writeFileSync(envPath, envContent);
console.log('✅ Configured for local development');
console.log('📧 Email verification: DISABLED');
console.log('🔐 Immediate login: ENABLED');
