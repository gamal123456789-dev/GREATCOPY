const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getUserId() {
  try {
    const user = await prisma.user.findFirst();
    if (user) {
      console.log('Found user:', user.id, user.email);
      return user.id;
    } else {
      console.log('No users found');
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getUserId();