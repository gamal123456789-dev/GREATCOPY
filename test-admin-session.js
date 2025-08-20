const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAdminSession() {
  console.log('🔍 Testing admin session and access...');
  
  try {
    // Get admin users from database
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        role: true,
        username: true,
        name: true
      }
    });
    
    console.log(`\n📊 Found ${adminUsers.length} admin users:`);
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Username: ${user.username || 'N/A'}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
    
    // Check sessions table
    console.log('🔍 Checking active sessions...');
    const sessions = await prisma.session.findMany({
      include: {
        User: {
          select: {
            email: true,
            role: true,
            username: true
          }
        }
      },
      orderBy: {
        expires: 'desc'
      },
      take: 10
    });
    
    console.log(`\n📋 Found ${sessions.length} recent sessions:`);
    sessions.forEach((session, index) => {
      const isExpired = new Date(session.expires) < new Date();
      console.log(`${index + 1}. User: ${session.User.email}`);
      console.log(`   Role: ${session.User.role}`);
      console.log(`   Expires: ${session.expires}`);
      console.log(`   Status: ${isExpired ? '❌ EXPIRED' : '✅ ACTIVE'}`);
      console.log(`   Session Token: ${session.sessionToken.substring(0, 20)}...`);
      console.log('');
    });
    
    // Check accounts table for linked accounts
    console.log('🔍 Checking linked accounts...');
    const accounts = await prisma.account.findMany({
      where: {
        user: {
          role: 'ADMIN'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            username: true
          }
        }
      }
    });
    
    console.log(`\n🔗 Found ${accounts.length} linked accounts for admin users:`);
    accounts.forEach((account, index) => {
      console.log(`${index + 1}. User: ${account.user.email}`);
      console.log(`   Provider: ${account.provider}`);
      console.log(`   Provider Account ID: ${account.providerAccountId}`);
      console.log(`   User Role: ${account.user.role}`);
      console.log('');
    });
    
    // Test UserContext logic simulation
    console.log('🧪 Testing UserContext logic simulation...');
    const testUser = adminUsers[0];
    if (testUser) {
      const mockSession = {
        user: {
          id: testUser.id,
          email: testUser.email,
          role: testUser.role,
          username: testUser.username,
          name: testUser.name
        }
      };
      
      // Simulate UserContext isAdmin check
      const isAdmin = mockSession.user.role === 'ADMIN' || mockSession.user.role === 'admin';
      console.log(`\n🔐 UserContext simulation for ${testUser.email}:`);
      console.log(`   Session role: ${mockSession.user.role}`);
      console.log(`   isAdmin result: ${isAdmin}`);
      console.log(`   Should have access: ${isAdmin ? '✅ YES' : '❌ NO'}`);
      
      // Simulate admin page protection logic
      const hasAdminAccess = mockSession.user && (mockSession.user.role === 'ADMIN' || mockSession.user.role === 'admin');
      console.log(`   Admin page access: ${hasAdminAccess ? '✅ GRANTED' : '❌ DENIED'}`);
    }
    
  } catch (error) {
    console.error('❌ Error during admin session test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminSession();