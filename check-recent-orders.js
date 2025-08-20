const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentOrders() {
  try {
    console.log('جاري التحقق من آخر الطلبات...');
    
    const orders = await prisma.order.findMany({
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        User: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });
    
    console.log(`\nتم العثور على ${orders.length} طلبات:`);
    console.log('=' .repeat(80));
    
    orders.forEach((order, index) => {
      const customerInfo = order.User?.email || order.customerName || 'غير محدد';
      const createdAt = new Date(order.date).toLocaleString('ar-EG');
      
      console.log(`${index + 1}. الطلب: ${order.id}`);
      console.log(`   العميل: ${customerInfo}`);
      console.log(`   اللعبة: ${order.game}`);
      console.log(`   الخدمة: ${order.service}`);
      console.log(`   السعر: $${order.price}`);
      console.log(`   الحالة: ${order.status}`);
      console.log(`   تاريخ الإنشاء: ${createdAt}`);
      console.log(`   طريقة الدفع: ${order.paymentMethod || 'غير محدد'}`);
      console.log('-'.repeat(40));
    });
    
  } catch (error) {
    console.error('خطأ في التحقق من الطلبات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentOrders();