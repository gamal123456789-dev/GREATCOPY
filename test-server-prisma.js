// Test using the exact same Prisma instance as the server
const { setupDatabaseMonitoring } = require('./services/databaseNotificationService');
const prisma = require('./lib/prisma');

async function testServerPrisma() {
  try {
    console.log('🧪 Testing with server Prisma instance...');
    
    // Setup middleware on the same instance
    setupDatabaseMonitoring(prisma);
    
    // Find a user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    console.log('📋 Using user:', user.name || user.email);
    
    const testOrderId = `TEST-SERVER-${Date.now()}`;
    
    console.log('📝 Creating order with server Prisma instance...');
    
    // Create order using the same Prisma instance
    const order = await prisma.order.create({
      data: {
        id: testOrderId,
        customerName: 'Server Test Customer',
        game: 'Test Game',
        service: 'Test Service',
        status: 'pending',
        price: 100,
        date: new Date(),
        userId: user.id,
        paymentId: null
      }
    });
    
    console.log('✅ Order created:', order.id);
    console.log('📧 Middleware should have triggered notification');
    
    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clean up
    await prisma.order.delete({
      where: { id: testOrderId }
    });
    
    console.log('🧹 Order cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testServerPrisma().then(() => {
  console.log('🏁 Server Prisma test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});