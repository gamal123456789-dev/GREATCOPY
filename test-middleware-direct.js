/**
 * Test middleware directly using the exact same setup as server.js
 */
const prisma = require('./lib/prisma');
const { setupDatabaseMonitoring } = require('./services/databaseNotificationService');

async function testMiddlewareDirect() {
  try {
    console.log('🧪 اختبار middleware مباشرة...');
    
    // Setup middleware exactly like server.js does
    setupDatabaseMonitoring(prisma);
    
    // Wait a moment for setup
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📝 إنشاء طلب تجريبي...');
    
    // Create test order
    const testOrder = await prisma.order.create({
      data: {
        id: `middleware_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: '8f253ada-ceaf-49df-9755-2add035a7740',
        customerName: 'اختبار Middleware مباشر',
        date: new Date(),
        game: 'Test Game - Middleware',
        price: 99.99,
        service: 'Test Service - Middleware',
        status: 'pending',
        notes: 'اختبار middleware مباشر',
        paymentId: `test_middleware_${Date.now()}`
      }
    });
    
    console.log('✅ تم إنشاء الطلب:', testOrder.id);
    console.log('⏳ انتظار تشغيل middleware...');
    
    // Wait for middleware to process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🧹 تنظيف الطلب التجريبي...');
    await prisma.order.delete({
      where: { id: testOrder.id }
    });
    
    console.log('✅ تم الانتهاء من الاختبار');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMiddlewareDirect();