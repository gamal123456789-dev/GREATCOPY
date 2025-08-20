const crypto = require('crypto');
const fs = require('fs');

async function finalWebhookTest() {
  console.log('🚀 اختبار نهائي شامل لنظام webhook والإشعارات...');
  
  // مسح سجلات التشخيص
  try {
    fs.writeFileSync('logs/webhook-debug.log', '');
    fs.writeFileSync('logs/admin-notifications.log', '');
    console.log('🗑️ تم مسح سجلات التشخيص');
  } catch (error) {
    console.log('⚠️ تحذير: لا يمكن مسح السجلات:', error.message);
  }
  
  const orderId = 'cm_order_1755432978430_uyt2emv8w';
  
  // إنشاء webhook payload لطلب موجود (تأكيد دفع)
  const webhookData = {
    type: 'payment',
    uuid: `test-uuid-${Date.now()}`,
    order_id: orderId,
    amount: '0.56000000',
    payment_amount: '0.55000000',
    payment_amount_usd: '0.55',
    merchant_amount: '0.53900000',
    commission: '0.01100000',
    is_final: true,
    status: 'paid',
    from: null,
    wallet_address_uuid: null,
    network: 'bsc',
    currency: 'USD',
    payer_currency: 'USDT',
    payer_amount: '0.55000000',
    payer_amount_exchange_rate: '1.00048341',
    additional_data: JSON.stringify({
      user_id: '7d14fc11-a0bf-449f-97af-6c3e9faa8841',
      game: 'Black Desert Online',
      service: 'Power Leveling',
      customer_email: 'gamalkhaled981@gmail.com'
    }),
    transfer_id: `test-transfer-${Date.now()}`
  };
  
  // حساب التوقيع
  const bodyForSignature = { ...webhookData };
  delete bodyForSignature.sign;
  const base64Body = Buffer.from(JSON.stringify(bodyForSignature)).toString('base64');
  const apiKey = process.env.CRYPTOMUS_API_KEY || 'test-api-key';
  const signature = crypto.createHash('md5').update(base64Body + apiKey).digest('hex');
  
  console.log(`📝 معرف الطلب: ${orderId}`);
  console.log(`🔐 التوقيع: ${signature}`);
  
  // إرسال webhook
  try {
    console.log('📡 إرسال webhook لتأكيد الدفع...');
    
    const response = await fetch('http://localhost:5201/api/pay/cryptomus/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      },
      body: JSON.stringify(webhookData)
    });
    
    const result = await response.json();
    console.log(`✅ استجابة الـ webhook: ${response.status}`, result);
    
  } catch (error) {
    console.error('❌ خطأ في إرسال webhook:', error.message);
    return;
  }
  
  // انتظار معالجة الطلب
  console.log('⏳ انتظار معالجة الطلب...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // فحص سجل webhook-debug.log
  console.log('\n📋 فحص سجل webhook-debug.log...');
  try {
    const webhookLog = fs.readFileSync('logs/webhook-debug.log', 'utf8');
    const webhookLines = webhookLog.trim().split('\n').filter(line => line.trim());
    
    console.log(`عدد إدخالات webhook: ${webhookLines.length}`);
    webhookLines.forEach((line, index) => {
      console.log(`  ${index + 1}. ${line}`);
    });
    
    const hasWebhookReceived = webhookLines.some(line => line.includes('WEBHOOK RECEIVED'));
    const hasPaymentConfirmation = webhookLines.some(line => line.includes('PAYMENT CONFIRMATION NOTIFICATION SENT'));
    
    console.log(`\n🎯 تحليل سجل webhook:`);
    console.log(`   - تم استقبال webhook: ${hasWebhookReceived ? '✅ نعم' : '❌ لا'}`);
    console.log(`   - تم إرسال إشعار تأكيد الدفع: ${hasPaymentConfirmation ? '✅ نعم' : '❌ لا'}`);
    
  } catch (error) {
    console.error('❌ خطأ في قراءة سجل webhook:', error.message);
  }
  
  // فحص سجل admin-notifications.log
  console.log('\n📋 فحص سجل admin-notifications.log...');
  try {
    const adminLog = fs.readFileSync('logs/admin-notifications.log', 'utf8');
    const adminLines = adminLog.trim().split('\n').filter(line => line.trim());
    
    console.log(`عدد إدخالات الإشعارات الإدارية: ${adminLines.length}`);
    
    if (adminLines.length > 0) {
      console.log('✅ الإشعارات الإدارية الموجودة:');
      adminLines.forEach((line, index) => {
        try {
          const entry = JSON.parse(line);
          console.log(`  ${index + 1}. النوع: ${entry.type}, الطلب: ${entry.orderId}, العميل: ${entry.customerName}`);
        } catch (parseError) {
          console.log(`  ${index + 1}. ${line}`);
        }
      });
      
      // البحث عن إشعار تأكيد الدفع للطلب المحدد
      const paymentConfirmedNotification = adminLines.find(line => {
        try {
          const entry = JSON.parse(line);
          return entry.type === 'payment-confirmed' && entry.orderId === orderId;
        } catch { return false; }
      });
      
      console.log(`\n🎯 نتيجة البحث عن إشعار تأكيد الدفع:`);
      console.log(`   - إشعار تأكيد الدفع للطلب ${orderId}: ${paymentConfirmedNotification ? '✅ موجود' : '❌ غير موجود'}`);
      
      if (paymentConfirmedNotification) {
        const notification = JSON.parse(paymentConfirmedNotification);
        console.log(`   - تفاصيل الإشعار:`);
        console.log(`     * النوع: ${notification.type}`);
        console.log(`     * الطلب: ${notification.orderId}`);
        console.log(`     * العميل: ${notification.customerName}`);
        console.log(`     * اللعبة: ${notification.game}`);
        console.log(`     * السعر: $${notification.price}`);
        console.log(`     * الحالة: ${notification.status}`);
        console.log(`     * الوقت: ${notification.timestamp}`);
      }
      
    } else {
      console.log('❌ لا توجد إشعارات إدارية في السجل');
    }
    
  } catch (error) {
    console.error('❌ خطأ في قراءة سجل الإشعارات الإدارية:', error.message);
  }
  
  console.log('\n🏁 انتهى الاختبار النهائي');
}

finalWebhookTest().catch(console.error);