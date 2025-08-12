import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Update records that contain NULL in the role field
  await prisma.user.updateMany({
    where: {
      role: 'user',  // Search for users who have role = 'user'
    },
    data: {
      role: 'customer',  // Set default value 'customer' for the role field
    },
  });

  // Create system user
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@internal.app' },
    update: {
      username: 'System',
      name: 'System',
      role: 'system'
    },
    create: {
      id: uuidv4(),
      email: 'system@internal.app',
      username: 'System',
      name: 'System',
      password: await bcrypt.hash('system-internal-password', 10),
      role: 'system',
      emailVerified: new Date()
    }
  });

  console.log('✅ System user created/updated:', systemUser.id);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
