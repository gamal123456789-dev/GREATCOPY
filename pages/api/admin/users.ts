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
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (adminUser.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  // Security logging for admin actions
  console.log(`[SECURITY] Admin access: User ${adminUser.id} accessing users list at ${new Date().toISOString()}`);

  if (req.method === 'GET') {
    try {
      // Fetch all users with linked account information
      const users = await prisma.user.findMany({
        include: {
          accounts: {
            select: {
              provider: true,
              providerAccountId: true
            }
          },
          Order: {
            select: {
              id: true,
              price: true,
              status: true
            }
          }
        }
      });

      // Enhance data to include appropriate display name
      const enhancedUsers = users.map(user => {
        // Determine display name
        let displayName = user.email?.split('@')[0] || 'Unknown';
        
        // If user has username, use it
        if (user.username) {
          displayName = user.username;
        }
        // If user has Discord account, use Discord name
        else if (user.name && user.accounts.some(acc => acc.provider === 'discord')) {
          displayName = user.name; // Discord username
        }
        
        // For admin users, remove email from display name and use only name/username
        if (user.role === 'ADMIN') {
          if (user.username) {
            displayName = user.username;
          } else if (user.name) {
            displayName = user.name;
          } else {
            displayName = 'Admin';
          }
        }

        // Calculate total orders and amount paid
        const totalOrders = user.Order.length;
        const totalSpent = user.Order.reduce((sum, order) => sum + order.price, 0);
        // Removed completed orders filtering

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          displayName,
          role: user.role,
          totalOrders,
          // Removed completedOrders reference
          totalSpent,
          hasDiscord: user.accounts.some(acc => acc.provider === 'discord'),
          createdAt: user.createdAt
        };
      });

      res.status(200).json(enhancedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users', error: (error as any).message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}