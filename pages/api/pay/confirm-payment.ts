import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
const { emitToUser, emitToAdmin } = require('../../../lib/socket-cjs');

/**
 * Payment Confirmation API
 * Creates an order after successful payment confirmation
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId, game, service, serviceDetails, amount, currency = 'USD', chargeId, paymentMethod = 'Coinbase Commerce' } = req.body;

    // Validate required fields
    if (!orderId || !game || !service || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: orderId, game, service, amount' 
      });
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Check if order already exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (existingOrder) {
      return res.status(200).json({ 
        success: true, 
        order: existingOrder,
        message: 'Order already exists'
      });
    }

    // Create the order after successful payment
    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId: session.user.id,
        customerName: session.user.name || session.user.email || 'Unknown',
        date: new Date(),
        game: game,
        price: numAmount,
        service: serviceDetails || service,
        status: 'pending', // Will be updated to 'completed' by webhook
        notes: `Payment confirmed via ${paymentMethod}${chargeId ? ` - Charge ID: ${chargeId}` : ''}`
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

    // Create chat message for order creation
    try {
      await prisma.chatMessage.create({
        data: {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          message: `New order created: ${game} - ${serviceDetails || service} for $${numAmount}`,
          orderId: order.id,
          userId: session.user.id,
        },
      });
    } catch (chatError) {
      console.error('Failed to create chat message:', chatError);
      // Don't fail the order creation if chat message fails
    }

    // Send notification to user about new order creation
    console.log(`📧 Sending order confirmation notification to user: ${session.user.id}`);
    console.log(`📧 Order details: ${orderId} - ${service}`);
    emitToUser(session.user.id, 'new-notification', {
      type: 'order_confirmed',
      orderId: order.id,
      serviceName: `${game} - ${serviceDetails || service}`,
      message: `Your order has been confirmed - ${game} (${serviceDetails || service})`,
      timestamp: new Date()
    });

    // Send notification to admin about new order
    const displayName = session.user.name || session.user.username || session.user.email?.split('@')[0] || 'Unknown';
    emitToAdmin('new-order', {
      type: 'new-order',
      orderId: order.id,
      customerName: displayName,
      game: order.game,
      service: order.service,
      serviceName: `${order.game} - ${serviceDetails || order.service}`,
      price: order.price,
      message: `New order from ${displayName} - ${order.game} (${serviceDetails || order.service})`,
      timestamp: new Date(),
      order: {
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
      }
    });

    console.log(`✅ Order created successfully after payment confirmation: ${orderId}`);

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        serviceName: `${order.game} - ${order.service}`,
        amount: order.price,
        currency: currency,
        status: order.status.toUpperCase(),
        paymentMethod: paymentMethod,
        createdAt: order.date.toISOString()
      }
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}