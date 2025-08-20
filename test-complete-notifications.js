const { sendDatabaseNotification } = require('./services/databaseNotificationService');
const fs = require('fs');

async function testCompleteNotifications() {
  console.log('🔍 اختبار شامل لنظام الإشعارات...');
  
  // مسح سجل الإشعارات أولاً
  try {
    fs.writeFileSync('logs/admin-notifications.log', '');
    console.log('🗑️ تم مسح سجل الإشعارات');
  } catch (error) {
    console.log('⚠️ لا يمكن مسح سجل الإشعارات:', error.message);
  }
  
  console.log('\n=== اختبار إشعار طلب جديد ===');
  
  // بيانات اختبار للطلب الجديد
  const newOrderData = {
    orderId: `test_new_order_${Date.now()}`,
    customerName: 'gamalkhaled981@gmail.com',
    game: 'Black Desert Online',
    service: 'Power Leveling',
    price: 0.56,
    status: 'pending',
    paymentMethod: 'Cryptomus (USDT)',
    timestamp: new Date().toISOString()
  };
  
  try {
    console.log('📤 إرسال إشعار طلب جديد...');
    await sendDatabaseNotification('new-order', newOrderData);
    console.log('✅ تم إرسال إشعار الطلب الجديد');
  } catch (error) {
    console.error('❌ خطأ في إرسال إشعار الطلب الجديد:', error.message);
  }
  
  // انتظار قليل
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n=== اختبار إشعار تأكيد الدفع ===');
  
  // بيانات اختبار لتأكيد الدفع
  const paymentConfirmedData = {
    orderId: 'cm_order_1755432978430_uyt2emv8w',
    customerName: 'gamalkhaled981@gmail.com',
    game: 'Black Desert Online',
    service: 'Power Leveling',
    price: 0.56,
    status: 'completed',
    paymentMethod: 'Cryptomus (USDT)',
    timestamp: new Date().toISOString()
  };
  
  try {
    console.log('📤 إرسال إشعار تأكيد الدفع...');
    await sendDatabaseNotification('payment-confirmed', paymentConfirmedData);
    console.log('✅ تم إرسال إشعار تأكيد الدفع');
  } catch (error) {
    console.error('❌ خطأ في إرسال إشعار تأكيد الدفع:', error.message);
  }
  
  // انتظار قليل ثم فحص السجل
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n📋 فحص سجل admin-notifications.log...');
  try {
    const adminLog = fs.readFileSync('logs/admin-notifications.log', 'utf8');
    const lines = adminLog.trim().split('\n').filter(line => line.trim());
    
    console.log(`عدد الإدخالات في السجل: ${lines.length}`);
    
    if (lines.length > 0) {
      console.log('✅ تم العثور على إدخالات في السجل:');
      lines.forEach((line, index) => {
        try {
          const entry = JSON.parse(line);
          console.log(`  ${index + 1}. النوع: ${entry.type}, الطلب: ${entry.orderId}, الوقت: ${entry.timestamp}`);
        } catch (parseError) {
          console.log(`  ${index + 1}. ${line}`);
        }
      });
      
      // البحث عن إشعارات محددة
      const newOrderNotifications = lines.filter(line => {
        try {
          const entry = JSON.parse(line);
          return entry.type === 'new-order' && entry.orderId.includes('test_new_order');
        } catch { return false; }
      });
      
      const paymentConfirmedNotifications = lines.filter(line => {
        try {
          const entry = JSON.parse(line);
          return entry.type === 'payment-confirmed' && entry.orderId === 'cm_order_1755432978430_uyt2emv8w';
        } catch { return false; }
      });
      
      console.log(`\n🎯 نتائج البحث:`);
      console.log(`   - إشعارات الطلبات الجديدة: ${newOrderNotifications.length > 0 ? '✅ موجود' : '❌ غير موجود'}`);
      console.log(`   - إشعارات تأكيد الدفع: ${paymentConfirmedNotifications.length > 0 ? '✅ موجود' : '❌ غير موجود'}`);
      
    } else {
      console.log('❌ لا توجد إدخالات في السجل');
    }
    
  } catch (error) {
    console.error('❌ خطأ في قراءة سجل الإشعارات:', error.message);
  }
}

testCompleteNotifications().catch(console.error);