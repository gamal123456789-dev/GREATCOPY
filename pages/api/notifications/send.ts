/**
 * API endpoint for sending notifications when Socket.IO is not available
 * This provides a fallback mechanism for auto-process-payments.js
 */

import { NextApiRequest, NextApiResponse } from 'next';
const { getSocketIO } = require('../../../lib/socket-cjs');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, event, data, userId } = req.body;

    if (!type || !event || !data) {
      return res.status(400).json({ error: 'Missing required fields: type, event, data' });
    }

    // Get Socket.IO instance
    const io = getSocketIO();
    let success = false;

    if (io) {
      try {
        if (type === 'admin') {
          // Send to admin room
          io.to('admin').emit(event, data);
          console.log(`📧 Admin notification sent via API: ${event}`);
          success = true;
        } else if (type === 'user' && userId) {
          // Send to specific user room
          io.to(`user:${userId}`).emit(event, data);
          console.log(`📧 User notification sent via API to ${userId}: ${event}`);
          success = true;
        }
      } catch (socketError) {
        console.error('Socket.IO emission failed:', socketError);
        success = false;
      }
    }

    // If Socket.IO failed or not available, use fallback
    if (!success) {
      console.log(`🚨 Using fallback for ${type} notification: ${event}`);
      
      // Log fallback notification
      const fallbackLog = {
        timestamp: new Date().toISOString(),
        type: 'FALLBACK_NOTIFICATION',
        recipientType: type.toUpperCase(),
        event: event,
        recipientId: userId,
        data: data,
        reason: 'Socket.IO unavailable via API'
      };
      
      console.log('🚨 FALLBACK_NOTIFICATION:', JSON.stringify(fallbackLog, null, 2));
      
      // Special handling for admin notifications
      if (type === 'admin') {
        console.log('\n' + '='.repeat(80));
        console.log('🚨 URGENT: ADMIN NOTIFICATION RECEIVED VIA API FALLBACK');
        console.log('Event:', event);
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('Time:', new Date().toISOString());
        console.log('Source: API Fallback System');
        console.log('='.repeat(80) + '\n');
      }
    }

    return res.status(200).json({
      success: true,
      method: success ? 'socket' : 'fallback',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notification API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}