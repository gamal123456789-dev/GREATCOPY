const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmins() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' }
    });
    
    console.log('عدد المديرين:', admins.length);
    admins.forEach((admin, i) => {
      console.log(`${i+1}. ${admin.email} (${admin.id})`);
    });
    
  } catch (error) {
    console.error('خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();