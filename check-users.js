const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        username: true,
        name: true
      }
    });
    
    console.log('All users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role || 'No role set'}`);
      console.log(`   Username: ${user.username || 'N/A'}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log('   ---');
    });
    
    console.log(`\nTotal users: ${users.length}`);
    
    // Check for admin users
    const adminUsers = users.filter(user => user.role === 'ADMIN' || user.role === 'admin');
    console.log(`Admin users: ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`- Admin: ${admin.email} (role: ${admin.role})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();