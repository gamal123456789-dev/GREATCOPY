const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAdminAccess() {
  try {
    console.log('🔍 Testing admin access...');
    
    // Get admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        role: true,
        username: true
      }
    });
    
    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email} (${admin.role})`);
    });
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
      return;
    }
    
    // Test the logic that would be used in UserContext
    const testUser = adminUsers[0];
    console.log('\n🧪 Testing UserContext logic:');
    console.log(`User role: ${testUser.role}`);
    console.log(`isAdmin check (role === 'ADMIN'): ${testUser.role === 'ADMIN'}`);
    console.log(`isAdmin check (role === 'admin'): ${testUser.role === 'admin'}`);
    console.log(`Combined check: ${testUser.role === 'ADMIN' || testUser.role === 'admin'}`);
    
    // Test the logic that would be used in admin page protection
    console.log('\n🛡️ Testing admin page protection logic:');
    console.log(`user.role !== 'ADMIN': ${testUser.role !== 'ADMIN'}`);
    console.log(`Should allow access: ${testUser.role === 'ADMIN'}`);
    
    console.log('\n✅ Admin access test completed!');
    
  } catch (error) {
    console.error('❌ Error testing admin access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminAccess();