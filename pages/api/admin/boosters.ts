import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication and admin role
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch all users with BOOSTER role
    const boosters = await prisma.user.findMany({
      where: {
        role: 'booster'
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        createdAt: true,
        assignedOrders: {
          select: {
            id: true,
            customerName: true,
            game: true,
            service: true,
            status: true,
            price: true,
            date: true
          }
        }
      }
    });

    // Calculate statistics for each booster
    const boostersWithStats = boosters.map(booster => {
      const assignedOrders = booster.assignedOrders || [];
      const assignedCount = assignedOrders.length;
      const completedCount = assignedOrders.filter(order => order.status === 'completed').length;
    const totalRevenue = assignedOrders
      .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.price, 0);

      return {
        ...booster,
        stats: {
          assignedOrders: assignedCount,
          completedOrders: completedCount,
          totalEarnings: totalRevenue
        }
      };
    });

    res.status(200).json({ boosters: boostersWithStats });
  } catch (error) {
    console.error('Error fetching boosters:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}