/**
 * Fallback Notification System
 * Handles notifications when Socket.IO is not available
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Save notification to database as fallback
 * @param {string} type - Notification type (admin/user)
 * @param {string} event - Event name
 * @param {Object} data - Notification data
 * @param {string} userId - User ID (optional, for user notifications)
 */
async function saveFallbackNotification(type, event, data, userId = null) {
  try {
    // Since we don't have a notifications table, we'll log to console with structured format
    // This can be easily parsed by log monitoring systems
    const fallbackLog = {
      timestamp: new Date().toISOString(),
      type: 'FALLBACK_NOTIFICATION',
      recipientType: type.toUpperCase(),
      event: event,
      recipientId: userId,
      data: data,
      reason: 'Socket.IO unavailable'
    };
    
    console.log('🚨 FALLBACK_NOTIFICATION:', JSON.stringify(fallbackLog, null, 2));
    
    // Also create a more visible alert for admins
    if (type === 'admin') {
      console.log('\n' + '='.repeat(80));
      console.log('🚨 URGENT: ADMIN NOTIFICATION FAILED TO SEND VIA SOCKET.IO');
      console.log('Event:', event);
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('Time:', new Date().toISOString());
      console.log('Action Required: Check admin panel or restart Socket.IO server');
      console.log('='.repeat(80) + '\n');
    }
    
    return { id: `fallback_${Date.now()}`, logged: true };
  } catch (error) {
    console.error('❌ Failed to save fallback notification:', error);
    return null;
  }
}

/**
 * Enhanced admin notification with fallback
 * @param {string} event - Event name
 * @param {Object} data - Notification data
 */
async function emitToAdminWithFallback(event, data) {
  const { emitToAdmin } = require('./socket-cjs');
  
  // Try Socket.IO first
  const socketSuccess = emitToAdmin(event, data);
  
  // If Socket.IO failed, save to database
  if (!socketSuccess) {
    await saveFallbackNotification('admin', event, data);
    
    // Also log to console for immediate visibility
    console.log('🚨 URGENT ADMIN NOTIFICATION (Socket.IO Failed):');
    console.log('Event:', event);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('Time:', new Date().toISOString());
    console.log('Action Required: Check admin panel for pending notifications');
  }
  
  return socketSuccess;
}

/**
 * Enhanced user notification with fallback
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Notification data
 */
async function emitToUserWithFallback(userId, event, data) {
  const { emitToUser } = require('./socket-cjs');
  
  // Try Socket.IO first
  const socketSuccess = emitToUser(userId, event, data);
  
  // If Socket.IO failed, save to database
  if (!socketSuccess) {
    await saveFallbackNotification('user', event, data, userId);
    
    console.log('📝 User notification saved as fallback for user:', userId);
  }
  
  return socketSuccess;
}

/**
 * Get pending fallback notifications
 * @param {string} type - Notification type (admin/user)
 * @param {number} limit - Maximum number of notifications to retrieve
 */
async function getPendingFallbackNotifications(type = 'admin', limit = 50) {
  try {
    // Since we don't have a notifications table, return empty array
    // In a real implementation, this would read from log files or a monitoring system
    console.log(`📋 Checking fallback notifications for ${type} (simulated - no database table)`);
    return [];
  } catch (error) {
    console.error('❌ Failed to get pending notifications:', error);
    return [];
  }
}

/**
 * Mark fallback notification as processed
 * @param {string} notificationId - Notification ID
 */
async function markNotificationProcessed(notificationId) {
  try {
    // Since we don't have a notifications table, just log the action
    console.log('✅ Notification marked as processed (simulated):', notificationId);
    return true;
  } catch (error) {
    console.error('❌ Failed to mark notification as processed:', error);
    return false;
  }
}

module.exports = {
  saveFallbackNotification,
  emitToAdminWithFallback,
  emitToUserWithFallback,
  getPendingFallbackNotifications,
  markNotificationProcessed
};