/**
 * Real-time Notification Service
 * Handles real-time notifications using WebSocket/Socket.IO
 */

const { emitToAdmin } = require('../lib/socket-cjs');

// Send real-time notification to all admin users with sound support
function sendRealtimeNotification(type, data) {
  try {
    const notificationPayload = {
      id: `${type}_${data.orderId || Date.now()}_${Date.now()}`,
      type: type,
      title: getNotificationTitle(type, data),
      message: getNotificationMessage(type, data),
      data: data,
      timestamp: new Date().toISOString(),
      read: false,
      playSound: true, // Enable sound for collective notifications
      soundType: type === 'payment-confirmed' ? 'notification' : 'notification'
    };
    
    // Emit to all admin users via Socket.IO
    emitToAdmin('new-notification', notificationPayload);
    
    console.log(`📡 Real-time notification with sound sent to admins: ${type}`);
    
  } catch (error) {
    console.error('❌ Error sending real-time notification:', error);
  }
}

// Send notification count update to admins
function sendNotificationCountUpdate(unreadCount) {
  try {
    emitToAdmin('notificationCountUpdate', { unreadCount });
    console.log(`📊 Notification count update sent to admins: ${unreadCount}`);
  } catch (error) {
    console.error('❌ Error sending notification count update:', error);
  }
}

// Get notification title based on type
function getNotificationTitle(type, data) {
  switch (type) {
    case 'new_order':
      return `طلب جديد - ${data.game || 'غير محدد'}`;
    case 'payment_confirmed':
      return `تأكيد دفع - ${data.game || 'غير محدد'}`;
    case 'order_cancelled':
      return `إلغاء طلب - ${data.game || 'غير محدد'}`;
    default:
      return 'إشعار جديد';
  }
}

// Get notification message based on type
function getNotificationMessage(type, data) {
  switch (type) {
    case 'new_order':
      return `طلب جديد من ${data.customerName || 'عميل'} للعبة ${data.game || 'غير محدد'} - الخدمة: ${data.service || 'غير محدد'} - السعر: $${data.price || '0'}`;
    case 'payment_confirmed':
      return `تم تأكيد دفع الطلب ${data.orderId} بقيمة $${data.price || '0'}`;
    case 'order_cancelled':
      return `تم إلغاء الطلب ${data.orderId} للعبة ${data.game || 'غير محدد'}`;
    default:
      return 'إشعار جديد';
  }
}

// Send browser notification with sound support (if supported)
function sendBrowserNotification(type, data) {
  const notificationData = {
    title: getNotificationTitle(type, data),
    message: getNotificationMessage(type, data),
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `${type}_${data.orderId || Date.now()}`,
    requireInteraction: true,
    data: data,
    playSound: true, // Enable sound for browser notifications
    soundType: type === 'payment-confirmed' ? 'notification' : 'notification'
  };
  
  // Emit browser notification request to admins with sound
  emitToAdmin('browserNotification', notificationData);
  console.log(`🔔 Browser notification with sound sent for: ${type}`);
}

module.exports = {
  sendRealtimeNotification,
  sendNotificationCountUpdate,
  sendBrowserNotification
};