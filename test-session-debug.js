const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSessionDebug() {
  try {
    console.log('🔍 Testing session and authentication flow...');
    
    // Test 1: Check admin users in database
    console.log('\n1. Admin users in database:');
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, role: true, username: true }
    });
    
    adminUsers.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.email} (${admin.role})`);
    });
    
    // Test 2: Check NextAuth sessions table (if exists)
    console.log('\n2. Checking NextAuth sessions...');
    try {
      const sessions = await prisma.session.findMany({
        select: {
          id: true,
          userId: true,
          expires: true,
          user: {
            select: {
              email: true,
              role: true
            }
          }
        },
        where: {
          expires: {
            gt: new Date()
          }
        }
      });
      
      console.log(`   Found ${sessions.length} active sessions:`);
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. User: ${session.user.email} (${session.user.role})`);
        console.log(`       Expires: ${session.expires}`);
      });
    } catch (error) {
      console.log('   ❌ Sessions table not found or error:', error.message);
      console.log('   ℹ️  This is normal if using JWT strategy');
    }
    
    // Test 3: Check accounts table
    console.log('\n3. Checking user accounts...');
    try {
      const accounts = await prisma.account.findMany({
        select: {
          id: true,
          provider: true,
          user: {
            select: {
              email: true,
              role: true
            }
          }
        }
      });
      
      console.log(`   Found ${accounts.length} linked accounts:`);
      accounts.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.user.email} via ${account.provider} (${account.user.role})`);
      });
    } catch (error) {
      console.log('   ❌ Accounts table not found or error:', error.message);
    }
    
    // Test 4: Simulate NextAuth JWT flow
    console.log('\n4. Simulating NextAuth JWT flow:');
    const testAdmin = adminUsers[0];
    if (testAdmin) {
      console.log(`   Testing with admin: ${testAdmin.email}`);
      
      // Simulate what happens in JWT callback
      const mockUser = {
        email: testAdmin.email,
        role: testAdmin.role,
        username: testAdmin.username
      };
      
      console.log('   Mock user object:', mockUser);
      
      // Simulate UserContext logic
      const sessionUser = {
        id: testAdmin.id,
        username: testAdmin.username,
        email: testAdmin.email,
        role: testAdmin.role,
        isAdmin: testAdmin.role === 'ADMIN' || testAdmin.role === 'admin',
        emailVerified: true
      };
      
      console.log('   Processed session user:', sessionUser);
      console.log(`   Should have admin access: ${sessionUser.isAdmin && sessionUser.role === 'ADMIN'}`);
    }
    
    console.log('\n✅ Session debug test completed!');
    
  } catch (error) {
    console.error('❌ Error in session debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSessionDebug();