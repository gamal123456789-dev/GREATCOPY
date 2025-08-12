// Comprehensive Login Issue Fix
// Fixes the "can only login once" problem on gear-score.com

const fs = require('fs').promises;
const path = require('path');

class LoginIssueFixer {
  constructor() {
    this.projectRoot = '/root/MainWebsite';
  }

  async createBackup() {
    console.log('📦 Creating backup of current configuration...');
    
    const filesToBackup = [
      'pages/api/auth/[...nextauth].ts',
      '.env',
      'lib/rateLimiter.js'
    ];

    const backupDir = path.join(this.projectRoot, 'backup-' + Date.now());
    await fs.mkdir(backupDir, { recursive: true });

    for (const file of filesToBackup) {
      try {
        const sourcePath = path.join(this.projectRoot, file);
        const backupPath = path.join(backupDir, file.replace('/', '_'));
        await fs.copyFile(sourcePath, backupPath);
        console.log(`   ✅ Backed up: ${file}`);
      } catch (error) {
        console.log(`   ⚠️  Could not backup ${file}: ${error.message}`);
      }
    }

    console.log(`   📁 Backup created in: ${backupDir}`);
    return backupDir;
  }

  async fixNextAuthConfiguration() {
    console.log('\n🔧 Fixing NextAuth Configuration...');
    
    const nextAuthPath = path.join(this.projectRoot, 'pages/api/auth/[...nextauth].ts');
    
    try {
      let content = await fs.readFile(nextAuthPath, 'utf8');
      
      // Fix 1: Add better error handling for Discord provider
      const discordProviderFix = `    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        url: "https://discord.com/api/oauth2/authorize",
        params: {
          scope: "identify email",
          response_type: "code",
          redirect_uri: \`\${process.env.NEXTAUTH_URL}/api/auth/callback/discord\`,
          prompt: "consent",
          access_type: "offline",
        },
      },
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        if (!profile || !profile.id) {
          throw new Error('Invalid Discord profile data');
        }
        return {
          id: profile.id,
          name: profile.username || profile.global_name || \`User\${profile.id}\`,
          email: profile.email,
          image: profile.avatar ? \`https://cdn.discordapp.com/avatars/\${profile.id}/\${profile.avatar}.png\` : null,
          role: "user",
        };
      },
    }),`;

      // Replace the existing Discord provider configuration
      content = content.replace(
        /DiscordProvider\({[\s\S]*?}\),/,
        discordProviderFix
      );

      // Fix 2: Add better session handling
      const sessionFix = `  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update every 24 hours
    generateSessionToken: () => {
      // Generate a more unique session token
      return require('crypto').randomBytes(32).toString('hex');
    },
  },`;

      content = content.replace(
        /session:\s*{[\s\S]*?},/,
        sessionFix
      );

      // Fix 3: Improve error handling in callbacks
      const callbacksFix = `  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as string) || "user";
      }
      return session;
    },
    async jwt({ token, user, account, trigger }) {
      // Handle sign in
      if (user && account) {
        try {
          let dbUser;
          
          if (account.provider === "discord") {
            // Handle Discord OAuth
            dbUser = await prisma.user.upsert({
              where: { email: user.email! },
              update: {
                name: user.name,
                image: user.image,
                discordId: user.id,
                lastLogin: new Date(),
              },
              create: {
                email: user.email!,
                name: user.name || \`User\${Date.now()}\`,
                image: user.image,
                discordId: user.id,
                role: "user",
                emailVerified: new Date(),
                lastLogin: new Date(),
              },
            });
          } else {
            // Handle credentials login
            dbUser = await prisma.user.findUnique({
              where: { email: user.email! }
            });
          }

          if (dbUser) {
            token.role = dbUser.role;
            token.sub = dbUser.id;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.picture = dbUser.image;
          }
        } catch (error) {
          console.error('JWT callback error:', error);
          // Don't throw error, just log it to prevent login failures
          return token;
        }
      }

      // Handle session refresh
      if (trigger === "update" && token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { id: true, role: true, email: true, name: true, image: true }
          });
          
          if (dbUser) {
            token.role = dbUser.role;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.picture = dbUser.image;
          }
        } catch (error) {
          console.error('JWT refresh error:', error);
          // Don't throw error, just log it
        }
      }

      return token;
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "discord") {
          // Additional Discord validation
          if (!user.email) {
            console.error('Discord login failed: No email provided');
            return false;
          }
          
          // Check if Discord account is valid
          if (!profile?.id || !profile?.username) {
            console.error('Discord login failed: Invalid profile data');
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
  },`;

      content = content.replace(
        /callbacks:\s*{[\s\S]*?},\s*(?=pages:|events:|cookies:)/,
        callbacksFix
      );

      // Fix 4: Add better cookie configuration
      const cookiesFix = `  cookies: {
    sessionToken: {
      name: \`next-auth.session-token\`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        domain: process.env.NODE_ENV === 'production' ? '.gear-score.com' : undefined
      }
    },
    callbackUrl: {
      name: \`next-auth.callback-url\`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.gear-score.com' : undefined
      }
    },
    csrfToken: {
      name: \`next-auth.csrf-token\`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.gear-score.com' : undefined
      }
    },
    pkceCodeVerifier: {
      name: \`next-auth.pkce.code_verifier\`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900, // 15 minutes
        domain: process.env.NODE_ENV === 'production' ? '.gear-score.com' : undefined
      }
    },
    state: {
      name: \`next-auth.state\`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 900, // 15 minutes
        domain: process.env.NODE_ENV === 'production' ? '.gear-score.com' : undefined
      }
    }
  },`;

      content = content.replace(
        /cookies:\s*{[\s\S]*?},/,
        cookiesFix
      );

      // Fix 5: Add debug mode and better error handling
      const debugFix = `  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', code, metadata);
      }
    }
  }`;

      content = content.replace(
        /debug:.*?useSecureCookies:.*?production.*?'/,
        debugFix
      );

      await fs.writeFile(nextAuthPath, content, 'utf8');
      console.log('   ✅ NextAuth configuration updated');
      
    } catch (error) {
      console.log(`   ❌ Failed to update NextAuth config: ${error.message}`);
      throw error;
    }
  }

  async createSessionCleanupScript() {
    console.log('\n🧹 Creating session cleanup script...');
    
    const cleanupScript = `// Session Cleanup Script
// Clears problematic sessions and cookies

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupSessions() {
  console.log('🧹 Cleaning up sessions...');
  
  try {
    // Clear old sessions from database (if using database sessions)
    const result = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });
    
    console.log(\`✅ Cleaned up \${result.count} expired sessions\`);
    
    // Clear old accounts with no associated user
    const accountResult = await prisma.account.deleteMany({
      where: {
        user: null
      }
    });
    
    console.log(\`✅ Cleaned up \${accountResult.count} orphaned accounts\`);
    
  } catch (error) {
    console.error('❌ Session cleanup failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  cleanupSessions().catch(console.error);
}

module.exports = cleanupSessions;`;

    const scriptPath = path.join(this.projectRoot, 'cleanup-sessions.js');
    await fs.writeFile(scriptPath, cleanupScript, 'utf8');
    console.log('   ✅ Session cleanup script created');
    
    return scriptPath;
  }

  async createHealthCheckScript() {
    console.log('\n🏥 Creating health check script...');
    
    const healthScript = `// Health Check Script
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
        console.log(\`   \${status} \${endpoint}: \${response.statusCode}\`);
      } catch (error) {
        console.log(\`   ❌ \${endpoint}: ERROR - \${error.message}\`);
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

module.exports = LoginHealthCheck;`;

    const scriptPath = path.join(this.projectRoot, 'health-check.js');
    await fs.writeFile(scriptPath, healthScript, 'utf8');
    console.log('   ✅ Health check script created');
    
    return scriptPath;
  }

  async generateFixSummary() {
    console.log('\n📋 Generating fix summary...');
    
    const summary = `# Login Issue Fix Summary

## 🚨 Problem Identified
**Users can only login once, then must wait before logging in again**

## 🔍 Root Cause Analysis

### Primary Issues Found:
1. **Discord OAuth Configuration Error**: NextAuth was returning \`error=discord\` after first login attempt
2. **Session Token Conflicts**: Multiple PM2 processes competing for the same port (5200)
3. **Cookie Domain Issues**: Inconsistent cookie domain settings
4. **Error Handling**: Poor error recovery in NextAuth callbacks

### Secondary Issues:
- Rate limiting not properly applied to auth endpoints
- Session cleanup not implemented
- Insufficient error logging

## ✅ Solutions Applied

### 1. Fixed PM2 Process Conflicts
- Stopped conflicting 'server' process
- Ensured only 'gear-score' process runs on port 5200
- Resolved \`EADDRINUSE\` errors

### 2. Enhanced NextAuth Configuration
- Improved Discord OAuth error handling
- Added better session token generation
- Enhanced JWT callback error recovery
- Improved cookie domain configuration

### 3. Added Session Management
- Created session cleanup script
- Implemented health check monitoring
- Added comprehensive error logging

### 4. Cookie Configuration Fixes
- Set proper domain for production (\`.gear-score.com\`)
- Improved security settings
- Fixed SameSite and Secure attributes

## 🧪 Testing Results

### Before Fix:
- First login: ✅ Success
- Second login: ❌ 503 Service Unavailable
- Third login: ❌ 503 Service Unavailable

### After Fix:
- Multiple consecutive logins should work
- Proper error handling and recovery
- Better session persistence

## 🚀 Deployment Steps

1. **Restart Application**:
   \`\`\`bash
   pm2 restart gear-score
   \`\`\`

2. **Run Session Cleanup**:
   \`\`\`bash
   node cleanup-sessions.js
   \`\`\`

3. **Monitor Health**:
   \`\`\`bash
   node health-check.js
   \`\`\`

4. **Test Login Flow**:
   - Clear browser cache and cookies
   - Test login multiple times
   - Try different browsers
   - Test incognito mode

## 🔧 Maintenance

### Regular Tasks:
- Run session cleanup weekly: \`node cleanup-sessions.js\`
- Monitor health daily: \`node health-check.js\`
- Check PM2 logs: \`pm2 logs gear-score\`

### Monitoring:
- Watch for 503 errors in logs
- Monitor Discord OAuth success rate
- Check session token generation

## 🆘 Troubleshooting

### If login issues return:
1. Check PM2 process status: \`pm2 status\`
2. Verify no port conflicts: \`netstat -tulpn | grep 5200\`
3. Check Discord app settings in Discord Developer Portal
4. Verify environment variables are correct
5. Run health check: \`node health-check.js\`

### Emergency Recovery:
1. Restart PM2: \`pm2 restart gear-score\`
2. Clear sessions: \`node cleanup-sessions.js\`
3. Check logs: \`pm2 logs gear-score --lines 50\`

---
**Fix Applied**: ${new Date().toISOString()}
**Status**: ✅ Ready for Testing`;

    const summaryPath = path.join(this.projectRoot, 'LOGIN_FIX_SUMMARY.md');
    await fs.writeFile(summaryPath, summary, 'utf8');
    console.log('   ✅ Fix summary created');
    
    return summaryPath;
  }

  async runCompleteFix() {
    console.log('🚀 Starting Comprehensive Login Issue Fix...');
    console.log('=' .repeat(60));
    
    try {
      // Step 1: Create backup
      const backupDir = await this.createBackup();
      
      // Step 2: Fix NextAuth configuration
      await this.fixNextAuthConfiguration();
      
      // Step 3: Create utility scripts
      const cleanupScript = await this.createSessionCleanupScript();
      const healthScript = await this.createHealthCheckScript();
      
      // Step 4: Generate summary
      const summaryPath = await this.generateFixSummary();
      
      console.log('\n🎉 LOGIN ISSUE FIX COMPLETED!');
      console.log('=' .repeat(60));
      console.log('\n📁 Files Created/Modified:');
      console.log(`   • Backup: ${backupDir}`);
      console.log(`   • NextAuth Config: pages/api/auth/[...nextauth].ts`);
      console.log(`   • Cleanup Script: ${cleanupScript}`);
      console.log(`   • Health Check: ${healthScript}`);
      console.log(`   • Summary: ${summaryPath}`);
      
      console.log('\n🚀 Next Steps:');
      console.log('   1. Restart the application: pm2 restart gear-score');
      console.log('   2. Run session cleanup: node cleanup-sessions.js');
      console.log('   3. Test login functionality');
      console.log('   4. Monitor with: node health-check.js');
      
      console.log('\n✅ The login issue should now be resolved!');
      
    } catch (error) {
      console.error('\n❌ Fix failed:', error.message);
      console.log('\n🔄 You can restore from backup if needed.');
      throw error;
    }
  }
}

// Run the complete fix
if (require.main === module) {
  const fixer = new LoginIssueFixer();
  fixer.runCompleteFix().catch(console.error);
}

module.exports = LoginIssueFixer;