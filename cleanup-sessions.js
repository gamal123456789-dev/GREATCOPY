// Session Cleanup Script
// Clears problematic sessions and cookies

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupSessions() {
  console.log('🧹 Cleaning up sessions...');
  
  try {
    // Clear old sessions from database (if using database sessions)
    const result = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });
    
    console.log(`✅ Cleaned up ${result.count} expired sessions`);
    
    // Clear old verification tokens
    const tokenResult = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    });
    
    console.log(`✅ Cleaned up ${tokenResult.count} expired verification tokens`);
    
  } catch (error) {
    console.error('❌ Session cleanup failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  cleanupSessions().catch(console.error);
}

module.exports = cleanupSessions;