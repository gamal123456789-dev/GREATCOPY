import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check admin permissions
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ message: 'You need to be logged in' });
  }

  // Check if user is admin - improved error handling
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  } catch (error) {
    console.error('Error checking user role:', error);
    return res.status(500).json({ message: 'Error verifying admin access' });
  }

  if (req.method === 'GET') {
    try {
      // Calculate total orders
      const totalOrders = await prisma.order.count();

      // Calculate status-based order counts
      const pendingOrders = await prisma.order.count({
        where: { status: 'pending' }
      });

      const completedOrders = await prisma.order.count({
        where: { status: 'completed' }
      });

      const cancelledOrders = await prisma.order.count({
        where: { status: 'cancelled' }
      });
      
      // Calculate total revenue with error handling
      const totalRevenue = await prisma.order.aggregate({
        _sum: { price: true },
        where: {
          status: {
            not: 'Cancelled' // Exclude cancelled orders from revenue
          }
        }
      });

      // Calculate active customers (those with orders)
      const activeCustomers = await prisma.user.count({
        where: {
          Order: {
            some: {}
          }
        }
      });

      // Calculate orders in current month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const ordersThisMonth = await prisma.order.count({
        where: {
          date: {
            gte: currentMonth
          }
        }
      });

      // Calculate orders in previous month for comparison
      const lastMonth = new Date(currentMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const ordersLastMonth = await prisma.order.count({
        where: {
          date: {
            gte: lastMonth,
            lt: currentMonth
          }
        }
      });

      // Calculate percentage change in orders
      const ordersChangePercent = ordersLastMonth > 0 
        ? Math.round(((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100)
        : ordersThisMonth > 0 ? 100 : 0;

      // Calculate revenue this month
      const revenueThisMonth = await prisma.order.aggregate({
        where: {
          date: {
            gte: currentMonth
          }
        },
        _sum: { price: true }
      });

      // Calculate revenue last month
      const revenueLastMonth = await prisma.order.aggregate({
        where: {
          date: {
            gte: lastMonth,
            lt: currentMonth
          }
        },
        _sum: { price: true }
      });

      // Calculate percentage change in revenue
      const revenueChangePercent = (revenueLastMonth._sum.price || 0) > 0 
        ? Math.round((((revenueThisMonth._sum.price || 0) - (revenueLastMonth._sum.price || 0)) / (revenueLastMonth._sum.price || 0)) * 100)
        : (revenueThisMonth._sum.price || 0) > 0 ? 100 : 0;

      // Calculate completion rate
      const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

      // Enhanced stats with better formatting
      const stats = {
        totalOrders: {
          value: totalOrders,
          change: ordersChangePercent,
          label: 'Total Orders',
          trend: ordersChangePercent >= 0 ? 'up' : 'down'
        },
        pendingOrders: {
          value: pendingOrders,
          label: 'New Orders',
          trend: 'neutral'
        },
        completedOrders: {
          value: completedOrders,
          change: completionRate,
          label: 'Completed Orders',
          trend: completionRate >= 70 ? 'up' : completionRate >= 50 ? 'neutral' : 'down'
        },
        cancelledOrders: {
          value: cancelledOrders,
          label: 'Cancelled Orders',
          trend: 'down' // Cancelled orders are always negative
        },
        totalRevenue: {
          value: totalRevenue._sum.price || 0,
          change: revenueChangePercent,
          label: 'Total Revenue',
          trend: revenueChangePercent >= 0 ? 'up' : 'down',
          formatted: `$${(totalRevenue._sum.price || 0).toLocaleString()}`
        },
        activeCustomers: {
          value: activeCustomers,
          change: 0,
          label: 'Active Customers',
          trend: 'neutral'
        },
        // Additional metrics
        metrics: {
          completionRate,
          averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue._sum.price || 0) / totalOrders) : 0,
          ordersThisMonth,
          revenueThisMonth: revenueThisMonth._sum.price || 0
        }
      };

      res.status(200).json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Error fetching stats', error: (error as any).message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}