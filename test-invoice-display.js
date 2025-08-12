const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testInvoiceDisplay() {
  try {
    console.log('🧪 Testing Invoice Display...');
    console.log('=' .repeat(50));
    
    // Get the most recent order to test invoice display
    const recentOrder = await prisma.order.findFirst({
      orderBy: {
        date: 'desc'
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        }
      }
    });
    
    if (!recentOrder) {
      console.log('❌ No orders found in database');
      return;
    }
    
    console.log('📋 Most Recent Order Details:');
    console.log(`   Order ID: ${recentOrder.id}`);
    console.log(`   Customer: ${recentOrder.customerName}`);
    console.log(`   Game: ${recentOrder.game}`);
    console.log(`   Service: "${recentOrder.service}"`);
    console.log(`   Price: $${recentOrder.price}`);
    console.log(`   Status: ${recentOrder.status}`);
    console.log(`   Date: ${recentOrder.date}`);
    console.log('');
    
    // Simulate what the invoice page would display
    const invoiceServiceName = `${recentOrder.game} - ${recentOrder.service}`;
    console.log('💳 Invoice Display Simulation:');
    console.log(`   Service Name: "${invoiceServiceName}"`);
    console.log(`   Amount: $${recentOrder.price} USD`);
    console.log(`   Status: ${recentOrder.status.toUpperCase()}`);
    console.log(`   Payment Method: Coinbase Commerce`);
    console.log('');
    
    // Check if service contains detailed information
    const hasDetailedInfo = recentOrder.service.includes('Level') || 
                           recentOrder.service.includes('Questline') || 
                           recentOrder.service.includes('Tome') ||
                           recentOrder.service.includes('to') ||
                           recentOrder.service.includes('Main');
    
    if (hasDetailedInfo) {
      console.log('✅ SUCCESS: Invoice will show detailed service information!');
      console.log('   The service field contains specific details about the order.');
    } else {
      console.log('❌ ISSUE: Invoice will show generic service information only.');
      console.log('   The service field contains only basic information.');
    }
    
    console.log('');
    console.log('🔍 Analysis:');
    console.log(`   Service field length: ${recentOrder.service.length} characters`);
    console.log(`   Contains "Level": ${recentOrder.service.includes('Level')}`);
    console.log(`   Contains "to": ${recentOrder.service.includes('to')}`);
    console.log(`   Contains "Main": ${recentOrder.service.includes('Main')}`);
    console.log(`   Contains "Questline": ${recentOrder.service.includes('Questline')}`);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInvoiceDisplay();