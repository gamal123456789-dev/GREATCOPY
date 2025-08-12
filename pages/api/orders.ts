import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import prisma from '../../lib/prisma';
const { emitToAdmin, emitToUser } = require('../../lib/socket-cjs');
import { generalLimiter, createRateLimitMiddleware, getClientIdentifier } from '../../lib/rateLimiter';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security: Rate limiting
  const rateLimitCheck = createRateLimitMiddleware(generalLimiter);
  if (!rateLimitCheck(req, res)) {
    return; // Rate limit exceeded, response already sent
  }

  // Authenticate user for both GET and POST requests
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ message: 'You need to be logged in' });
  }

  if (req.method === 'GET') {
    // GET /api/orders - Fetch user's orders
    try {
      const orders = await prisma.order.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          date: 'desc', // Most recent orders first
        },
      });
      res.status(200).json({ orders });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Error fetching orders', error: (error as any).message });
    }
  } else if (req.method === 'POST') {
    // POST /api/orders - Create new order
    const { id, customerName, game, service, status, price, date, userId, paymentId } = req.body;

    try {
      // Security: Enhanced input validation
      if (!game || typeof game !== 'string' || game.trim().length === 0) {
        return res.status(400).json({ error: 'Game is required and must be a valid string' });
      }
      if (!service || typeof service !== 'string' || service.trim().length === 0) {
        return res.status(400).json({ error: 'Service is required and must be a valid string' });
      }
      if (!status || typeof status !== 'string' || !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Status must be one of: pending, in_progress, completed, cancelled' });
      }
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return res.status(400).json({ error: 'Price must be a valid positive number' });
      }
      if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
        return res.status(400).json({ error: 'Customer name is required and must be a valid string' });
      }

      // Security: Sanitize input strings
      const sanitizedGame = game.trim().substring(0, 100); // Limit length
      const sanitizedService = service.trim().substring(0, 200); // Limit length
      const sanitizedCustomerName = customerName.trim().substring(0, 100); // Limit length
      const validatedPrice = Math.round(parseFloat(price) * 100) / 100; // Round to 2 decimal places

      // Security logging for order creation
      console.log(`[SECURITY] Order creation: User ${session.user.id} creating order for ${sanitizedGame} at ${new Date().toISOString()}`);

      const order = await prisma.order.create({
        data: {
          id,
          customerName: sanitizedCustomerName,
          game: sanitizedGame,
          service: sanitizedService,
          status,
          price: validatedPrice,
          date: new Date(date),
          userId: session.user.id,
          paymentId: paymentId || null,
        },
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
        }
      });

      // Enhance order data for admin display
      let displayName = order.customerName;
      if (order.User.username) {
        displayName = order.User.username;
      } else if (order.User.name && order.User.accounts.length > 0) {
        displayName = order.User.name;
      } else if (order.User.email) {
        displayName = order.User.email.split('@')[0];
      }

      const enhancedOrder = {
        id: order.id,
        customerName: displayName,
        game: order.game,
        service: order.service,
        status: order.status,
        price: order.price,
        date: order.date.toISOString(),
        userId: order.userId,
        user: order.User ? {
          id: order.User.id,
          name: order.User.name,
          email: order.User.email,
          username: order.User.username,
          displayName
        } : {
          id: 'guest',
          name: 'Guest User',
          email: 'guest@example.com',
          username: 'guest',
          displayName
        }
      };



      // Create chat message for order creation
      try {
        await prisma.chatMessage.create({
          data: {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            message: `New order created: ${sanitizedGame} - ${sanitizedService} for $${validatedPrice}`,
            orderId: order.id,
            userId: session.user.id,
            isSystem: true,
          },
        });
      } catch (chatError) {
        console.error('Failed to create chat message:', chatError);
        // Don't fail the order creation if chat message fails
      }

      // Send notification to admin about new order
      emitToAdmin('new-order', {
        type: 'new-order',
        orderId: order.id,
        customerName: displayName,
        game: order.game,
        service: order.service,
        serviceName: order.service || order.game,
        price: order.price,
        message: `New order from ${displayName} - ${order.game} (${order.service})`,
        timestamp: new Date(),
        order: enhancedOrder
      });

      // Send notification to user about new order creation
      emitToUser(order.userId, 'new-notification', {
        type: 'order_confirmed',
        orderId: order.id,
        serviceName: order.service || order.game,
        message: `Your order has been confirmed - ${order.service || order.game}`,
        timestamp: new Date()
      });

      res.status(200).json({ order: enhancedOrder });
    } catch (error) {
      console.error('❌ Error creating order:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        requestBody: req.body,
        userId: session.user.id,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({ 
        message: 'Error creating order', 
        error: (error as any).message,
        details: 'Check server logs for more information'
      });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}