const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

async function testExistingOrderWebhook() {
  console.log('🔍 اختبار webhook مع طلب موجود...');
  
  // مسح سجل التشخيص أولاً
  fs.writeFileSync('logs/webhook-debug.log', '');
  console.log('🗑️ تم مسح سجل التشخيص');
  
  // استخدام بيانات طلب موجود
  const webhookData = {
    "type": "payment",
    "uuid": "test-uuid-" + Date.now(),
    "order_id": "cm_order_1755432978430_uyt2emv8w", // طلب موجود
    "amount": "0.56000000",
    "payment_amount": "0.55000000",
    "payment_amount_usd": "0.55",
    "merchant_amount": "0.53900000",
    "commission": "0.01100000",
    "is_final": true,
    "status": "paid",
    "from": null,
    "wallet_address_uuid": null,
    "network": "bsc",
    "currency": "USD",
    "payer_currency": "USDT",
    "payer_amount": "0.55000000",
    "payer_amount_exchange_rate": "1.00048341",
    "additional_data": "{\"user_id\":\"7d14fc11-a0bf-449f-97af-6c3e9faa8841\",\"game\":\"Black Desert Online\",\"service\":\"Power Leveling\",\"customer_email\":\"gamalkhaled981@gmail.com\"}",
    "transfer_id": "test-transfer-" + Date.now()
  };
  
  // إنشاء التوقيع
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  
  const bodyForSignature = { ...webhookData };
  delete bodyForSignature.sign;
  
  const dataString = Buffer.from(JSON.stringify(bodyForSignature)).toString('base64');
  const signature = crypto
    .createHash('md5')
    .update(dataString + apiKey)
    .digest('hex');
  
  console.log('📝 معرف الطلب:', webhookData.order_id);
  console.log('🔐 التوقيع:', signature);
  
  try {
    console.log('📡 إرسال webhook للطلب الموجود...');
    
    const response = await axios.post('http://localhost:5201/api/pay/cryptomus/webhook', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      },
      timeout: 15000
    });
    
    console.log('✅ استجابة الـ webhook:', response.status, response.data);
    
    // انتظار لمعالجة الإشعارات
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // فحص سجل التشخيص
    console.log('\n📋 فحص سجل webhook-debug.log...');
    try {
      const debugLog = fs.readFileSync('logs/webhook-debug.log', 'utf8');
      const lines = debugLog.trim().split('\n').filter(line => line.trim());
      
      console.log(`عدد الإدخالات في السجل: ${lines.length}`);
      lines.forEach((line, index) => {
        console.log(`  ${index + 1}. ${line}`);
      });
      
      // البحث عن رسائل محددة
      const hasPaymentConfirmation = debugLog.includes('PAYMENT CONFIRMATION NOTIFICATION SENT');
      const hasAdminNotification = debugLog.includes('Admin notification sent for payment confirmation');
      const hasError = debugLog.includes('ADMIN NOTIFICATION ERROR');
      
      console.log('\n🎯 نتائج التحليل:');
      console.log('   - إشعار تأكيد الدفع:', hasPaymentConfirmation ? '✅ تم' : '❌ لم يتم');
      console.log('   - إشعار إداري:', hasAdminNotification ? '✅ تم' : '❌ لم يتم');
      console.log('   - خطأ في الإشعار:', hasError ? '❌ نعم' : '✅ لا');
      
    } catch (logError) {
      console.log('❌ لا يمكن قراءة سجل التشخيص:', logError.message);
    }
    
    // فحص سجل الإشعارات الإدارية
    console.log('\n📋 فحص سجل admin-notifications.log...');
    try {
      const adminLog = fs.readFileSync('logs/admin-notifications.log', 'utf8');
      const lines = adminLog.trim().split('\n').filter(line => line.trim());
      const lastLines = lines.slice(-3);
      
      console.log('آخر 3 إشعارات إدارية:');
      lastLines.forEach((line, index) => {
        console.log(`  ${index + 1}. ${line}`);
      });
      
      // البحث عن الطلب المحدد
      const hasOrderNotification = adminLog.includes(webhookData.order_id);
      console.log('\n🎯 هل تم العثور على إشعار الطلب:', hasOrderNotification ? '✅ نعم' : '❌ لا');
      
    } catch (logError) {
      console.log('❌ لا يمكن قراءة سجل الإشعارات الإدارية:', logError.message);
    }
    
  } catch (error) {
    console.error('❌ فشل اختبار الـ webhook:', error.message);
    if (error.response) {
      console.error('   حالة الاستجابة:', error.response.status);
      console.error('   بيانات الاستجابة:', error.response.data);
    }
  }
}

// تشغيل الاختبار
testExistingOrderWebhook();