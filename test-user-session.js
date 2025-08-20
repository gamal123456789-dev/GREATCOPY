const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserSession() {
  console.log('🔍 Testing User Session and Admin Access');
  console.log('=' .repeat(50));
  
  try {
    // 1. Check admin users in database
    console.log('\n1️⃣ Checking admin users in database:');
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'admin' }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ID: ${user.id}`);
    });
    
    // 2. Check active sessions
    console.log('\n2️⃣ Checking active sessions:');
    const activeSessions = await prisma.session.findMany({
      where: {
        expires: {
          gt: new Date()
        }
      },
      include: {
        User: {
          select: {
            email: true,
            role: true,
            username: true
          }
        }
      }
    });
    
    console.log(`Found ${activeSessions.length} active sessions:`);
    activeSessions.forEach(session => {
      console.log(`- User: ${session.User.email} (${session.User.role})`);
      console.log(`  Session expires: ${session.expires}`);
      console.log(`  Session token: ${session.sessionToken.substring(0, 20)}...`);
    });
    
    // 3. Check accounts linked to admin users
    console.log('\n3️⃣ Checking linked accounts for admin users:');
    const adminAccounts = await prisma.account.findMany({
      where: {
        user: {
          OR: [
            { role: 'ADMIN' },
            { role: 'admin' }
          ]
        }
      },
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });
    
    console.log(`Found ${adminAccounts.length} linked accounts for admin users:`);
    adminAccounts.forEach(account => {
      console.log(`- Provider: ${account.provider} for ${account.user.email}`);
    });
    
    // 4. Test admin page access logic
    console.log('\n4️⃣ Testing admin page access logic:');
    if (adminUsers.length > 0) {
      const testUser = adminUsers[0];
      console.log(`Testing with user: ${testUser.email}`);
      
      // Simulate UserContext logic
      const mockUser = {
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        role: testUser.role,
        isAdmin: testUser.role === 'ADMIN' || testUser.role === 'admin'
      };
      
      console.log('Mock user object:', mockUser);
      
      // Test admin access conditions
      const hasAdminAccess = mockUser && (mockUser.role === 'ADMIN' || mockUser.role === 'admin');
      console.log(`Admin access granted: ${hasAdminAccess}`);
      
      if (!hasAdminAccess) {
        console.log('❌ Admin access would be denied - user would see empty page');
      } else {
        console.log('✅ Admin access would be granted - user should see admin dashboard');
      }
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserSession().catch(console.error);