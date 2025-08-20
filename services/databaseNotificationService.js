/**
 * Database Notification Service
 * Monitors database changes and sends notifications to admins
 */

const fs = require('fs');
const path = require('path');
const { sendRealtimeNotification, sendBrowserNotification } = require('./realtimeNotificationService');

// Use shared Prisma Client instance
const prisma = require('../lib/prisma');

// Notification log file path
const NOTIFICATION_LOG_FILE = path.join(__dirname, '../logs/admin-notifications.log');

// Ensure logs directory exists
function ensureLogsDirectory() {
  const logsDir = path.dirname(NOTIFICATION_LOG_FILE);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

// Get admin users from database
async function getAdminUsers() {
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'ADMIN' }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    return adminUsers;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }
}

// Log notification to file
function logNotification(type, data) {
  ensureLogsDirectory();
  
  const logEntry = {
    type,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  
  try {
    fs.appendFileSync(NOTIFICATION_LOG_FILE, logLine);
  } catch (error) {
    console.error('Error writing to notification log:', error);
  }
}

// Send console notification
function sendConsoleNotification(type, data, adminUsers) {
  const timestamp = new Date().toLocaleString('ar-EG', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🔔 إشعار جديد للإدارة | New Admin Notification');
  console.log('='.repeat(80));
  console.log(`⏰ الوقت | Time: ${timestamp}`);
  console.log(`📋 النوع | Type: ${type}`);
  
  if (type === 'new_order') {
    console.log(`🆔 رقم الطلب | Order ID: ${data.orderId}`);
    console.log(`👤 اسم العميل | Customer: ${data.customerName}`);
    console.log(`🎮 اللعبة | Game: ${data.game}`);
    console.log(`⚡ الخدمة | Service: ${data.service}`);
    console.log(`💰 السعر | Price: $${data.price}`);
    console.log(`📊 الحالة | Status: ${data.status}`);
    console.log(`💳 طريقة الدفع | Payment: ${data.paymentMethod}`);
  } else if (type === 'payment-confirmed') {
    console.log(`🆔 رقم الطلب | Order ID: ${data.orderId}`);
    console.log(`👤 اسم العميل | Customer: ${data.customerName}`);
    console.log(`🎮 اللعبة | Game: ${data.game}`);
    console.log(`⚡ الخدمة | Service: ${data.service}`);
    console.log(`💰 السعر | Price: $${data.price}`);
    console.log(`📊 الحالة | Status: ${data.status}`);
    console.log(`💳 طريقة الدفع | Payment: ${data.paymentMethod}`);
    console.log(`✅ تم تأكيد الدفع | Payment Confirmed`);
  }
  
  console.log(`👥 عدد المديرين | Admin Count: ${adminUsers.length}`);
  console.log(`📧 إيميلات المديرين | Admin Emails: ${adminUsers.map(admin => admin.email).join(', ')}`);
  console.log(`🌐 لوحة الإدارة | Admin Panel: https://gear-score.com/admin/notifications`);
  console.log('='.repeat(80) + '\n');
}

// Main notification function
async function sendDatabaseNotification(type, data) {
  try {
    // Get admin users
    const adminUsers = await getAdminUsers();
    
    if (adminUsers.length === 0) {
      console.warn('⚠️ No admin users found for notification');
      return;
    }
    
    // Prepare notification data
    const notificationData = {
      ...data,
      adminCount: adminUsers.length,
      adminEmails: adminUsers.map(admin => admin.email)
    };
    
    // Send console notification
    sendConsoleNotification(type, data, adminUsers);
    
    // Log notification
    logNotification(type, notificationData);
    
    // Store notification in database for admin panel (this also handles Socket.IO)
    await storeNotificationInDatabase(type, notificationData, adminUsers);
    
    // Send browser notification
    sendBrowserNotification(type, data);
    
    // Open popup notification window
    openNotificationPopup(type, data);
    
    // Note: Real-time Socket.IO notification is handled inside storeNotificationInDatabase
    // to prevent duplicate Socket.IO emissions
    
    console.log(`✅ Database notification sent successfully to ${adminUsers.length} admin(s)`);
    
    // If this is a payment confirmation and we have userId, send notification to user
    if (type === 'payment-confirmed' && data.userId) {
      try {
        console.log('📤 Sending payment confirmation notification to user:', data.userId);
        
        // First check if user exists
        const userExists = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { id: true }
        });
        
        if (userExists) {
          const userNotification = await prisma.notification.create({
            data: {
              type: 'payment-confirmed',
              title: 'تأكيد دفع',
              message: `تم تأكيد دفعتك بنجاح للطلب ${data.orderId}. سيتم البدء في تنفيذ الخدمة قريباً.`,
              data: {
                orderId: data.orderId,
                paymentAmount: data.price,
                currency: 'USD',
                game: data.game,
                service: data.service
              },
              userId: data.userId,
              read: false
            }
          });
          
          console.log('✅ User notification created successfully:', userNotification.id);
        } else {
          console.warn('⚠️ User not found, skipping user notification for userId:', data.userId);
        }
        
        // Send real-time notification to user if possible
        const { emitToUser } = require('../lib/socket-cjs');
        try {
          emitToUser(data.userId, 'new-notification', {
            id: userNotification.id,
            type: 'payment-confirmed',
            title: 'تأكيد دفع',
            message: `تم تأكيد دفعتك بنجاح للطلب ${data.orderId}. سيتم البدء في تنفيذ الخدمة قريباً.`,
            timestamp: userNotification.createdAt
          });
          console.log('📡 Real-time notification sent to user:', data.userId);
        } catch (socketError) {
          console.log('⚠️ Socket.IO not available for user notification, notification stored in database only');
        }
        
      } catch (userNotificationError) {
        console.error('❌ Error sending user notification:', userNotificationError);
      }
    }
    
  } catch (error) {
    console.error('❌ Error sending database notification:', error);
  }
}

// Store notification in database for admin panel using new API
async function storeNotificationInDatabase(type, data, adminUsers) {
  try {
    // Use the new notification creation API internally
    const axios = require('axios');
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const notificationData = {
      type: type,
      title: getNotificationTitle(type, data),
      message: getNotificationMessage(type, data),
      data: data
    };
    
    // Create a single notification for all admin users (collective notification)
    // Instead of creating separate notifications for each admin, create one shared notification
    const adminUserIds = adminUsers.map(admin => admin.id);
    
    const notification = await prisma.notification.create({
      data: {
        type: type,
        title: getNotificationTitle(type, data),
        message: getNotificationMessage(type, data),
        data: data, // Keep original data separate
        userId: null, // Admin notifications should not have userId
        read: false,
        isCollectiveAdminNotification: true, // Use the new schema field
        adminUserIds: adminUserIds // Store admin IDs in the new schema field
      }
    });
    
    console.log(`📝 ✅ Stored 1 collective notification for ${adminUsers.length} admin(s) in database`);
    const notifications = [notification]; // Keep array format for compatibility
    
    // Send real-time notification via Socket.IO
    const { emitToAdmin } = require('../lib/socket-cjs');
    try {
      emitToAdmin('new-notification', {
        type,
        title: getNotificationTitle(type, data),
        message: getNotificationMessage(type, data),
        data,
        notifications: notifications.length,
        timestamp: new Date().toISOString()
      });
      console.log(`🔔 Real-time collective notification sent to admin room (${adminUsers.length} admin(s))`);
    } catch (socketError) {
      console.warn('⚠️ Socket.IO not available for real-time notification:', socketError.message);
    }
    
  } catch (error) {
    console.error('❌ Error storing notification in database:', error);
  }
}

// Get notification title based on type
function getNotificationTitle(type, data) {
  switch (type) {
    case 'new_order':
      return `طلب جديد - ${data.game}`;
    case 'payment-confirmed':
      return `تأكيد دفع - ${data.game}`;
    default:
      return 'إشعار جديد';
  }
}

// Get notification message based on type
function getNotificationMessage(type, data) {
  switch (type) {
    case 'new_order':
      return `طلب جديد من ${data.customerName} للعبة ${data.game} - الخدمة: ${data.service} - السعر: $${data.price}`;
    case 'payment-confirmed':
      return `تم تأكيد دفع الطلب ${data.orderId} من ${data.customerName} للعبة ${data.game} - السعر: $${data.price}`;
    default:
      return 'إشعار جديد';
  }
}

// Setup Prisma middleware to monitor order creation
// Track which Prisma clients already have middleware to prevent duplicates
const middlewareSetupClients = new WeakSet();

function setupDatabaseMonitoring(prismaClient = prisma) {
  console.log('🔧 Setting up middleware on Prisma client:', !!prismaClient);
  
  // Check if middleware is already setup on this client
  if (middlewareSetupClients.has(prismaClient)) {
    console.log('⚠️ Middleware already setup on this Prisma client, skipping to prevent duplicates');
    return;
  }
  
  // Setup middleware on the provided client
  prismaClient.$use(async (params, next) => {
    console.log('🔍 Middleware intercepted:', params.model, params.action);
    const result = await next(params);
    
    // Monitor Order creation
    if (params.model === 'Order' && params.action === 'create') {
      const orderData = result;
      
      console.log('🔔 Middleware triggered for new order:', orderData.id);
      
      // Skip notifications if we're in webhook context
      if (global.isWebhookContext) {
        console.log('🚫 Skipping middleware notification - webhook context detected for order:', orderData.id);
        return result;
      }
      
      // Also skip if this order has a paymentId (created from webhook)
      if (orderData.paymentId) {
        console.log('🚫 Skipping middleware notification - webhook-created order detected:', orderData.id, 'paymentId:', orderData.paymentId);
        return result;
      }
      
      // Only send 'new-order' notification for manually created orders (no paymentId)
      // Orders created from webhook payments should only get 'payment-confirmed' notifications
      if (!orderData.paymentId) {
        console.log('📝 Sending new-order notification for manually created order:', orderData.id);
        
        // Send notification for new order
        await sendDatabaseNotification('new-order', {
          orderId: orderData.id,
          customerName: orderData.customerName,
          game: orderData.game,
          service: orderData.service,
          price: orderData.price,
          status: orderData.status,
          paymentMethod: 'Manual',
          timestamp: orderData.date.toISOString()
        });
      } else {
        console.log('💳 Skipping new-order notification for payment-created order:', orderData.id, '(will get payment-confirmed instead)');
      }
    }
    
    return result;
  });
  
  // Mark this client as having middleware setup
  middlewareSetupClients.add(prismaClient);
  
  console.log('✅ Database monitoring middleware setup complete');
}

// Open notification popup window
function openNotificationPopup(type, data) {
  try {
    // Prepare notification data for popup
    const notificationData = {
      id: `${type}_${data.orderId || Date.now()}_${Date.now()}`,
      type: type,
      title: getNotificationTitle(type, data),
      message: getNotificationMessage(type, data),
      data: data,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Create popup URL with notification data
    const popupData = encodeURIComponent(JSON.stringify(notificationData));
    const popupUrl = `https://gear-score.com/admin/notification-popup?data=${popupData}`;
    
    // Log popup creation (since we can't actually open windows from server-side)
    console.log('🪟 POPUP NOTIFICATION CREATED:');
    console.log('📋 Popup URL:', popupUrl);
    console.log('📊 Notification Data:', JSON.stringify(notificationData, null, 2));
    console.log('💡 To test: Open this URL in a new browser window');
    console.log('================================================================================');
    
    // In a real-world scenario, you might:
    // 1. Send this URL via WebSocket to connected admin clients
    // 2. Use a desktop notification service
    // 3. Send via email with a link to open the popup
    // 4. Use a browser extension to open the popup
    
    // For now, we'll emit this via Socket.IO if available
    const { emitToAdmin } = require('../lib/socket-cjs');
    if (emitToAdmin) {
      emitToAdmin('open-popup', {
        url: popupUrl,
        notification: notificationData,
        timestamp: new Date().toISOString()
      });
      console.log('📡 Popup URL sent via Socket.IO to admin clients');
    }
    
  } catch (error) {
    console.error('❌ Error creating notification popup:', error);
  }
}

module.exports = {
  setupDatabaseMonitoring,
  sendDatabaseNotification,
  getAdminUsers,
  openNotificationPopup,
  prisma
};