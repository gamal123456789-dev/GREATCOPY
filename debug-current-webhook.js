const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');

async function debugCurrentWebhook() {
  console.log('🔍 تشخيص مشكلة الـ webhook الحالية...');
  
  // استخدام بيانات حقيقية من السجل
  const webhookData = {
    "type": "payment",
    "uuid": "57e2ae53-f78b-4e8b-a0d6-bdbe033240b6",
    "order_id": "cm_order_1755432978430_uyt2emv8w",
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
    "transfer_id": "fb9fa611-e59b-4d3c-9433-442a5a16b8cb"
  };
  
  // إنشاء التوقيع الصحيح
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  
  // إزالة حقل sign من البيانات قبل إنشاء التوقيع
  const bodyForSignature = { ...webhookData };
  delete bodyForSignature.sign;
  
  const dataString = Buffer.from(JSON.stringify(bodyForSignature)).toString('base64');
  const signature = crypto
    .createHash('md5')
    .update(dataString + apiKey)
    .digest('hex');
  
  console.log('📝 بيانات الـ webhook:', JSON.stringify(webhookData, null, 2));
  console.log('🔐 التوقيع المحسوب:', signature);
  
  try {
    console.log('📡 إرسال طلب الـ webhook...');
    
    const response = await axios.post('http://localhost:5201/api/pay/cryptomus/webhook', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      },
      timeout: 10000
    });
    
    console.log('✅ استجابة الـ webhook:', response.status, response.data);
    
    // انتظار قليل ثم فحص السجلات
    setTimeout(() => {
      console.log('\n📋 فحص سجل webhook-debug.log...');
      try {
        const debugLog = fs.readFileSync('logs/webhook-debug.log', 'utf8');
        const lines = debugLog.trim().split('\n');
        const lastLines = lines.slice(-10);
        
        console.log('آخر 10 إدخالات في سجل التشخيص:');
        lastLines.forEach((line, index) => {
          console.log(`  ${index + 1}. ${line}`);
        });
        
      } catch (logError) {
        console.log('❌ لا يمكن قراءة سجل التشخيص:', logError.message);
      }
      
      console.log('\n📋 فحص سجل admin-notifications.log...');
      try {
        const adminLog = fs.readFileSync('logs/admin-notifications.log', 'utf8');
        const lines = adminLog.trim().split('\n');
        const lastLines = lines.slice(-5);
        
        console.log('آخر 5 إشعارات إدارية:');
        lastLines.forEach((line, index) => {
          console.log(`  ${index + 1}. ${line}`);
        });
        
        // البحث عن الطلب المحدد
        const hasOrderNotification = adminLog.includes('cm_order_1755432978430_uyt2emv8w');
        console.log('\n🎯 هل تم العثور على إشعار الطلب:', hasOrderNotification ? '✅ نعم' : '❌ لا');
        
      } catch (logError) {
        console.log('❌ لا يمكن قراءة سجل الإشعارات الإدارية:', logError.message);
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ فشل اختبار الـ webhook:', error.message);
    if (error.response) {
      console.error('   حالة الاستجابة:', error.response.status);
      console.error('   بيانات الاستجابة:', error.response.data);
    }
  }
}

// تشغيل الاختبار
debugCurrentWebhook();