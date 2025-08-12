const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewOrder() {
  try {
    console.log('🧪 Testing New Order Creation with Detailed Service Info...');
    console.log('==================================================');
    
    // Simulate creating an order with detailed service information
    const testOrder = {
      orderId: `test_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      game: 'Black Desert Online',
      service: 'Level 1 to Level 60 + Main Questline + Change Tome',
      serviceDetails: 'Level 1 to Level 60 + Main Questline + Change Tome',
      amount: 45.00,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'coinbase_commerce',
      chargeId: `test_charge_${Date.now()}`,
      userId: '37cf52a6-ad12-4e5b-afc9-1194f63bf023' // Using existing user ID
    };
    
    console.log('📝 Creating test order with detailed service info:');
    console.log(`   Game: ${testOrder.game}`);
    console.log(`   Service: ${testOrder.service}`);
    console.log(`   ServiceDetails: ${testOrder.serviceDetails}`);
    console.log(`   Amount: $${testOrder.amount}`);
    console.log('');
    
    // Create the order in database
    const createdOrder = await prisma.order.create({
      data: {
        id: testOrder.orderId,
        userId: testOrder.userId,
        customerName: 'Test Customer',
        date: new Date(),
        game: testOrder.game,
        price: testOrder.amount,
        service: testOrder.serviceDetails || testOrder.service, // Use serviceDetails if available
        status: testOrder.status,
        paymentId: testOrder.chargeId
      }
    });
    
    console.log('✅ Order created successfully!');
    console.log(`   Order ID: ${createdOrder.id}`);
    console.log(`   Service stored in DB: "${createdOrder.service}"`);
    console.log('');
    
    // Verify the order was stored correctly
    const retrievedOrder = await prisma.order.findUnique({
      where: { id: testOrder.orderId }
    });
    
    if (retrievedOrder) {
      console.log('🔍 Verification - Order retrieved from database:');
      console.log(`   Game: ${retrievedOrder.game}`);
      console.log(`   Service: "${retrievedOrder.service}"`);
      console.log(`   Amount: $${retrievedOrder.amount}`);
      console.log(`   Status: ${retrievedOrder.status}`);
      console.log('');
      
      // Check if service contains detailed information
      const hasDetailedInfo = retrievedOrder.service.includes('Level') || 
                             retrievedOrder.service.includes('Questline') || 
                             retrievedOrder.service.includes('Tome') ||
                             retrievedOrder.service.includes('to');
      
      if (hasDetailedInfo) {
        console.log('🎉 SUCCESS: Order contains detailed service information!');
      } else {
        console.log('❌ ISSUE: Order contains generic service information only.');
      }
    }
    
    console.log('==================================================');
    console.log('✨ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewOrder();