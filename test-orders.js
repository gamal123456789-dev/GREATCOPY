const prisma = require('./lib/prisma');

async function checkOrders() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { date: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        date: true,
        customerName: true,
        game: true,
        service: true
      }
    });
    
    console.log('آخر 5 طلبات:');
    orders.forEach(order => {
      console.log(`- ${order.id}: ${order.status} - ${order.customerName} (${order.date})`);
    });
    
    console.log(`\nإجمالي الطلبات: ${orders.length}`);
  } catch (error) {
    console.error('خطأ في جلب الطلبات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();