const { PrismaClient } = require('@prisma/client');
const { sendDatabaseNotification } = require('./services/databaseNotificationService');
const io = require('socket.io-client');
const fs = require('fs');

const prisma = new PrismaClient();

console.log('🔔 اختبار نظام الإشعارات للمشرفين');
console.log('='.repeat(50));

// اختبار شامل لنظام الإشعارات
async function testAdminNotificationSystem() {
  try {
    // 1. التحقق من وجود مشرفين في النظام
    console.log('1️⃣ فحص المشرفين في النظام...');
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true, name: true }
    });
    
    console.log(`عدد المشرفين: ${admins.length}`);
    if (admins.length === 0) {
      console.log('❌ لا يوجد مشرفين في النظام!');
      return;
    }
    
    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.email} (${admin.name || 'بدون اسم'})`);
    });
    
    // 2. اختبار الاتصال بـ Socket.IO
    console.log('\n2️⃣ اختبار الاتصال بخادم Socket.IO...');
    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 3000
    });
    
    let socketConnected = false;
    
    socket.on('connect', () => {
      console.log('✅ نجح الاتصال بخادم Socket.IO');
      socketConnected = true;
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ فشل الاتصال بخادم Socket.IO:', error.message);
    });
    
    // انتظار لمدة 3 ثوان للاتصال
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. إنشاء طلب جديد واختبار الإشعار
    console.log('\n3️⃣ إنشاء طلب جديد واختبار الإشعار...');
    
    const testOrderId = `admin_notification_test_${Date.now()}`;
    const testOrder = {
      id: testOrderId,
      customerName: 'عميل اختبار الإشعارات',
      game: 'لعبة اختبار الإشعارات',
      service: 'خدمة اختبار الإشعارات للمشرفين',
      price: 29.99,
      status: 'pending',
      paymentId: `payment_${Date.now()}`,
      date: new Date()
    };
    
    // إنشاء الطلب في قاعدة البيانات
    const createdOrder = await prisma.order.create({
      data: testOrder
    });
    
    console.log(`✅ تم إنشاء الطلب: ${createdOrder.id}`);
    
    // انتظار قليل للسماح للـ middleware بالعمل
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. فحص سجل الإشعارات
    console.log('\n4️⃣ فحص سجل الإشعارات...');
    
    if (fs.existsSync('logs/admin-notifications.log')) {
      const logContent = fs.readFileSync('logs/admin-notifications.log', 'utf8');
      const lines = logContent.trim().split('\n').filter(line => line.trim());
      
      // البحث عن الإشعار الخاص بالطلب الجديد
      const testNotification = lines.find(line => {
        try {
          const notification = JSON.parse(line);
          return notification.orderId === testOrderId;
        } catch (e) {
          return false;
        }
      });
      
      if (testNotification) {
        console.log('✅ تم العثور على الإشعار في السجل');
        const notification = JSON.parse(testNotification);
        console.log(`   معرف الطلب: ${notification.orderId}`);
        console.log(`   اسم العميل: ${notification.customerName}`);
        console.log(`   وقت الإشعار: ${new Date(notification.timestamp).toLocaleString('ar-EG')}`);
      } else {
        console.log('❌ لم يتم العثور على الإشعار في السجل');
      }
      
      console.log(`\nإجمالي الإشعارات في السجل: ${lines.length}`);
    } else {
      console.log('❌ ملف سجل الإشعارات غير موجود');
    }
    
    // 5. اختبار إرسال إشعار مباشر
    console.log('\n5️⃣ اختبار إرسال إشعار مباشر...');
    
    try {
      await sendDatabaseNotification('new_order', {
        orderId: `direct_admin_test_${Date.now()}`,
        customerName: 'عميل اختبار مباشر',
        game: 'لعبة اختبار مباشر',
        service: 'خدمة اختبار مباشر',
        price: 19.99,
        status: 'pending',
        paymentMethod: 'اختبار مباشر',
        adminEmails: admins.map(admin => admin.email)
      });
      
      console.log('✅ تم إرسال الإشعار المباشر بنجاح');
    } catch (error) {
      console.log('❌ فشل في إرسال الإشعار المباشر:', error.message);
    }
    
    // 6. التحقق من آخر الإشعارات
    console.log('\n6️⃣ آخر 3 إشعارات في النظام:');
    
    if (fs.existsSync('logs/admin-notifications.log')) {
      const logContent = fs.readFileSync('logs/admin-notifications.log', 'utf8');
      const lines = logContent.trim().split('\n').filter(line => line.trim());
      
      lines.slice(-3).forEach((line, index) => {
        try {
          const notification = JSON.parse(line);
          console.log(`${index + 1}. ${notification.type} - ${notification.orderId}`);
          console.log(`   العميل: ${notification.customerName}`);
          console.log(`   الوقت: ${new Date(notification.timestamp).toLocaleString('ar-EG')}`);
          console.log('');
        } catch (e) {
          console.log(`${index + 1}. خطأ في تحليل الإشعار`);
        }
      });
    }
    
    socket.disconnect();
    
  } catch (error) {
    console.error('❌ خطأ في اختبار نظام الإشعارات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminNotificationSystem();