/**
 * VPS Environment Configuration Fix
 * Updates environment variables for proper VPS deployment
 */

const fs = require('fs');
const path = require('path');

// VPS Configuration
const VPS_CONFIG = {
  DOMAIN: 'gear-score.com',
  PORT: '5200',
  PROTOCOL: 'https'
};

function updateEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  console.log('🔧 Fixing VPS Environment Configuration...');
  
  try {
    // Check if .env exists
    if (!fs.existsSync(envPath)) {
      console.log('⚠️  .env file not found. Creating from .env.example...');
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ Created .env from .env.example');
      } else {
        console.log('❌ .env.example not found. Cannot create .env file.');
        return false;
      }
    }
    
    // Read current .env content
    let envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📖 Reading current .env file...');
    
    // Update NEXTAUTH_URL
    const correctNextAuthUrl = `${VPS_CONFIG.PROTOCOL}://${VPS_CONFIG.DOMAIN}`;
    if (envContent.includes('NEXTAUTH_URL=')) {
      envContent = envContent.replace(
        /NEXTAUTH_URL=.*/g,
        `NEXTAUTH_URL=${correctNextAuthUrl}`
      );
      console.log(`✅ Updated NEXTAUTH_URL to: ${correctNextAuthUrl}`);
    } else {
      envContent += `\nNEXTAUTH_URL=${correctNextAuthUrl}\n`;
      console.log(`✅ Added NEXTAUTH_URL: ${correctNextAuthUrl}`);
    }
    
    // Update NEXT_PUBLIC_BASE_URL
    if (envContent.includes('NEXT_PUBLIC_BASE_URL=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_BASE_URL=.*/g,
        `NEXT_PUBLIC_BASE_URL=${correctNextAuthUrl}`
      );
      console.log(`✅ Updated NEXT_PUBLIC_BASE_URL to: ${correctNextAuthUrl}`);
    } else {
      envContent += `\nNEXT_PUBLIC_BASE_URL=${correctNextAuthUrl}\n`;
      console.log(`✅ Added NEXT_PUBLIC_BASE_URL: ${correctNextAuthUrl}`);
    }
    
    // Add PORT if not exists
    if (!envContent.includes('PORT=')) {
      envContent += `\nPORT=${VPS_CONFIG.PORT}\n`;
      console.log(`✅ Added PORT: ${VPS_CONFIG.PORT}`);
    }
    
    // Add NODE_ENV if not exists
    if (!envContent.includes('NODE_ENV=')) {
      envContent += `\nNODE_ENV=production\n`;
      console.log('✅ Added NODE_ENV=production');
    }
    
    // Write updated content back to .env
    fs.writeFileSync(envPath, envContent);
    console.log('💾 Updated .env file successfully!');
    
    return true;
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    return false;
  }
}

function checkRequiredEnvVars() {
  console.log('\n🔍 Checking required environment variables...');
  
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'DATABASE_URL'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`) && !envContent.includes(`${varName}=`)) {
      console.log(`✅ ${varName} is configured`);
    } else {
      console.log(`❌ ${varName} is missing or not configured`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

function generateNextAuthSecret() {
  console.log('\n🔐 Checking NEXTAUTH_SECRET...');
  
  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if NEXTAUTH_SECRET needs to be generated
  if (!envContent.includes('NEXTAUTH_SECRET=') || envContent.includes('NEXTAUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2')) {
    const crypto = require('crypto');
    const newSecret = crypto.randomBytes(32).toString('base64');
    
    if (envContent.includes('NEXTAUTH_SECRET=')) {
      envContent = envContent.replace(
        /NEXTAUTH_SECRET=.*/g,
        `NEXTAUTH_SECRET=${newSecret}`
      );
    } else {
      envContent += `\nNEXTAUTH_SECRET=${newSecret}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Generated new NEXTAUTH_SECRET');
  } else {
    console.log('✅ NEXTAUTH_SECRET already configured');
  }
}

function showDiscordOAuthInstructions() {
  console.log('\n📋 Discord OAuth Configuration:');
  console.log('=' .repeat(50));
  console.log('1. Go to: https://discord.com/developers/applications');
  console.log('2. Select your application');
  console.log('3. Go to OAuth2 > General');
  console.log('4. Add these Redirect URIs:');
  console.log(`   - ${VPS_CONFIG.PROTOCOL}://${VPS_CONFIG.DOMAIN}/api/auth/callback/discord`);
  console.log(`   - ${VPS_CONFIG.PROTOCOL}://${VPS_CONFIG.DOMAIN}:${VPS_CONFIG.PORT}/api/auth/callback/discord`);
  console.log('5. Save changes');
  console.log('=' .repeat(50));
}

// Main function
async function fixVPSEnvironment() {
  console.log('🚀 VPS Environment Fix Tool');
  console.log(`Domain: ${VPS_CONFIG.DOMAIN}`);
  console.log(`Port: ${VPS_CONFIG.PORT}`);
  console.log(`Protocol: ${VPS_CONFIG.PROTOCOL}`);
  console.log('=' .repeat(50));
  
  // Step 1: Update .env file
  const envUpdated = updateEnvFile();
  if (!envUpdated) {
    console.log('❌ Failed to update .env file');
    return;
  }
  
  // Step 2: Generate NEXTAUTH_SECRET if needed
  generateNextAuthSecret();
  
  // Step 3: Check all required variables
  const allVarsPresent = checkRequiredEnvVars();
  
  // Step 4: Show Discord OAuth instructions
  showDiscordOAuthInstructions();
  
  console.log('\n🏁 Environment Fix Complete!');
  
  if (allVarsPresent) {
    console.log('✅ All environment variables are configured');
    console.log('💡 Next steps:');
    console.log('1. Restart your application (pm2 restart gear-score)');
    console.log('2. Test the payment flow');
    console.log('3. Check Discord OAuth settings if authentication fails');
  } else {
    console.log('⚠️  Some environment variables need attention');
    console.log('💡 Please configure missing variables in .env file');
  }
}

// Run if called directly
if (require.main === module) {
  fixVPSEnvironment().catch(console.error);
}

module.exports = { fixVPSEnvironment, VPS_CONFIG };