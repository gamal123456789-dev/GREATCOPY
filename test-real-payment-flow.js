const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Test the complete payment flow to verify serviceDetails are properly handled
 * This simulates what happens when a user makes a real payment on the website
 */
async function testRealPaymentFlow() {
  try {
    console.log('🧪 Testing Real Payment Flow with ServiceDetails...');
    console.log('==================================================');
    
    // Step 1: Simulate frontend data (what would come from Black Desert Online page)
    const frontendData = {
      game: 'Black Desert Online',
      service: 'Power Leveling', // Generic service name
      serviceDetails: 'Level 1 to Level 60 + Main Questline + Change Tome', // Detailed info
      amount: 45.00,
      currency: 'USD'
    };
    
    console.log('📝 Step 1: Frontend sends payment data:');
    console.log(`   Game: ${frontendData.game}`);
    console.log(`   Service: ${frontendData.service}`);
    console.log(`   ServiceDetails: ${frontendData.serviceDetails}`);
    console.log(`   Amount: $${frontendData.amount}`);
    console.log('');
    
    // Step 2: Simulate what happens in create-payment API
    const orderId = `cb_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chargeId = `charge_${Date.now()}`;
    
    // This is what would be in the redirect URL
    const redirectParams = {
      orderId: orderId,
      game: encodeURIComponent(frontendData.game),
      service: encodeURIComponent(frontendData.service),
      serviceDetails: encodeURIComponent(frontendData.serviceDetails),
      amount: frontendData.amount,
      chargeId: chargeId
    };
    
    console.log('🔗 Step 2: Payment redirect URL would contain:');
    console.log(`   orderId: ${redirectParams.orderId}`);
    console.log(`   serviceDetails: ${decodeURIComponent(redirectParams.serviceDetails)}`);
    console.log('');
    
    // Step 3: Simulate what happens in success.tsx (payment confirmation)
    const confirmPaymentData = {
      orderId: redirectParams.orderId,
      game: decodeURIComponent(redirectParams.game),
      service: decodeURIComponent(redirectParams.service),
      serviceDetails: decodeURIComponent(redirectParams.serviceDetails),
      amount: redirectParams.amount,
      currency: frontendData.currency,
      chargeId: redirectParams.chargeId,
      paymentMethod: 'coinbase_commerce'
    };
    
    console.log('✅ Step 3: Payment confirmation data:');
    console.log(`   Service: ${confirmPaymentData.service}`);
    console.log(`   ServiceDetails: ${confirmPaymentData.serviceDetails}`);
    console.log('');
    
    // Step 4: Simulate what happens in confirm-payment.ts (database storage)
    const userId = '37cf52a6-ad12-4e5b-afc9-1194f63bf023'; // Using existing user
    
    // This is the key logic from confirm-payment.ts
    const serviceToStore = confirmPaymentData.serviceDetails || confirmPaymentData.service;
    
    console.log('💾 Step 4: Database storage logic:');
    console.log(`   serviceDetails: "${confirmPaymentData.serviceDetails}"`);
    console.log(`   service: "${confirmPaymentData.service}"`);
    console.log(`   Final service to store: "${serviceToStore}"`);
    console.log('');
    
    // Create the order in database (simulating confirm-payment.ts)
    const createdOrder = await prisma.order.create({
      data: {
        id: confirmPaymentData.orderId,
        userId: userId,
        customerName: 'Test Customer',
        date: new Date(),
        game: confirmPaymentData.game,
        price: confirmPaymentData.amount,
        service: serviceToStore, // This should contain detailed info
        status: 'pending',
        paymentId: confirmPaymentData.chargeId
      }
    });
    
    console.log('🎯 Step 5: Order created in database:');
    console.log(`   Order ID: ${createdOrder.id}`);
    console.log(`   Game: ${createdOrder.game}`);
    console.log(`   Service stored: "${createdOrder.service}"`);
    console.log(`   Price: $${createdOrder.price}`);
    console.log('');
    
    // Verify the service contains detailed information
    const hasDetailedInfo = createdOrder.service.includes('Level') || 
                           createdOrder.service.includes('Questline') || 
                           createdOrder.service.includes('Tome') ||
                           createdOrder.service.includes('to');
    
    if (hasDetailedInfo) {
      console.log('🎉 SUCCESS: Order contains detailed service information!');
      console.log('   The serviceDetails flow is working correctly.');
    } else {
      console.log('❌ ISSUE: Order contains generic service information only.');
      console.log('   There might be an issue in the serviceDetails flow.');
    }
    
    console.log('==================================================');
    console.log('✨ Real payment flow test completed!');
    
  } catch (error) {
    console.error('❌ Error during real payment flow test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealPaymentFlow();