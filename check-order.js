const { prisma } = require('./services/databaseNotificationService');

async function checkOrder() {
  try {
    const orderId = 'test_webhook_1755384454280';
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    console.log('Order exists:', !!order);
    if (order) {
      console.log('Order details:', {
        id: order.id,
        customerName: order.customerName,
        game: order.game,
        service: order.service,
        price: order.price,
        status: order.status,
        date: order.date
      });
    } else {
      console.log('Order not found in database');
    }
  } catch (error) {
    console.error('Error checking order:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrder();