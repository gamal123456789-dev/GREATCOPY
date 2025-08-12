import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import prisma from '../../../../lib/prisma';
const { emitToUser, emitToAdmin } = require('../../../../lib/socket-cjs');

/**
 * Cryptomus Webhook Handler
 * Handles payment notifications from Cryptomus
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.CRYPTOMUS_API_KEY || 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
    const merchantId = process.env.CRYPTOMUS_MERCHANT_ID || '07d3dac2-7868-4fda-b6e9-7d2cfca03da4';
    
    // Verify webhook signature
    const receivedSign = req.headers['sign'] as string;
    const dataString = Buffer.from(JSON.stringify(req.body)).toString('base64');
    const expectedSign = crypto
      .createHash('md5')
      .update(dataString + apiKey)
      .digest('hex');

    if (receivedSign !== expectedSign) {
      console.error('Invalid webhook signature from Cryptomus');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { 
      order_id, 
      status, 
      amount, 
      currency, 
      uuid,
      additional_data 
    } = req.body;

    console.log('Cryptomus webhook received:', {
      order_id,
      status,
      amount,
      currency,
      uuid
    });

    // Parse additional data
    let parsedData = {};
    try {
      parsedData = JSON.parse(additional_data || '{}');
    } catch (e) {
      console.warn('Failed to parse additional_data:', additional_data);
    }

    // Handle successful payment
    if (status === 'paid' || status === 'paid_over') {
      // Check if order already exists
      const existingOrder = await prisma.order.findUnique({
        where: { id: order_id }
      });

      if (!existingOrder) {
        // Extract data from additional_data or use defaults
        const userData = parsedData as any;
        const userId = userData.user_id;
        const game = userData.game || 'Unknown Game';
        const service = userData.service || 'Unknown Service';
        const customerEmail = userData.customer_email || '';

        if (userId) {
          // Create the order
          const order = await prisma.order.create({
            data: {
              id: order_id,
              userId: userId,
              customerName: customerEmail,
              date: new Date(),
              game: game,
              service: service,
              price: parseFloat(amount),
              status: 'completed',
              paymentId: uuid,
              notes: `Payment confirmed via Cryptomus - Payment ID: ${uuid}`
            }
          });

          console.log('Order created from Cryptomus webhook:', order.id);

          // Emit socket events
          try {
            emitToUser(userId, 'orderUpdate', {
              orderId: order.id,
              status: 'completed',
              message: 'تم تأكيد الدفع بنجاح! سيتم التواصل معك قريباً.'
            });

            emitToAdmin('newOrder', {
              orderId: order.id,
              userId: userId,
              game: game,
              service: service,
              price: parseFloat(amount),
              paymentMethod: 'Cryptomus'
            });
          } catch (socketError) {
            console.error('Socket emission error:', socketError);
          }
        }
      } else {
        console.log('Order already exists:', order_id);
      }
    }

    // Respond to Cryptomus
    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('Cryptomus webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}