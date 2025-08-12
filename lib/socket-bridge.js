const { getSocketIO } = require('./socket-cjs');

/**
 * إرسال تحديث حالة الطلب
 * @param {Object} orderData - بيانات الطلب
 */
async function emitOrderStatusUpdate(orderData) {
  try {
    console.log('Starting Socket.IO Bridge Server...');
    console.log('📤 Emitting order status update:', orderData);
    
    const io = getSocketIO();
    console.log('🔍 Socket.IO instance check:', io ? 'AVAILABLE' : 'NOT AVAILABLE');
    if (!io) {
      console.warn('⚠️ Socket.IO instance not available');
      // Try again after a short delay
      setTimeout(() => {
        console.log('🔄 Retrying Socket.IO emission after delay...');
        const retryIo = getSocketIO();
        if (retryIo) {
          console.log('✅ Socket.IO instance now available on retry');
          emitOrderStatusUpdateInternal(orderData, retryIo);
        } else {
          console.error('❌ Socket.IO instance still not available after retry');
        }
      }, 100);
      return;
    }
    
    emitOrderStatusUpdateInternal(orderData, io);
  } catch (error) {
    console.error('❌ Failed to emit order status update:', error);
  }
}

function emitOrderStatusUpdateInternal(orderData, io) {
  try {
    
    // إرسال للمدراء
    io.to('admin').emit('order-status-updated', orderData);
    console.log('👑 Event sent to admin room');
    
    // إرسال للمستخدم صاحب الطلب
    if (orderData.userId) {
      io.to(`user:${orderData.userId}`).emit('order-status-updated', orderData);
      console.log(`👤 Event sent to user: ${orderData.userId}`);
    }
    
    // إرسال لغرفة الطلب
    if (orderData.orderId) {
      io.to(`order:${orderData.orderId}`).emit('order-status-updated', orderData);
      console.log(`📦 Event sent to order room: ${orderData.orderId}`);
    }
    
    console.log(`✅ Order status update sent for order: ${orderData.orderId}`);
  } catch (error) {
    console.error('❌ Failed to emit order status update internal:', error);
  }
}

/**
 * إرسال رسالة جديدة
 * @param {Object} messageInfo - معلومات الرسالة
 */
async function emitNewMessage(messageInfo) {
  try {
    const io = getSocketIO();
    if (!io) {
      console.warn('⚠️ Socket.IO instance not available');
      return;
    }
    
    // إرسال لغرفة الطلب أولاً
    if (messageInfo.orderId) {
      io.to(`order:${messageInfo.orderId}`).emit('new-message', messageInfo);
      console.log(`📨 Message sent to order room: order:${messageInfo.orderId}`);
    }
    
    // إرسال للمدراء
    io.to('admin').emit('new-message', messageInfo);
    console.log(`📨 Message sent to admin room`);
    
    // إرسال مباشر للمستخدم المحدد إذا كان متاحاً
    if (messageInfo.targetUserId) {
      io.to(`user:${messageInfo.targetUserId}`).emit('new-message', messageInfo);
      console.log(`📨 Direct message sent to user: ${messageInfo.targetUserId}`);
    }
    
    console.log(`✅ New message sent for order: ${messageInfo.orderId}`);
  } catch (error) {
    console.error('❌ Failed to emit new message:', error);
  }
}

/**
 * إرسال إشعار جديد
 * @param {Object} notificationData - بيانات الإشعار
 */
async function emitNewNotification(notificationData) {
  try {
    const io = getSocketIO();
    if (!io) {
      console.warn('⚠️ Socket.IO instance not available');
      return;
    }
    
    // إرسال للمستخدم المحدد
    if (notificationData.userId) {
      io.to(`user:${notificationData.userId}`).emit('new-notification', notificationData);
    }
    
    // إرسال للمدراء
    io.to('admin').emit('new-notification', notificationData);
    
    console.log(`✅ New notification sent to user: ${notificationData.userId}`);
  } catch (error) {
    console.error('❌ Failed to emit new notification:', error);
  }
}

/**
 * إرسال إشعار عام لجميع المستخدمين (بما في ذلك غير المسجلين)
 * @param {Object} notificationData - بيانات الإشعار
 */
async function emitGeneralNotification(notificationData) {
  try {
    const io = getSocketIO();
    if (!io) {
      console.warn('⚠️ Socket.IO instance not available');
      return;
    }
    
    // إرسال لجميع المستخدمين المتصلين (مسجلين وغير مسجلين)
    io.emit('new-notification', notificationData);
    
    // إرسال أيضاً لغرفة الإشعارات العامة للمستخدمين غير المسجلين
    io.to('general-notifications').emit('new-notification', notificationData);
    
    console.log(`✅ General notification sent to all users`);
  } catch (error) {
    console.error('❌ Failed to emit general notification:', error);
  }
}

// تصدير الدوال
module.exports = {
  emitOrderStatusUpdate,
  emitNewMessage,
  emitNewNotification,
  emitGeneralNotification
};