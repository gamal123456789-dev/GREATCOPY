import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
const prisma = require('../../../lib/prisma.js');

/**
 * Admin Notifications API
 * Handles fetching and updating notifications for admin users
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Check admin role
  if (session.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  if (req.method === 'GET') {
    try {
      // Get query parameters for pagination and filtering
      const { page = '1', limit = '50', unreadOnly = 'false' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;
      
      // Build where clause for collective admin notifications
      const where: any = {
        OR: [
          // Individual notifications for this admin
          { userId: session.user.id },
          // Collective admin notifications (where this admin is in the adminUserIds list)
          {
            isCollectiveAdminNotification: true,
            adminUserIds: {
              has: session.user.id
            }
          }
        ]
      };
      
      if (unreadOnly === 'true') {
        where.read = false;
      }
      
      // Fetch notifications from database
      const [notifications, totalCount, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ 
          where: {
            ...where,
            read: false 
          } 
        })
      ]);
      
      return res.status(200).json({
        notifications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        },
        unreadCount
      });
      
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  if (req.method === 'PATCH') {
    try {
      const { notificationId, read } = req.body;
      
      if (!notificationId) {
        return res.status(400).json({ error: 'Notification ID is required' });
      }
      
      // Update notification in database
      const notification = await prisma.notification.update({
        where: { 
          id: notificationId,
          userId: session.user.id // Ensure user can only update their own notifications
        },
        data: { read: Boolean(read) }
      });
      
      console.log(`📝 Notification ${notificationId} marked as ${read ? 'read' : 'unread'} by ${session.user.email}`);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Notification status updated',
        notification
      });
      
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Notification not found' });
      }
      console.error('Error updating notification:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}