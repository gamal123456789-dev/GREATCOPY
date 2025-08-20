const { prisma } = require('./services/databaseNotificationService');

async function checkMissingOrders() {
  console.log('🔍 Checking for missing orders from recent Cryptomus payments...');
  
  const orderIds = [
    'cm_order_1755432978430_uyt2emv8w',
    'cm_order_1755433727616_scfn5xows'
  ];
  
  console.log('Looking for orders:', orderIds);
  
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: orderIds.map(id => ({ id }))
      }
    });
    
    console.log(`\n📊 Found ${orders.length} orders out of ${orderIds.length} expected`);
    
    if (orders.length > 0) {
      console.log('\n✅ Found Orders:');
      orders.forEach(order => {
        console.log(`🆔 Order ID: ${order.id}`);
        console.log(`👤 Customer: ${order.customerName}`);
        console.log(`🎮 Game: ${order.game}`);
        console.log(`⚡ Service: ${order.service}`);
        console.log(`💰 Price: $${order.price}`);
        console.log(`📊 Status: ${order.status}`);
        console.log(`📅 Date: ${order.date}`);
        console.log('---');
      });
    }
    
    const missingOrders = orderIds.filter(id => !orders.find(order => order.id === id));
    
    if (missingOrders.length > 0) {
      console.log('\n❌ Missing Orders:');
      missingOrders.forEach(id => {
        console.log(`🚫 ${id}`);
      });
      
      console.log('\n🔍 Checking payment sessions for missing orders...');
      
      const paymentSessions = await prisma.paymentSession.findMany({
        where: {
          OR: missingOrders.map(id => ({ orderId: id }))
        }
      });
      
      console.log(`📋 Found ${paymentSessions.length} payment sessions for missing orders`);
      
      if (paymentSessions.length > 0) {
        paymentSessions.forEach(session => {
          console.log(`💳 Payment Session: ${session.orderId}`);
          console.log(`👤 Customer: ${session.customerEmail}`);
          console.log(`🎮 Game: ${session.game}`);
          console.log(`⚡ Service: ${session.service}`);
          console.log(`💰 Amount: $${session.amount}`);
          console.log(`📊 Status: ${session.status}`);
          console.log('---');
        });
      }
    }
    
    // Also check recent orders to see what was created
    console.log('\n📋 Recent orders (last 10):');
    const recentOrders = await prisma.order.findMany({
      orderBy: { date: 'desc' },
      take: 10
    });
    
    recentOrders.forEach(order => {
      console.log(`🆔 ${order.id} - ${order.customerName} - ${order.game} - $${order.price} - ${order.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingOrders().catch(console.error);