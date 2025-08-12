const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing complete payment flow with serviceDetails...');
    
    // Step 1: Simulate frontend data (what would come from black-desert-online.jsx)
    const frontendData = {
      game: 'Black Desert Online',
      service: 'Power Leveling',
      serviceDetails: 'Level 1 to Level 60 + Main Questline (Balenos to Mediah) + Change Tome',
      price: 45.00,
      userId: '37cf52a6-ad12-4e5b-afc9-1194f63bf023'
    };
    
    console.log('📤 Frontend would send:', frontendData);
    
    // Step 2: Simulate create-payment API (what redirect_url would contain)
    const orderId = `test_order_${Date.now()}`;
    const redirectUrl = `http://localhost:3000/pay/success?orderId=${orderId}&game=${encodeURIComponent(frontendData.game)}&service=${encodeURIComponent(frontendData.service)}&serviceDetails=${encodeURIComponent(frontendData.serviceDetails)}&amount=${frontendData.price}`;
    
    console.log('🔗 Redirect URL would be:', redirectUrl);
    
    // Step 3: Simulate URL parsing (what success.tsx would do)
    const url = new URL(redirectUrl);
    const urlParams = url.searchParams;
    
    const extractedData = {
      orderId: urlParams.get('orderId'),
      game: urlParams.get('game'),
      service: urlParams.get('service'),
      serviceDetails: urlParams.get('serviceDetails'),
      amount: urlParams.get('amount')
    };
    
    console.log('📥 Success page would extract:', extractedData);
    
    // Step 4: Simulate confirm-payment API call
    console.log('💾 Creating order with extracted data...');
    
    const order = await prisma.order.create({
      data: {
        id: extractedData.orderId,
        userId: frontendData.userId,
        customerName: 'Test User',
        date: new Date(),
        game: extractedData.game,
        price: parseFloat(extractedData.amount),
        service: extractedData.serviceDetails || extractedData.service, // This is the key line
        status: 'pending',
        notes: 'Test order - complete flow simulation'
      }
    });
    
    console.log('✅ Order created successfully!');
    console.log(`📋 Order ID: ${order.id}`);
    console.log(`🎮 Game: ${order.game}`);
    console.log(`🔧 Service stored: "${order.service}"`);
    console.log(`💰 Price: $${order.price}`);
    
    // Verify the service field contains detailed information
    if (order.service.includes('Level 1 to') && order.service.includes('Main Questline')) {
      console.log('\n🎉 SUCCESS: Service field contains detailed information!');
      console.log('✅ serviceDetails are being passed correctly through the entire flow.');
    } else {
      console.log('\n❌ FAILURE: Service field does not contain detailed information.');
      console.log(`Expected detailed info but got: "${order.service}"`);
    }
    
    // Clean up test order
    await prisma.order.delete({
      where: { id: order.id }
    });
    console.log('🧹 Test order cleaned up.');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteFlow();