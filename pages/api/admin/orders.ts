import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Authentication and authorization - SECURITY FIX: Removed test admin bypass
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true }
  });
  
  if (!adminUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (adminUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Security logging for admin actions
  console.log(`[SECURITY] Admin access: User ${adminUser.id} accessing orders list at ${new Date().toISOString()}`);
  
  const adminUserId = adminUser.id;

  if (req.method === 'GET') {
    try {
      // Fetch all orders with user information
      const orders = await prisma.order.findMany({
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              accounts: {
                where: {
                  provider: 'discord'
                },
                select: {
                  providerAccountId: true
                }
              }
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      });

      // Enhance data to include appropriate display name
      const enhancedOrders = orders.map(order => {
        let displayName = order.customerName;
        
        // If user has username, use it
        if (order.User.username) {
          displayName = order.User.username;
        }
        // If user has Discord account, use Discord name
        else if (order.User.name && order.User.accounts.length > 0) {
          displayName = order.User.name; // Discord username
        }
        // Otherwise use email
        else if (order.User.email) {
          displayName = order.User.email.split('@')[0];
        }

        return {
          id: order.id,
          customerName: displayName,
          game: order.game,
          service: order.service,
          status: order.status,
          price: order.price,
          date: order.date.toISOString(),
          notes: order.notes,
          userId: order.userId,
          user: {
            id: order.User.id,
            name: order.User.name,
            email: order.User.email,
            username: order.User.username,
            displayName
          }
        };
      });

      res.status(200).json(enhancedOrders);
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      res.status(500).json({ message: 'Error fetching orders', error: (error as any).message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}