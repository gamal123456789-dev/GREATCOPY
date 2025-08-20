/**
 * Create Admin User Script
 * Creates a test admin user for notification testing
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user for testing...');
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      console.log('📋 Admin details:');
      console.log(`   - ID: ${existingAdmin.id}`);
      console.log(`   - Email: ${existingAdmin.email}`);
      console.log(`   - Name: ${existingAdmin.name || 'Not set'}`);
      console.log(`   - Role: ${existingAdmin.role}`);
      return existingAdmin;
    }
    
    // Create new admin user
    const adminUser = await prisma.user.create({
      data: {
        id: 'admin_' + Date.now(),
        email: 'admin@gear-score.com',
        name: 'System Administrator',
        role: 'ADMIN',
        emailVerified: new Date(),
        createdAt: new Date()
      }
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin details:');
    console.log(`   - ID: ${adminUser.id}`);
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Name: ${adminUser.name}`);
    console.log(`   - Role: ${adminUser.role}`);
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('🎉 Admin user setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create admin user:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };