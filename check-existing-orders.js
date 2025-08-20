const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExistingOrders() {
  try {
    console.log('🔍 Checking existing orders with payment IDs...');
    
    // Get recent orders with payment IDs
    const orders = await prisma.order.findMany({
      where: { 
        paymentId: { not: null } 
      },
      orderBy: { date: 'desc' },
      take: 10
    });
    
    console.log(`Found ${orders.length} orders with payment IDs:`);
    console.log('=' .repeat(80));
    
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order.id}`);
      console.log(`   Game: ${order.game}`);
      console.log(`   Service: ${order.service}`);
      console.log(`   Price: $${order.price}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Payment ID: ${order.paymentId}`);
      console.log(`   Date: ${order.date.toISOString()}`);
      console.log(`   Customer: ${order.customerName}`);
      console.log('   ' + '-'.repeat(60));
    });
    
    // Also check payment sessions
    console.log('\n🔍 Checking payment sessions...');
    const paymentSessions = await prisma.paymentSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`Found ${paymentSessions.length} payment sessions:`);
    console.log('=' .repeat(80));
    
    paymentSessions.forEach((session, index) => {
      console.log(`${index + 1}. Order ID: ${session.orderId}`);
      console.log(`   Game: ${session.game}`);
      console.log(`   Service: ${session.service}`);
      console.log(`   Amount: $${session.amount}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Payment ID: ${session.paymentId}`);
      console.log(`   User ID: ${session.userId}`);
      console.log(`   Created: ${session.createdAt.toISOString()}`);
      console.log('   ' + '-'.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingOrders();