require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { sendDatabaseNotification } = require('./services/databaseNotificationService');

const prisma = new PrismaClient();

async function checkYourOrder() {
  try {
    console.log('🔍 فحص طلبك الأخير...');
    console.log('============================================');
    
    // البحث عن أحدث طلب
    const recentOrder = await prisma.order.findFirst({
      orderBy: { date: 'desc' }
    });
    
    if (!recentOrder) {
      console.log('❌ لم يتم العثور على أي طلبات');
      return;
    }
    
    console.log('📦 طلبك الأخير:');
    console.log('رقم الطلب:', recentOrder.id);
    console.log('الاسم:', recentOrder.customerName);
    console.log('البريد الإلكتروني:', recentOrder.customerEmail);
    console.log('اللعبة:', recentOrder.game);
    console.log('الخدمة:', recentOrder.service);
    console.log('السعر:', recentOrder.price, 'دولار');
    console.log('حالة الطلب:', recentOrder.status);
    console.log('تاريخ الطلب:', recentOrder.date);
    console.log('رقم الدفعة:', recentOrder.paymentId || 'غير محدد');
    
    // فحص الإشعارات لهذا المستخدم
    if (recentOrder.userId) {
      console.log('\n🔔 فحص الإشعارات للمستخدم:', recentOrder.userId);
      
      // البحث عن إشعارات تأكيد الدفع لهذا الطلب المحدد
      const orderNotifications = await prisma.notification.findMany({
        where: {
          userId: recentOrder.userId,
          type: 'payment-confirmed',
          data: {
            path: ['orderId'],
            equals: recentOrder.id
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`📬 إشعارات تأكيد الدفع لهذا الطلب: ${orderNotifications.length}`);
      
      if (orderNotifications.length === 0) {
        console.log('❌ لم يتم العثور على إشعار تأكيد دفع لهذا الطلب!');
        
        // التحقق من حالة الدفع
        if (recentOrder.status === 'pending' && recentOrder.paymentId) {
          console.log('\n🚀 إرسال إشعار تأكيد الدفع المفقود...');
          
          try {
            await sendDatabaseNotification('payment-confirmed', {
              userId: recentOrder.userId,
              orderId: recentOrder.id,
              customerName: recentOrder.customerName,
              game: recentOrder.game,
              service: recentOrder.service,
              price: recentOrder.price,
              paymentMethod: 'Cryptomus (USDT)',
              timestamp: recentOrder.date.toISOString()
            });
            
            console.log('✅ تم إرسال إشعار تأكيد الدفع بنجاح!');
            console.log('📱 يمكنك الآن مراجعة الإشعارات في موقعك');
            
          } catch (notificationError) {
            console.error('❌ خطأ في إرسال الإشعار:', notificationError.message);
          }
        } else if (recentOrder.status === 'pending' && !recentOrder.paymentId) {
          console.log('⏳ الطلب ما زال في انتظار الدفع');
          console.log('💡 يرجى إكمال عملية الدفع أولاً');
        } else {
          console.log('ℹ️ حالة الطلب:', recentOrder.status);
        }
        
      } else {
        console.log('✅ تم العثور على إشعار تأكيد الدفع:');
        orderNotifications.forEach((notif, index) => {
          console.log(`${index + 1}. العنوان: ${notif.title}`);
          console.log(`   الرسالة: ${notif.message}`);
          console.log(`   تاريخ الإرسال: ${notif.createdAt}`);
          console.log(`   مقروء: ${notif.read ? 'نعم' : 'لا'}`);
        });
        
        if (!orderNotifications[0].read) {
          console.log('\n💡 الإشعار موجود لكن لم تتم قراءته بعد');
          console.log('📱 يرجى مراجعة الإشعارات في موقعك');
        }
      }
      
      // عرض جميع الإشعارات الأخيرة
      console.log('\n📋 جميع الإشعارات الأخيرة:');
      const allNotifications = await prisma.notification.findMany({
        where: {
          userId: recentOrder.userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });
      
      if (allNotifications.length === 0) {
        console.log('❌ لا توجد إشعارات');
      } else {
        allNotifications.forEach((notif, index) => {
          console.log(`${index + 1}. ${notif.title} - ${notif.read ? '✅ مقروء' : '🔔 جديد'}`);
          console.log(`   ${notif.createdAt}`);
        });
      }
      
    } else {
      console.log('❌ لم يتم العثور على معرف المستخدم للطلب!');
    }
    
    console.log('\n============================================');
    console.log('📞 إذا كنت بحاجة لمساعدة إضافية، يرجى التواصل معنا');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkYourOrder();