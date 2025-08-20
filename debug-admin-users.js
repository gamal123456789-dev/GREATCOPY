const { PrismaClient } = require('@prisma/client');
const { getAdminUsers } = require('./services/databaseNotificationService');

const prisma = new PrismaClient();

async function debugAdminUsers() {
  try {
    console.log('🔍 Debugging admin users...');
    
    // Test getAdminUsers function
    console.log('\n1. Testing getAdminUsers function:');
    const adminUsers = await getAdminUsers();
    console.log('Admin users from getAdminUsers():', adminUsers.length);
    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. ID: ${admin.id}, Email: ${admin.email}, Name: ${admin.name}`);
    });
    
    // Test direct Prisma query with 'admin' role
    console.log('\n2. Testing direct Prisma query with role = "admin":');
    const directAdmins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    console.log('Direct admin query results:', directAdmins.length);
    directAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ID: ${admin.id}, Email: ${admin.email}, Role: ${admin.role}`);
    });
    
    // Test direct Prisma query with 'ADMIN' role
    console.log('\n3. Testing direct Prisma query with role = "ADMIN":');
    const directAdminsUpper = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    console.log('Direct ADMIN query results:', directAdminsUpper.length);
    directAdminsUpper.forEach((admin, index) => {
      console.log(`${index + 1}. ID: ${admin.id}, Email: ${admin.email}, Role: ${admin.role}`);
    });
    
    // Test OR query like in getAdminUsers
    console.log('\n4. Testing OR query like in getAdminUsers:');
    const orAdmins = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'ADMIN' }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    console.log('OR query results:', orAdmins.length);
    orAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ID: ${admin.id}, Email: ${admin.email}, Role: ${admin.role}`);
    });
    
    // Check all users and their roles
    console.log('\n5. Checking all users and their roles:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log('All users:', allUsers.length);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, Role: "${user.role}", ID: ${user.id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminUsers();