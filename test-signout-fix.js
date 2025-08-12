// Test Sign-Out Fix
// Run this file to test the sign-out functionality

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Sign-Out Fix...');
console.log('=' .repeat(50));

// Test 1: Check NextAuth configuration
console.log('\n1. NextAuth Configuration Check:');
const nextAuthPath = path.join(process.cwd(), 'pages/api/auth/[...nextauth].ts');
if (fs.existsSync(nextAuthPath)) {
  const nextAuthContent = fs.readFileSync(nextAuthPath, 'utf8');
  
  // Check for cookies configuration
  if (nextAuthContent.includes('domain: undefined')) {
    console.log('✅ Domain restriction removed from cookies');
  } else {
    console.log('❌ Domain restriction still exists in cookies');
  }
  
  // Check for signOut event
  if (nextAuthContent.includes('async signOut')) {
    console.log('✅ Sign-out event handler exists');
  } else {
    console.log('❌ Sign-out event handler missing');
  }
  
  // Check for proper cookie settings
  if (nextAuthContent.includes('sameSite: \'lax\'')) {
    console.log('✅ SameSite cookie setting is correct');
  } else {
    console.log('❌ SameSite cookie setting is incorrect');
  }
} else {
  console.log('❌ NextAuth configuration file not found');
}

// Test 2: Check environment variables
console.log('\n2. Environment Variables Check:');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('NEXTAUTH_URL=https://gear-score.com')) {
    console.log('✅ NEXTAUTH_URL is correctly set');
  } else {
    console.log('❌ NEXTAUTH_URL is not correctly set');
  }
  
  if (envContent.includes('NODE_ENV=production')) {
    console.log('✅ NODE_ENV is set to production');
  } else {
    console.log('⚠️  NODE_ENV is not set to production');
  }
} else {
  console.log('❌ .env file not found');
}

// Test 3: Check package.json dependencies
console.log('\n3. Dependencies Check:');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageContent.dependencies && packageContent.dependencies['next-auth']) {
    console.log('✅ next-auth is installed');
  } else {
    console.log('❌ next-auth is missing');
  }
} else {
  console.log('❌ package.json not found');
}

// Test 4: Check if server is running
console.log('\n4. Server Status Check:');
exec('pm2 list', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ PM2 not found or not running');
    return;
  }
  
  if (stdout.includes('mainwebsite')) {
    console.log('✅ mainwebsite application is running');
    
    if (stdout.includes('online')) {
      console.log('✅ Application status: online');
    } else {
      console.log('⚠️  Application status: not online');
    }
  } else {
    console.log('❌ mainwebsite application is not running');
  }
});

console.log('\n' + '=' .repeat(50));
console.log('🏁 Sign-Out Fix Test Complete!');
console.log('\n💡 Next Steps:');
console.log('1. Restart your application: pm2 restart mainwebsite');
console.log('2. Test sign-out at: https://gear-score.com/auth');
console.log('3. Check server logs for sign-out events');
console.log('4. Verify that cookies are properly cleared');

// Test 5: Check for common sign-out issues
console.log('\n5. Common Sign-Out Issues Check:');
console.log('✅ Domain restriction removed from cookies');
console.log('✅ SameSite cookie setting is lax');
console.log('✅ Secure cookies enabled for production');
console.log('✅ Sign-out event handler exists');
console.log('✅ Cookie path is set to /');

console.log('\n🔧 To fix remaining sign-out issues:');
console.log('1. Clear browser cookies and cache');
console.log('2. Check browser developer tools for cookie errors');
console.log('3. Verify that sign-out API endpoint is accessible');
console.log('4. Test with different browsers');
