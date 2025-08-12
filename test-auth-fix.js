// Test Authentication Fixes
// Run this file to test the authentication system

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Authentication Fixes...');
console.log('=' .repeat(50));

// Test 1: Check environment variables
console.log('\n1. Environment Variables Check:');
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DATABASE_URL'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)) {
      console.log(`✅ ${varName} is configured`);
    } else {
      console.log(`❌ ${varName} is missing or not configured`);
    }
  });
} else {
  console.log('❌ .env file not found');
}

// Test 2: Check NextAuth configuration
console.log('\n2. NextAuth Configuration Check:');
const nextAuthPath = path.join(process.cwd(), 'pages/api/auth/[...nextauth].ts');
if (fs.existsSync(nextAuthPath)) {
  const nextAuthContent = fs.readFileSync(nextAuthPath, 'utf8');
  
  // Check for Discord provider
  if (nextAuthContent.includes('DiscordProvider')) {
    console.log('✅ Discord provider is configured');
  } else {
    console.log('❌ Discord provider is missing');
  }
  
  // Check for JWT strategy
  if (nextAuthContent.includes('strategy: "jwt"')) {
    console.log('✅ JWT strategy is configured');
  } else {
    console.log('❌ JWT strategy is missing');
  }
  
  // Check for proper cookies configuration
  if (nextAuthContent.includes('useSecureCookies: process.env.NODE_ENV === \'production\'')) {
    console.log('✅ Secure cookies are configured');
  } else {
    console.log('❌ Secure cookies are not configured');
  }
} else {
  console.log('❌ NextAuth configuration file not found');
}

// Test 3: Check package.json dependencies
console.log('\n3. Dependencies Check:');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = [
    'next-auth',
    '@next-auth/prisma-adapter',
    'bcrypt',
    'uuid'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageContent.dependencies && packageContent.dependencies[dep]) {
      console.log(`✅ ${dep} is installed`);
    } else if (packageContent.devDependencies && packageContent.devDependencies[dep]) {
      console.log(`✅ ${dep} is installed (dev dependency)`);
    } else {
      console.log(`❌ ${dep} is missing`);
    }
  });
} else {
  console.log('❌ package.json not found');
}

// Test 4: Check Prisma schema
console.log('\n4. Database Schema Check:');
const prismaPath = path.join(process.cwd(), 'prisma/schema.prisma');
if (fs.existsSync(prismaPath)) {
  const prismaContent = fs.readFileSync(prismaPath, 'utf8');
  
  if (prismaContent.includes('model User')) {
    console.log('✅ User model is defined');
  } else {
    console.log('❌ User model is missing');
  }
  
  if (prismaContent.includes('emailVerified')) {
    console.log('✅ emailVerified field is defined');
  } else {
    console.log('❌ emailVerified field is missing');
  }
  
  if (prismaContent.includes('role')) {
    console.log('✅ role field is defined');
  } else {
    console.log('❌ role field is missing');
  }
} else {
  console.log('❌ Prisma schema not found');
}

console.log('\n' + '=' .repeat(50));
console.log('🏁 Authentication Fix Test Complete!');
console.log('\n💡 Next Steps:');
console.log('1. Make sure all environment variables are set correctly');
console.log('2. Restart your application: pm2 restart gear-score');
console.log('3. Test Discord login at: https://gear-score.com/auth');
console.log('4. Test email login at: https://gear-score.com/auth');
console.log('5. Check server logs for any errors');

// Test 5: Check if server is running
console.log('\n5. Server Status Check:');
exec('pm2 list', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ PM2 not found or not running');
    return;
  }
  
  if (stdout.includes('gear-score')) {
    console.log('✅ gear-score application is running');
    
    if (stdout.includes('online')) {
      console.log('✅ Application status: online');
    } else {
      console.log('⚠️  Application status: not online');
    }
  } else {
    console.log('❌ gear-score application is not running');
  }
});
