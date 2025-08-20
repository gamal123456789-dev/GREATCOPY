const { prisma } = require('./services/databaseNotificationService');
const { v4: uuidv4 } = require('uuid');

async function createTestOrder() {
  try {
    console.log('🆕 إنشاء طلب تجريبي جديد...');
    
    // Create a new test order
    const testOrder = await prisma.order.create({
      data: {
        id: `test_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: '8f253ada-ceaf-49df-9755-2add035a7740', // Use existing admin user ID
        customerName: 'عميل تجريبي للإشعارات',
        date: new Date(),
        game: 'Call of Duty: Modern Warfare',
        price: 75.99,
        service: 'Rank Boost - Diamond to Master',
        status: 'pending',
        notes: 'طلب تجريبي لاختبار نظام الإشعارات',
        paymentId: `test_payment_${Date.now()}`
      }
    });
    
    console.log('✅ تم إنشاء الطلب التجريبي بنجاح:');
    console.log('📋 معرف الطلب:', testOrder.id);
    console.log('👤 اسم العميل:', testOrder.customerName);
    console.log('🎮 اللعبة:', testOrder.game);
    console.log('⚡ الخدمة:', testOrder.service);
    console.log('💰 السعر:', testOrder.price);
    console.log('📅 التاريخ:', testOrder.date);
    
    console.log('\n🔔 يجب أن يتم إرسال إشعار تلقائياً الآن...');
    console.log('💡 تحقق من سجلات الخادم أو النافذة المنبثقة');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الطلب التجريبي:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();