import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { role: true }
  });

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      const { days = '30' } = req.query;
      const daysNumber = parseInt(days as string, 10);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNumber);

      // Get orders within the date range (excluding cancelled orders)
      const orders = await prisma.order.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          },
          status: {
            not: 'cancelled'
          }
        },
        select: {
          id: true,
          game: true,
          service: true,
          price: true,
          status: true,
          date: true,
          userId: true,
          User: {
            select: {
              email: true,
              name: true
            }
          }
        }
      });

      // Get all orders for comparison (including cancelled)
      const allOrders = await prisma.order.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          status: true,
          price: true,
          date: true
        }
      });

      // Group by game
      const gameStats = orders.reduce((acc, order) => {
        if (!acc[order.game]) {
          acc[order.game] = {
            name: order.game,
            totalOrders: 0,
            revenue: 0,
            avgOrderValue: 0
          };
        }
        acc[order.game].totalOrders++;
        acc[order.game].revenue += order.price;
        return acc;
      }, {} as Record<string, any>);

      // Calculate average order values
      Object.values(gameStats).forEach((game: any) => {
        game.avgOrderValue = game.totalOrders > 0 ? game.revenue / game.totalOrders : 0;
      });

      // Group by service with proper completion tracking
      const serviceStats = orders.reduce((acc, order) => {
        if (!acc[order.service]) {
          acc[order.service] = {
            service: order.service,
            totalOrders: 0,
            revenue: 0,
            completedOrders: 0,
            completionRate: 0
          };
        }
        acc[order.service].totalOrders++;
        acc[order.service].revenue += order.price;
        
        // Count completed orders properly
        if (order.status === 'completed') {
          acc[order.service].completedOrders++;
        }
        
        return acc;
      }, {} as Record<string, any>);

      // Calculate completion rates
      Object.values(serviceStats).forEach((service: any) => {
        service.completionRate = service.totalOrders > 0 
          ? Math.round((service.completedOrders / service.totalOrders) * 100) 
          : 0;
      });

      // Convert to arrays and sort by revenue
      const gameReports = Object.values(gameStats).sort((a: any, b: any) => b.revenue - a.revenue);
      const serviceReports = Object.values(serviceStats).sort((a: any, b: any) => b.revenue - a.revenue);

      // Advanced Analytics
      
      // Daily trends analysis
      const dailyTrends = [];
      for (let i = 0; i < daysNumber; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);
        
        const dayOrders = orders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= currentDate && orderDate < nextDate;
        });
        
        const dayAllOrders = allOrders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= currentDate && orderDate < nextDate;
        });
        
        dailyTrends.push({
          date: currentDate.toISOString().split('T')[0],
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, order) => sum + order.price, 0),
          cancelled: dayAllOrders.filter(o => o.status === 'cancelled').length,
        completed: dayOrders.filter(o => o.status === 'completed').length,
        pending: dayOrders.filter(o => o.status === 'pending').length,
        inProgress: dayOrders.filter(o => o.status === 'in_progress').length
        });
      }
      
      // Customer analysis
      const customerStats = orders.reduce((acc, order) => {
        const customerId = order.userId;
        if (!acc[customerId]) {
          acc[customerId] = {
            customerId,
            customerName: order.User?.name || order.User?.email?.split('@')[0] || 'Unknown',
            customerEmail: order.User?.email || 'Unknown',
            totalOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0,
            lastOrderDate: order.date,
            favoriteGame: '',
            favoriteService: '',
            games: {},
            services: {}
          };
        }
        
        acc[customerId].totalOrders++;
        acc[customerId].totalSpent += order.price;
        
        // Track games and services
        acc[customerId].games[order.game] = (acc[customerId].games[order.game] || 0) + 1;
        acc[customerId].services[order.service] = (acc[customerId].services[order.service] || 0) + 1;
        
        // Update last order date
        if (new Date(order.date) > new Date(acc[customerId].lastOrderDate)) {
          acc[customerId].lastOrderDate = order.date;
        }
        
        return acc;
      }, {} as Record<string, any>);
      
      // Calculate customer metrics
      Object.values(customerStats).forEach((customer: any) => {
        customer.averageOrderValue = customer.totalSpent / customer.totalOrders;
        
        // Find favorite game and service
        customer.favoriteGame = Object.keys(customer.games).reduce((a, b) => 
          customer.games[a] > customer.games[b] ? a : b, Object.keys(customer.games)[0] || 'None'
        );
        customer.favoriteService = Object.keys(customer.services).reduce((a, b) => 
          customer.services[a] > customer.services[b] ? a : b, Object.keys(customer.services)[0] || 'None'
        );
      });
      
      // Top customers by revenue
      const topCustomers = Object.values(customerStats)
        .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
        .slice(0, 10);
      
      // Status distribution
      const statusDistribution = {
        completed: orders.filter(o => o.status === 'completed').length,
      pending: orders.filter(o => o.status === 'pending').length,
      inProgress: orders.filter(o => o.status === 'in_progress').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length
      };
      
      // Revenue metrics
      const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
      const completedRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + order.price, 0);
      
      // Growth metrics (compare with previous period)
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - daysNumber);
      const previousEndDate = new Date(startDate);
      
      const previousOrders = await prisma.order.findMany({
        where: {
          date: {
            gte: previousStartDate,
            lt: previousEndDate
          },
          status: {
            not: 'cancelled'
          }
        },
        select: {
          price: true
        }
      });
      
      const previousRevenue = previousOrders.reduce((sum, order) => sum + order.price, 0);
      const revenueGrowth = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : totalRevenue > 0 ? 100 : 0;
      
      const orderGrowth = previousOrders.length > 0 
        ? ((orders.length - previousOrders.length) / previousOrders.length) * 100 
        : orders.length > 0 ? 100 : 0;
      
      // Performance insights
      const insights = [];
      
      if (revenueGrowth > 10) {
        insights.push({
          type: 'positive',
          title: 'Excellent Revenue Growth',
        description: `Revenue grew by ${revenueGrowth.toFixed(1)}% compared to the previous period`,
          icon: '📈'
        });
      } else if (revenueGrowth < -10) {
        insights.push({
          type: 'warning',
          title: 'Revenue Decline',
        description: `Revenue decreased by ${Math.abs(revenueGrowth).toFixed(1)}% compared to the previous period`,
          icon: '📉'
        });
      }
      
      const completionRate = orders.length > 0 ? (statusDistribution.completed / orders.length) * 100 : 0;
      if (completionRate > 90) {
        insights.push({
          type: 'positive',
          title: 'Excellent Completion Rate',
        description: `Order completion rate is ${completionRate.toFixed(1)}%`,
          icon: '✅'
        });
      } else if (completionRate < 70) {
        insights.push({
          type: 'warning',
          title: 'Low Completion Rate',
        description: `Order completion rate is ${completionRate.toFixed(1)}% - needs improvement`,
          icon: '⚠️'
        });
      }
      
      if (topCustomers.length > 0 && topCustomers[0].totalSpent > averageOrderValue * 5) {
        insights.push({
          type: 'info',
          title: 'VIP Customer Identified',
        description: `Customer ${topCustomers[0].customerName} spent $${topCustomers[0].totalSpent.toFixed(2)} in this period`,
          icon: '👑'
        });
      }
      
      // Return comprehensive report data
      const reportData = {
        games: gameReports,
        services: serviceReports,
        dailyTrends,
        topCustomers,
        statusDistribution,
        insights,
        summary: {
          totalOrders: orders.length,
          totalRevenue,
          averageOrderValue,
          completedRevenue,
          completionRate,
          revenueGrowth,
          orderGrowth,
          totalCustomers: Object.keys(customerStats).length,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            days: daysNumber
          }
        }
      };

      // Return the comprehensive report data
      res.status(200).json(reportData);
    } catch (error) {
      console.error('Error generating reports:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}