/**
 * Admin Notification Service
 * Handles sending notifications to admin users when new orders are received
 */

const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Log file for notifications
const NOTIFICATION_LOG_FILE = path.join(__dirname, '../logs/admin-notifications.log');

/**
 * Ensure logs directory exists
 */
async function ensureLogsDirectory() {
  const logsDir = path.dirname(NOTIFICATION_LOG_FILE);
  try {
    await fs.mkdir(logsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating logs directory:', error.message);
  }
}

/**
 * Log notification to file
 */
async function logNotification(type, data) {
  try {
    await ensureLogsDirectory();
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: type,
      data: data,
      level: 'INFO'
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(NOTIFICATION_LOG_FILE, logLine);
    
    console.log(`📝 Notification logged: ${type}`);
  } catch (error) {
    console.error('❌ Error logging notification:', error.message);
  }
}

/**
 * Get all admin users from database
 */
async function getAdminUsers() {
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    return adminUsers;
  } catch (error) {
    console.error('❌ Error fetching admin users:', error.message);
    return [];
  }
}

/**
 * Send notification to admin console (fallback method)
 */
function sendConsoleNotification(data, adminUsers = []) {
  const timestamp = new Date(data.timestamp).toLocaleString('ar-EG', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  console.log('\n' + '='.repeat(80));
  console.log('🚨 إشعار طلب جديد للمديرين | ADMIN ORDER NOTIFICATION 🚨');
  console.log('='.repeat(80));
  console.log(`🆔 معرف الطلب | Order ID: ${data.orderId}`);
  console.log(`👤 العميل | Customer: ${data.customerName}`);
  console.log(`🎮 اللعبة | Game: ${data.game}`);
  console.log(`⚡ الخدمة | Service: ${data.service}`);
  console.log(`💰 السعر | Price: $${data.price}`);
  console.log(`📊 الحالة | Status: ${data.status}`);
  console.log(`💳 طريقة الدفع | Payment: ${data.paymentMethod || 'Cryptomus'}`);
  console.log(`⏰ الوقت | Time: ${timestamp}`);
  console.log('='.repeat(80));
  console.log(`👥 المديرين المستهدفين | Target Admins: ${adminUsers.length}`);
  adminUsers.forEach((admin, index) => {
    console.log(`   ${index + 1}. ${admin.name || admin.email} (${admin.email})`);
  });
  console.log('='.repeat(80));
  console.log('✅ تم إرسال الإشعار لجميع المديرين!');
  console.log('🔗 رابط لوحة الإدارة: https://gear-score.com/admin');
  console.log('='.repeat(80) + '\n');
}

/**
 * Send email notification (placeholder for future implementation)
 */
async function sendEmailNotification(data, adminUsers = []) {
  // TODO: Implement email notification
  console.log('📧 Email notification would be sent here');
  adminUsers.forEach(admin => {
    console.log(`📧 To: ${admin.email} (${admin.name || 'Admin'})`);
  });
  console.log('📧 Subject: طلب جديد - New Order:', data.orderId);
}

/**
 * Send SMS notification (placeholder for future implementation)
 */
async function sendSMSNotification(data, adminUsers = []) {
  // TODO: Implement SMS notification
  console.log('📱 SMS notification would be sent here');
  console.log(`📱 Target admins: ${adminUsers.length}`);
  console.log('📱 Message: طلب جديد بقيمة $' + data.price + ' - Order: ' + data.orderId);
}

/**
 * Main function to send new order notification
 */
async function sendNewOrderNotification(orderData) {
  try {
    console.log('🚀 Sending admin notification for order:', orderData.orderId);
    
    // Get admin users from database
    const adminUsers = await getAdminUsers();
    console.log(`📋 Found ${adminUsers.length} admin users`);
    
    // Prepare notification data
    const notificationData = {
      orderId: orderData.orderId,
      customerName: orderData.customerName || 'غير محدد',
      game: orderData.game,
      service: orderData.service,
      price: orderData.price,
      status: orderData.status || 'completed',
      paymentMethod: orderData.paymentMethod || 'Cryptomus (USDT)',
      timestamp: orderData.timestamp || new Date().toISOString()
    };
    
    // Send console notification (always works)
    sendConsoleNotification(notificationData, adminUsers);
    
    // Log notification
    await logNotification('new_order', {
      ...notificationData,
      adminCount: adminUsers.length,
      adminEmails: adminUsers.map(admin => admin.email)
    });
    
    // Send email notification (if configured)
    await sendEmailNotification(notificationData, adminUsers);
    
    // Send SMS notification (if configured)
    await sendSMSNotification(notificationData, adminUsers);
    
    console.log('✅ Admin notification sent successfully!');
    
    return {
      success: true,
      message: 'Notification sent successfully',
      orderId: orderData.orderId,
      adminCount: adminUsers.length
    };
    
  } catch (error) {
    console.error('❌ Error sending admin notification:', error.message);
    
    // Log error
    await logNotification('notification_error', {
      orderId: orderData.orderId,
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      message: error.message,
      orderId: orderData.orderId
    };
  }
}

/**
 * Get recent notifications from log file
 */
async function getRecentNotifications(limit = 10) {
  try {
    const logContent = await fs.readFile(NOTIFICATION_LOG_FILE, 'utf8');
    const lines = logContent.trim().split('\n').filter(line => line.trim());
    
    const notifications = lines
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(notification => notification !== null)
      .reverse(); // Most recent first
    
    return notifications;
  } catch (error) {
    console.error('Error reading notifications:', error.message);
    return [];
  }
}

module.exports = {
  sendNewOrderNotification,
  getRecentNotifications,
  logNotification,
  getAdminUsers
};