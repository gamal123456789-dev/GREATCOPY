/**
 * Notification Service
 * Handles sending notifications to admins when new orders are created
 */

const { emitToAdmin } = require('./socket-cjs');
const { emitToAdminWithFallback, emitToUserWithFallback } = require('./fallback-notifications');

/**
 * Send notification to admin about new order
 * @param {Object} orderData - Order information
 * @param {string} orderData.orderId - Order ID
 * @param {string} orderData.customerName - Customer name/email
 * @param {string} orderData.game - Game name
 * @param {string} orderData.service - Service type
 * @param {number} orderData.price - Order price
 * @param {string} orderData.paymentMethod - Payment method used
 * @param {Date} orderData.createdAt - Order creation date
 */
async function sendNewOrderNotification(orderData) {
  try {
    console.log('Sending new order notification to admin:', orderData.orderId);
    
    // Send real-time notification via socket with fallback
    await emitToAdminWithFallback('new-notification', {
      orderId: orderData.orderId,
      customerName: orderData.customerName,
      game: orderData.game,
      service: orderData.service,
      price: orderData.price,
      status: orderData.status || 'pending',
      paymentMethod: orderData.paymentMethod,
      createdAt: orderData.createdAt,
      message: `طلب جديد تم إنشاؤه: ${orderData.game} - ${orderData.service}`,
      type: 'new_order',
      priority: 'high'
    });
    
    console.log('New order notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending new order notification:', error);
    return false;
  }
}

/**
 * Send notification to admin about payment confirmation
 * @param {Object} orderData - Order information
 */
function sendPaymentConfirmationNotification(orderData) {
  try {
    console.log('Sending payment confirmation notification to admin:', orderData.orderId);
    
    emitToAdmin('new-notification', {
      orderId: orderData.orderId,
      customerName: orderData.customerName,
      game: orderData.game,
      service: orderData.service,
      price: orderData.price,
      status: 'completed',
      paymentMethod: orderData.paymentMethod,
      confirmedAt: new Date(),
      message: `تم تأكيد الدفع للطلب: ${orderData.orderId}`,
      type: 'payment_confirmed',
      priority: 'high'
    });
    
    console.log('Payment confirmation notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending payment confirmation notification:', error);
    return false;
  }
}

/**
 * Send notification to user about order creation
 * @param {string} userId - User ID
 * @param {Object} orderData - Order information
 */
async function sendOrderCreatedNotification(userId, orderData) {
  try {
    console.log('Sending order created notification to user:', userId);
    
    await emitToUserWithFallback(userId, 'orderCreated', {
      orderId: orderData.orderId,
      game: orderData.game,
      service: orderData.service,
      amount: orderData.price,
      status: orderData.status || 'pending',
      message: 'تم تأكيد الدفع بنجاح وإنشاء طلبك! سيتم التواصل معك قريباً.',
      type: 'order_created',
      createdAt: orderData.createdAt
    });
    
    console.log('Order created notification sent to user successfully');
    return true;
  } catch (error) {
    console.error('Error sending order created notification to user:', error);
    return false;
  }
}

/**
 * Send comprehensive notification for new order (both admin and user)
 * @param {string} userId - User ID
 * @param {Object} orderData - Complete order information
 */
async function sendCompleteOrderNotifications(userId, orderData) {
  try {
    console.log('Sending complete order notifications for:', orderData.orderId);
    
    // Send notification to user
    await sendOrderCreatedNotification(userId, orderData);
    
    // Send notification to admin
    await sendNewOrderNotification(orderData);
    
    console.log('Complete order notifications sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending complete order notifications:', error);
    return false;
  }
}

module.exports = {
  sendNewOrderNotification,
  sendPaymentConfirmationNotification,
  sendOrderCreatedNotification,
  sendCompleteOrderNotifications
};