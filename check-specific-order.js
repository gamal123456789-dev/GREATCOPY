require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpecificOrder() {
  try {
    const orderId = 'cm_order_1755564044507_s8q5mqstn';
    const userEmail = 'gamalkhaled981@gmail.com';
    
    console.log('🔍 البحث عن الطلب المحدد...');
    console.log('رقم الطلب:', orderId);
    console.log('البريد الإلكتروني:', userEmail);
    console.log('============================================');
    
    // البحث عن الطلب
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      console.log('❌ الطلب غير موجود في قاعدة البيانات');
      
      // البحث عن جلسة الدفع
      const paymentSession = await prisma.paymentSession.findFirst({
        where: {
          orderId: orderId
        }
      });
      
      if (paymentSession) {
        console.log('✅ جلسة الدفع موجودة:');
        console.log('  - الحالة:', paymentSession.status);
        console.log('  - المبلغ:', paymentSession.amount);
        console.log('  - العملة:', paymentSession.currency);
        console.log('  - تاريخ الإنشاء:', paymentSession.createdAt);
        console.log('  - تاريخ التحديث:', paymentSession.updatedAt);
      } else {
        console.log('❌ جلسة الدفع غير موجودة أيضاً');
      }
      
      return;
    }
    
    console.log('✅ الطلب موجود:');
    console.log('  - الحالة:', order.status);
    console.log('  - رقم الدفعة:', order.paymentId);
    console.log('  - اللعبة:', order.game);
    console.log('  - الخدمة:', order.service);
    console.log('  - السعر:', order.price);
    console.log('  - العميل:', order.customerName);
    console.log('  - البريد:', order.customerEmail);
    console.log('  - معرف المستخدم:', order.userId);
    console.log('  - تاريخ الإنشاء:', order.date);
    
    // البحث عن الإشعارات المرتبطة بهذا الطلب
    if (order.userId) {
      console.log('\n🔔 البحث عن الإشعارات...');
      
      const orderNotifications = await prisma.notification.findMany({
        where: {
          userId: order.userId,
          data: {
            path: ['orderId'],
            equals: orderId
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`📬 عدد الإشعارات لهذا الطلب: ${orderNotifications.length}`);
      
      if (orderNotifications.length > 0) {
        orderNotifications.forEach((notif, index) => {
          console.log(`${index + 1}. النوع: ${notif.type}`);
          console.log(`   العنوان: ${notif.title}`);
          console.log(`   الرسالة: ${notif.message}`);
          console.log(`   تاريخ الإنشاء: ${notif.createdAt}`);
          console.log(`   مقروء: ${notif.read ? 'نعم' : 'لا'}`);
          console.log('   ---');
        });
      }
      
      // البحث عن جميع الإشعارات للمستخدم
      const allUserNotifications = await prisma.notification.findMany({
        where: {
          userId: order.userId
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      
      console.log(`\n📋 إجمالي الإشعارات للمستخدم: ${allUserNotifications.length}`);
      
      // فلترة الإشعارات التي تحتوي على رقم الطلب في الرسالة
      const relatedNotifications = allUserNotifications.filter(notif => 
        notif.message && notif.message.includes(orderId)
      );
      
      console.log(`🎯 الإشعارات المرتبطة بهذا الطلب (في الرسالة): ${relatedNotifications.length}`);
      
      if (relatedNotifications.length > 0) {
        console.log('\n📝 الإشعارات المرتبطة:');
        relatedNotifications.forEach((notif, index) => {
          console.log(`${index + 1}. ${notif.title}`);
          console.log(`   ${notif.message}`);
          console.log(`   ${notif.createdAt}`);
          console.log('   ---');
        });
      }
    }
    
    // البحث عن جلسة الدفع المرتبطة
    const paymentSession = await prisma.paymentSession.findFirst({
      where: {
        orderId: orderId
      }
    });
    
    if (paymentSession) {
      console.log('\n💳 جلسة الدفع:');
      console.log('  - الحالة:', paymentSession.status);
      console.log('  - المبلغ:', paymentSession.amount);
      console.log('  - العملة:', paymentSession.currency);
      console.log('  - تاريخ الإنشاء:', paymentSession.createdAt);
      console.log('  - تاريخ التحديث:', paymentSession.updatedAt);
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecificOrder();