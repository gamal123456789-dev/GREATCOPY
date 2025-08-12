const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPaymentFlow() {
  try {
    // Simulate the payment confirmation data that would come from success page
    const testData = {
      orderId: 'test_order_' + Date.now(),
      game: 'Black Desert Online',
      service: 'Power Leveling',
      serviceDetails: 'Level 1 to Level 60',
      amount: 45.00,
      chargeId: 'test_charge_123',
      paymentMethod: 'Coinbase Commerce'
    };
    
    console.log('Testing payment flow with data:');
    console.log(JSON.stringify(testData, null, 2));
    
    // Create order directly (simulating what confirm-payment.ts does)
    const order = await prisma.order.create({
      data: {
        id: testData.orderId,
        userId: '37cf52a6-ad12-4e5b-afc9-1194f63bf023', // Real user ID from database
        customerName: 'Test User',
        date: new Date(),
        game: testData.game,
        price: testData.amount,
        service: testData.serviceDetails || testData.service, // This is the key line
        status: 'pending',
        notes: `Payment confirmed via ${testData.paymentMethod}${testData.chargeId ? ` - Charge ID: ${testData.chargeId}` : ''}`
      }
    });
    
    console.log('\nOrder created:');
    console.log(`Order ID: ${order.id}`);
    console.log(`Game: ${order.game}`);
    console.log(`Service: ${order.service}`);
    console.log(`Price: $${order.price}`);
    console.log(`Status: ${order.status}`);
    console.log(`Notes: ${order.notes}`);
    
    // Clean up test order
    await prisma.order.delete({
      where: { id: testData.orderId }
    });
    
    console.log('\nTest order cleaned up successfully.');
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentFlow();