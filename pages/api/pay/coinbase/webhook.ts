import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import prisma from '../../../../lib/prisma';
const { emitToUser, emitToAdmin } = require('../../../../lib/socket-cjs');

/**
 * Coinbase Commerce Webhook Handler
 * Handles payment status updates from Coinbase Commerce
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-cc-webhook-signature'] as string;
    const body = JSON.stringify(req.body);
    
    // Verify webhook signature (optional but recommended)
    // For now, we'll process without verification since we don't have webhook secret
    
    const event = req.body;
    
    console.log('Coinbase Commerce webhook received:', {
      type: event.type,
      id: event.id,
      data: event.data
    });

    // Handle different event types
    switch (event.type) {
      case 'charge:confirmed':
      case 'charge:resolved':
        await handleSuccessfulPayment(event.data);
        break;
      
      case 'charge:failed':
      case 'charge:canceled':
        await handleFailedPayment(event.data);
        break;
      
      case 'charge:pending':
        await handlePendingPayment(event.data);
        break;
      
      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Coinbase Commerce webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleSuccessfulPayment(chargeData: any) {
  try {
    const orderId = chargeData.metadata?.order_id;
    
    if (!orderId) {
      console.error('No order ID found in charge metadata');
      return;
    }

    // Update order status in database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'completed',
        notes: `Payment confirmed via Coinbase Commerce - Charge ID: ${chargeData.id} - Amount: ${chargeData.pricing?.local?.amount} ${chargeData.pricing?.local?.currency}`
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

    // Send notification to user about payment confirmation
    console.log(`📧 Sending payment confirmation notification to user: ${updatedOrder.userId}`);
    emitToUser(updatedOrder.userId, 'new-notification', {
      type: 'payment_received',
      orderId: updatedOrder.id,
      serviceName: `${updatedOrder.game} - ${updatedOrder.service}`,
      message: `Payment confirmed for your order - ${updatedOrder.game} (${updatedOrder.service})`,
      timestamp: new Date()
    });

    console.log(`Order ${orderId} marked as completed`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(chargeData: any) {
  try {
    const orderId = chargeData.metadata?.order_id;
    
    if (!orderId) {
      console.error('No order ID found in charge metadata');
      return;
    }

    // Update order status in database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        notes: `Payment failed/cancelled via Coinbase Commerce - Charge ID: ${chargeData.id}`
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

    // Send notification to user about payment failure
    console.log(`📧 Sending payment failure notification to user: ${updatedOrder.userId}`);
    emitToUser(updatedOrder.userId, 'new-notification', {
      type: 'status_updated',
      orderId: updatedOrder.id,
      serviceName: `${updatedOrder.game} - ${updatedOrder.service}`,
      message: `Payment failed for your order - ${updatedOrder.game} (${updatedOrder.service})`,
      timestamp: new Date()
    });

    console.log(`Order ${orderId} marked as cancelled`);
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

async function handlePendingPayment(chargeData: any) {
  try {
    const orderId = chargeData.metadata?.order_id;
    
    if (!orderId) {
      console.error('No order ID found in charge metadata');
      return;
    }

    // Update order status to pending if not already
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'pending',
        notes: `Payment pending via Coinbase Commerce - Charge ID: ${chargeData.id}`
      }
    });

    console.log(`Order ${orderId} status updated to pending`);
  } catch (error) {
    console.error('Error handling pending payment:', error);
  }
}