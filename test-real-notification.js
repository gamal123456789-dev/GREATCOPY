// Test real notification by creating an order
// Use the shared Prisma client that has the middleware setup
const prisma = require('./lib/prisma');

async function testRealNotification() {
  try {
    console.log('🧪 Creating test order to trigger notification...');
    
    // Get first user from database
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      throw new Error('No users found in database');
    }
    
    console.log('📋 Using user:', firstUser.name || firstUser.email);
    
    // Create a test order that will trigger the Prisma middleware
    const testOrder = await prisma.order.create({
      data: {
        id: 'TEST-ORDER-' + Date.now(),
        userId: firstUser.id,
        customerName: 'Test Customer',
        date: new Date(),
        game: 'Test Game',
        service: 'Test Service',
        price: 100,
        status: 'pending'
      }
    });
    
    console.log('✅ Test order created:', testOrder.id);
    console.log('📧 Notification should have been sent automatically via Prisma middleware');
    
    // Wait a moment then clean up
    setTimeout(async () => {
      try {
        await prisma.order.delete({
          where: { id: testOrder.id }
        });
        console.log('🧹 Test order cleaned up');
        await prisma.$disconnect();
        process.exit(0);
      } catch (error) {
        console.error('Error cleaning up:', error);
        await prisma.$disconnect();
        process.exit(1);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testRealNotification();