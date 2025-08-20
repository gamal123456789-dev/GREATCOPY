const io = require('socket.io-client');
const axios = require('axios');

console.log('🔔 اختبار نظام الإشعارات البسيط...');

// Connect as admin first
const adminSocket = io('http://localhost:5201', {
    transports: ['websocket', 'polling']
});

adminSocket.on('connect', () => {
    console.log('✅ تم الاتصال كمدير - ID:', adminSocket.id);
    adminSocket.emit('join-admin-room');
    console.log('🏠 انضمام لغرفة الإدارة');
    
    // Send test notification after joining admin room
    setTimeout(async () => {
        console.log('📡 إرسال طلب تجريبي...');
        
        try {
            const response = await axios.post('http://localhost:5201/api/notifications/send', {
                type: 'admin',
                event: 'new-order',
                data: {
                    id: `SIMPLE_TEST_${Date.now()}`,
                    customerName: 'عميل تجريبي',
                    game: 'Destiny 2',
                    service: 'Test Service',
                    amount: 25
                }
            });
            
            console.log('✅ تم إرسال الطلب - Status:', response.status);
        } catch (error) {
            console.error('❌ خطأ في إرسال الطلب:', error.message);
        }
    }, 2000);
});

adminSocket.on('new-order', (orderData) => {
    console.log('🔔 تم استلام إشعار طلب جديد!');
    console.log('📦 بيانات الطلب:', JSON.stringify(orderData, null, 2));
});

adminSocket.on('admin-notification', (data) => {
    console.log('📢 إشعار إداري!');
    console.log('📋 البيانات:', JSON.stringify(data, null, 2));
});

adminSocket.on('disconnect', () => {
    console.log('❌ انقطع الاتصال');
});

adminSocket.on('connect_error', (error) => {
    console.error('❌ خطأ في الاتصال:', error.message);
});

// Exit after 8 seconds
setTimeout(() => {
    console.log('🔚 انتهاء الاختبار');
    adminSocket.disconnect();
    process.exit(0);
}, 8000);