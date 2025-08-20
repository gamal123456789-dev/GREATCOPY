const { sendDatabaseNotification } = require('./services/databaseNotificationService');
const fs = require('fs');

async function testNotificationFunction() {
  console.log('🔍 اختبار دالة sendDatabaseNotification مباشرة...');
  
  // مسح سجل الإشعارات أولاً
  try {
    fs.writeFileSync('logs/admin-notifications.log', '');
    console.log('🗑️ تم مسح سجل الإشعارات');
  } catch (error) {
    console.log('⚠️ لا يمكن مسح سجل الإشعارات:', error.message);
  }
  
  // بيانات اختبار مماثلة لما يرسله الـ webhook
  const testData = {
    orderId: 'cm_order_1755432978430_uyt2emv8w',
    customerName: 'gamalkhaled981@gmail.com',
    game: 'Black Desert Online',
    service: 'Power Leveling',
    price: 0.56,
    status: 'pending',
    paymentMethod: 'Cryptomus (USDT)',
    timestamp: new Date().toISOString()
  };
  
  console.log('📋 بيانات الاختبار:', JSON.stringify(testData, null, 2));
  
  try {
    console.log('📤 استدعاء sendDatabaseNotification...');
    
    await sendDatabaseNotification('new-order', testData);
    
    console.log('✅ تم استدعاء الدالة بنجاح');
    
    // انتظار قليل ثم فحص السجل
    setTimeout(() => {
      console.log('\n📋 فحص سجل admin-notifications.log...');
      try {
        const adminLog = fs.readFileSync('logs/admin-notifications.log', 'utf8');
        const lines = adminLog.trim().split('\n').filter(line => line.trim());
        
        console.log(`عدد الإدخالات في السجل: ${lines.length}`);
        
        if (lines.length > 0) {
          console.log('✅ تم العثور على إدخالات في السجل:');
          lines.forEach((line, index) => {
            console.log(`  ${index + 1}. ${line}`);
          });
        } else {
          console.log('❌ لا توجد إدخالات في السجل');
        }
        
        // البحث عن الطلب المحدد
        const hasOrderNotification = adminLog.includes(testData.orderId);
        console.log('\n🎯 هل تم العثور على إشعار الطلب:', hasOrderNotification ? '✅ نعم' : '❌ لا');
        
      } catch (logError) {
        console.log('❌ لا يمكن قراءة سجل الإشعارات:', logError.message);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ خطأ في استدعاء sendDatabaseNotification:', error.message);
    console.error('تفاصيل الخطأ:', error.stack);
  }
}

// تشغيل الاختبار
testNotificationFunction();