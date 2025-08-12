import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

/**
 * API endpoint to get unread message counts for all orders (Admin only)
 * Returns a map of orderId -> unread count
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check admin permissions
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ message: 'You need to be logged in' });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    // Get all orders with their unread message counts
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        _count: {
          select: {
            ChatMessage: {
              where: {
                isRead: false,
                userId: {
                  not: session.user.id // Exclude messages sent by the admin
                },
                isSystem: false // Exclude system messages
              }
            }
          }
        }
      }
    });

    // Create a map of orderId -> unread count
    const unreadCounts: Record<string, number> = {};
    
    orders.forEach(order => {
      unreadCounts[order.id] = order._count.ChatMessage;
    });

    console.log(`✅ Retrieved unread counts for ${orders.length} orders`);

    return res.status(200).json({
      success: true,
      unreadCounts
    });

  } catch (error) {
    console.error('❌ Error fetching unread message counts:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}