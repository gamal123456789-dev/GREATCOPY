const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Checking existing users in database...');
    console.log('==================================================');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      take: 5
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database.');
      console.log('   Need to create a test user first.');
    } else {
      console.log(`✅ Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}`);
        console.log(`      Name: ${user.name || 'N/A'}`);
        console.log(`      Email: ${user.email || 'N/A'}`);
        console.log(`      Created: ${user.createdAt}`);
        console.log('');
      });
    }
    
    console.log('==================================================');
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();