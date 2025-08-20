const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPaymentSessions() {
  console.log('🔍 فحص جلسات الدفع للطلبات التي لا تتم معالجتها...');
  
  const problematicOrders = [
    'cm_order_1755432978430_uyt2emv8w',
    'cm_order_1755433727616_scfn5xows',
    'cm_order_1755432930705_uff26ovca'
  ];
  
  for (const orderId of problematicOrders) {
    console.log(`\n📋 فحص الطلب: ${orderId}`);
    
    try {
      // فحص جلسة الدفع
      const paymentSession = await prisma.paymentSession.findUnique({
        where: { orderId: orderId }
      });
      
      if (paymentSession) {
        console.log('✅ جلسة الدفع موجودة:');
        console.log('   - المستخدم:', paymentSession.userId);
        console.log('   - الإيميل:', paymentSession.customerEmail);
        console.log('   - اللعبة:', paymentSession.game);
        console.log('   - الخدمة:', paymentSession.service);
        console.log('   - المبلغ:', paymentSession.amount);
        console.log('   - الحالة:', paymentSession.status);
        console.log('   - تاريخ الإنشاء:', paymentSession.createdAt);
      } else {
        console.log('❌ جلسة الدفع غير موجودة');
      }
      
      // فحص الطلب الموجود
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId }
      });
      
      if (existingOrder) {
        console.log('✅ الطلب موجود في قاعدة البيانات:');
        console.log('   - اسم العميل:', existingOrder.customerName);
        console.log('   - اللعبة:', existingOrder.game);
        console.log('   - الخدمة:', existingOrder.service);
        console.log('   - السعر:', existingOrder.price);
        console.log('   - الحالة:', existingOrder.status);
        console.log('   - تاريخ الإنشاء:', existingOrder.date);
      } else {
        console.log('❌ الطلب غير موجود في قاعدة البيانات');
      }
      
    } catch (error) {
      console.error(`❌ خطأ في فحص الطلب ${orderId}:`, error.message);
    }
  }
  
  // فحص إجمالي عدد جلسات الدفع والطلبات
  try {
    const totalPaymentSessions = await prisma.paymentSession.count();
    const totalOrders = await prisma.order.count();
    
    console.log(`\n📊 الإحصائيات الإجمالية:`);
    console.log(`   - إجمالي جلسات الدفع: ${totalPaymentSessions}`);
    console.log(`   - إجمالي الطلبات: ${totalOrders}`);
    
    // فحص آخر 5 جلسات دفع
    const recentPaymentSessions = await prisma.paymentSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`\n📋 آخر 5 جلسات دفع:`);
    recentPaymentSessions.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.orderId} - ${session.status} - ${session.customerEmail}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في الحصول على الإحصائيات:', error.message);
  }
  
  await prisma.$disconnect();
}

checkPaymentSessions();