import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
const prisma = require('../../../../lib/prisma.js');
const { emitToAdmin } = require('../../../../lib/socket-cjs');

/**
 * Create Notification API
 * Creates new notifications for admin users
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, title, message, data, userId } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: type, title, message' 
      });
    }

    // If userId is provided, create notification for specific user
    // Otherwise, create for all admin users
    let targetUsers = [];
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, email: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.role !== 'ADMIN') {
        return res.status(400).json({ error: 'User is not an admin' });
      }
      
      targetUsers = [user];
    } else {
      // Get all admin users
      targetUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, email: true }
      });
    }

    if (targetUsers.length === 0) {
      return res.status(404).json({ error: 'No admin users found' });
    }

    // Create notifications for each admin user
    const notifications = await Promise.all(
      targetUsers.map((user: any) => 
        prisma.notification.create({
          data: {
            type,
            title,
            message,
            data: data || null,
            userId: user.id,
            read: false
          }
        })
      )
    );

    // Send real-time notifications via Socket.IO
    try {
      emitToAdmin('new-notification', {
        type,
        title,
        message,
        data,
        notifications: notifications.length,
        timestamp: new Date().toISOString()
      });
      console.log(`🔔 Real-time notification sent to ${targetUsers.length} admin(s)`);
    } catch (socketError: any) {
      console.warn('⚠️ Socket.IO not available, notification stored in database only:', socketError.message);
    }

    console.log(`✅ Created ${notifications.length} notification(s) for type: ${type}`);

    return res.status(201).json({
      success: true,
      message: `Created ${notifications.length} notification(s)`,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        userId: n.userId,
        createdAt: n.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}