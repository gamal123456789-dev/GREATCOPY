const { PrismaClient } = require('@prisma/client');

// Prevent multiple instances of Prisma Client in development
let prisma;

if (globalThis.__prisma) {
  prisma = globalThis.__prisma;
} else {
  prisma = new PrismaClient({
    log: [], // Disable all logging
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
  }
}

// Connect to database
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;