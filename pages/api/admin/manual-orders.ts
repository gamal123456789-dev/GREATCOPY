import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
const { emitToAdmin, emitToUser } = require('../../../lib/socket-cjs');

/**
 * API endpoint for creating manual orders without payment
 * Only accessible by admin users
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    if (req.method === 'POST') {
      const { customerEmail, customerName, game, service, price, notes } = req.body;

      // Validate required fields
      if (!customerEmail || !game || !service || !price) {
        return res.status(400).json({ 
          error: 'Missing required fields: customerEmail, game, service, and price are required' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        return res.status(400).json({ 
          error: 'Invalid email format' 
        });
      }

      // Validate price is a positive number
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ 
          error: 'Price must be a valid number (can be 0 for free services)' 
        });
      }

      // Find or create user by email
      let targetUser = await prisma.user.findUnique({
        where: { email: customerEmail }
      });

      if (!targetUser) {
        // Create new user if doesn't exist
        targetUser = await prisma.user.create({
          data: {
            id: uuidv4(),
            email: customerEmail,
            username: customerName || customerEmail.split('@')[0],
            role: 'user',
            emailVerified: new Date() // Auto-verify for admin-created users
          }
        });
      }

      // Create the order
      const orderId = uuidv4();
      const order = await prisma.order.create({
        data: {
          id: orderId,
          customerName: customerName || targetUser.username || targetUser.email.split('@')[0],
          game: game.trim(),
          service: service.trim(),
          status: 'pending',
          price: parsedPrice,
          date: new Date(),
          userId: targetUser.id,
          notes: notes || 'Order created manually by admin'
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true
            }
          }
        }
      });

      // Enhanced order data for display
      const displayName = order.customerName || order.User.username || order.User.email.split('@')[0];
      
      const enhancedOrder = {
        id: order.id,
        customerName: displayName,
        game: order.game,
        service: order.service,
        status: order.status,
        price: order.price,
        date: order.date.toISOString(),
        userId: order.userId,
        notes: order.notes,
        user: {
          id: order.User.id,
          name: order.User.name,
          email: order.User.email,
          username: order.User.username,
          displayName
        }
      };

      // Send welcome message to customer
      try {
        const welcomeMessage = `Welcome! Your order has been created manually by our admin team. Order details: ${service} for ${game}. ${parsedPrice > 0 ? `Price: $${parsedPrice}` : 'This is a complimentary service.'} We will start working on your order soon!`;
        
        const chatMessage = await prisma.chatMessage.create({
          data: {
            id: uuidv4(),
            orderId: order.id,
            userId: adminUser.id, // Message from admin
            message: welcomeMessage,
            messageType: 'text',
            isSystem: true,
            isDelivered: true,
            isRead: false
          }
        });

        // Send message via Socket.IO
        emitToUser(order.userId, 'new-message', {
          id: chatMessage.id,
          orderId: chatMessage.orderId,
          senderId: chatMessage.userId,
          message: chatMessage.message,
          messageType: chatMessage.messageType,
          isSystem: chatMessage.isSystem,
          timestamp: chatMessage.createdAt.toISOString(),
          senderRole: 'ADMIN',
          senderName: 'Admin Team'
        });

        console.log(`📨 Welcome message sent for manual order ${order.id}`);
      } catch (messageError) {
        console.error('Error sending welcome message:', messageError);
      }

      // Send notification to admin about new manual order
      emitToAdmin('new-order', {
        type: 'manual-order',
        orderId: order.id,
        customerName: displayName,
        game: order.game,
        service: order.service,
        serviceName: order.service || order.game,
        price: order.price,
        message: `Manual order created for ${displayName} - ${order.game} (${order.service})`,
        timestamp: new Date(),
        order: enhancedOrder
      });

      // Send notification to user about new manual order creation
      console.log(`📧 Sending order confirmation notification to user: ${order.userId}`);
      console.log(`📧 Order details: ${order.id} - ${order.service || order.game}`);
      emitToUser(order.userId, 'new-notification', {
        type: 'order_confirmed',
        orderId: order.id,
        serviceName: order.service || order.game,
        message: `Your order has been confirmed - ${order.service || order.game}`,
        timestamp: new Date()
      });
      console.log(`📧 Notification sent for manual order ${order.id}`);

      // Security logging
      console.log(`[SECURITY] Manual order created: Admin ${adminUser.id} created order ${order.id} for ${customerEmail} at ${new Date().toISOString()}`);

      return res.status(201).json({
        success: true,
        order: enhancedOrder,
        message: 'Manual order created successfully'
      });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Manual orders API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}