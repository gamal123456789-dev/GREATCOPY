import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
const { prisma, sendDatabaseNotification } = require('../../../../services/databaseNotificationService');
const { emitToUser, emitToAdmin } = require('../../../../lib/socket-cjs');
import { createInvoice } from '../../../../lib/invoiceService';

// Note: We don't setup database monitoring here to avoid duplicate notifications
// Webhook-created orders should only get payment-confirmed notifications, not new-order

/**
 * Cryptomus Webhook Handler
  * Handles payment notifications from Cryptomus
 */

// Configure body parser to handle JSON
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set global flag to indicate webhook context for this request
  (global as any).isWebhookContext = true;
  
  console.log('🚀 WEBHOOK HANDLER CALLED');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  // Log webhook entry immediately
  const fs4 = require('fs');
  const webhookEntry = `${new Date().toISOString()} - WEBHOOK RECEIVED: ${JSON.stringify(req.body)}\n`;
  fs4.appendFileSync('logs/webhook-debug.log', webhookEntry);
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔔 Webhook received from Cryptomus');
  console.log('🚀 CRYPTOMUS WEBHOOK: Received webhook request');
  console.log('🎯 WEBHOOK RECEIVED:', JSON.stringify(req.body, null, 2));

  try {
    const apiKey = process.env.CRYPTOMUS_API_KEY || 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
    const merchantId = process.env.CRYPTOMUS_MERCHANT_ID || '07d3dac2-7868-4fda-b6e9-7d2cfca03da4';
    
    // Get signature from request body
    const receivedSign = req.body.sign;
    console.log('📨 Received signature:', receivedSign);
    
    // Remove sign from body for verification
    const { sign, ...bodyWithoutSign } = req.body;
    const bodyForSignature = JSON.stringify(bodyWithoutSign);
    
    console.log('🔍 Body for signature:', bodyForSignature);
    
    // Calculate expected signature
    const base64Data = Buffer.from(bodyForSignature).toString('base64');
    console.log('📝 Base64 data:', base64Data);
    
    const expectedSign = crypto.createHash('md5').update(base64Data + apiKey).digest('hex');
    console.log('🔐 Expected signature:', expectedSign);
    
    // Verify signature
    if (receivedSign !== expectedSign) {
      console.log('❌ Invalid signature - received:', receivedSign, 'expected:', expectedSign);
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    console.log('✅ Signature verification passed');

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

    // Create unique webhook identifier to prevent duplicate processing
    const webhookId = uuid || `${order_id}_${status}_${amount}`;
    
    // Check if this webhook has already been processed
    const existingWebhookLog = await (prisma as any).webhookLog.findUnique({
      where: { webhookId: webhookId }
    });
    
    if (existingWebhookLog) {
      console.log('⚠️ DUPLICATE WEBHOOK DETECTED - Already processed:', webhookId);
      const fs = require('fs');
      const duplicateEntry = `${new Date().toISOString()} - DUPLICATE WEBHOOK IGNORED: ${webhookId}\n`;
      fs.appendFileSync('logs/webhook-debug.log', duplicateEntry);
      return res.status(200).json({ message: 'Webhook already processed' });
    }
    
    // Log this webhook as being processed
    await (prisma as any).webhookLog.create({
      data: {
        webhookId: webhookId,
        orderId: order_id,
        status: status,
        amount: amount?.toString() || '0',
        processedAt: new Date()
      }
    });
    
    console.log('✅ NEW WEBHOOK - Processing:', webhookId);

    // Parse additional data
    let parsedData = {};
    try {
      parsedData = JSON.parse(additional_data || '{}');
    } catch (e) {
      console.warn('Failed to parse additional_data:', additional_data);
    }

    // Handle successful payment
    if (status === 'paid' || status === 'paid_over') {
      console.log('Payment confirmed, creating order from payment session:', order_id);
      
      // Get payment session data
      const paymentSession = await (prisma as any).paymentSession.findUnique({
        where: { orderId: order_id }
      });
      
      if (!paymentSession) {
        console.error('Payment session not found for order:', order_id);
        return res.status(400).json({ error: 'Payment session not found' });
      }
      
      // Check if order already exists
      const existingOrder = await prisma.order.findUnique({
        where: { id: order_id }
      });

      if (existingOrder) {
        console.log('Order already exists, updating status to pending:', order_id);
        
        // Update order status to pending (payment confirmed but order needs processing)
        const updatedOrder = await prisma.order.update({
          where: { id: order_id },
          data: {
            status: 'pending',
            paymentId: uuid,
            notes: `${existingOrder.notes || ''} | Payment confirmed via Cryptomus webhook at ${new Date().toISOString()} - Payment ID: ${uuid}`
          }
        });
        
        console.log('Order status updated to pending:', updatedOrder.id);
        
        // Send payment confirmation notification for existing order
        try {
          console.log('🔔 PAYMENT CONFIRMED (EXISTING ORDER) - Attempting to send notification for order:', updatedOrder.id);
          
          // Log to file immediately
          const fs2 = require('fs');
          const attemptEntry = `${new Date().toISOString()} - PAYMENT CONFIRMATION NOTIFICATION ATTEMPT (EXISTING): ${updatedOrder.id}\n`;
          fs2.appendFileSync('logs/webhook-debug.log', attemptEntry);
          
          // Check if notification already exists to prevent duplicates
          const existingNotification = await (prisma as any).notification.findFirst({
            where: {
              type: 'payment-confirmed',
              data: {
                path: ['orderId'],
                equals: updatedOrder.id
              }
            }
          });
          
          if (!existingNotification) {
            await sendDatabaseNotification('payment-confirmed', {
              userId: paymentSession.userId,
              orderId: updatedOrder.id,
              customerName: updatedOrder.customerName,
              game: updatedOrder.game,
              service: updatedOrder.service,
              price: updatedOrder.price,
              status: updatedOrder.status,
              paymentMethod: 'Cryptomus (USDT)',
              timestamp: updatedOrder.date.toISOString(),
              customerEmail: paymentSession.customerEmail
            });
            
            console.log('✅ PAYMENT CONFIRMED (EXISTING ORDER) - Notification sent successfully for:', updatedOrder.id);
          } else {
            console.log('⚠️ PAYMENT CONFIRMED (EXISTING ORDER) - Notification already exists, skipping duplicate for:', updatedOrder.id);
          }
          
          // Log success to file
          const successEntry = `${new Date().toISOString()} - PAYMENT CONFIRMATION NOTIFICATION SENT (EXISTING): ${updatedOrder.id}\n`;
          fs2.appendFileSync('logs/webhook-debug.log', successEntry);
          
        } catch (notificationError: any) {
           console.error('❌ Error sending notification for existing order:', notificationError.message);
           
           // Log error to file
           const fs = require('fs');
           const errorEntry = `${new Date().toISOString()} - WEBHOOK NOTIFICATION ERROR (EXISTING): ${notificationError.message}\n`;
           fs.appendFileSync('logs/webhook-debug.log', errorEntry);
        }
        
        // Update payment session status
        await (prisma as any).paymentSession.update({
          where: { orderId: order_id },
          data: { status: 'completed' }
        });
        
        // Create invoice for the completed order
        try {
          const invoiceData = {
            order_id: order_id,
            customer_email: updatedOrder.customerName,
            currency: currency || 'USD'
          };
          
          const invoice = await createInvoice(invoiceData, 'Cryptomus', uuid);
          console.log('Invoice created:', (invoice as any).invoiceNumber);
        } catch (invoiceError) {
          console.error('Error creating invoice:', invoiceError);
          // Don't fail the webhook if invoice creation fails
        }
        
        // Note: Payment confirmation notification already sent above via sendDatabaseNotification
        // This function handles both admin and user notifications automatically
        console.log('✅ Payment confirmation notification handled for existing order:', updatedOrder.id);
      } else {
        // Create new order from payment session data
        console.log('🆕 ENTERING NEW ORDER CREATION BLOCK for:', order_id);
        
        // Mark this request as webhook-originated to bypass middleware checks
        (req as any).isWebhookRequest = true;
        
        // Log to file immediately to confirm we reach this point
        const fs3 = require('fs');
        const entryLog = `${new Date().toISOString()} - ENTERING NEW ORDER CREATION: ${order_id}\n`;
        fs3.appendFileSync('logs/webhook-debug.log', entryLog);
        
        console.log('Creating new order from payment session:', order_id);
        
        // Create the order using payment session data
        const order = await prisma.order.create({
          data: {
            id: order_id,
            userId: paymentSession.userId,
            customerName: paymentSession.customerEmail,
            date: new Date(),
            game: paymentSession.game,
            service: paymentSession.serviceDetails || paymentSession.service,
            price: paymentSession.amount,
            status: 'pending',
            paymentId: uuid,
            notes: `Payment confirmed via Cryptomus - Payment ID: ${uuid}`
          }
        });

        console.log('Order created from payment session:', order.id);
        
        // Send payment confirmation notification
        try {
          console.log('🔔 PAYMENT CONFIRMED - Attempting to send notification for order:', order.id);
          
          // Log to file immediately
          const fs2 = require('fs');
          const attemptEntry = `${new Date().toISOString()} - PAYMENT CONFIRMATION NOTIFICATION ATTEMPT: ${order.id}\n`;
          fs2.appendFileSync('logs/webhook-debug.log', attemptEntry);
          
          // Wait a moment to allow database middleware to process first
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Check if notification already exists to prevent duplicates
          const existingNotification = await (prisma as any).notification.findFirst({
            where: {
              type: 'payment-confirmed',
              data: {
                path: ['orderId'],
                equals: order.id
              }
            }
          });
          
          if (!existingNotification) {
            await sendDatabaseNotification('payment-confirmed', {
              userId: paymentSession.userId,
              orderId: order.id,
              customerName: order.customerName,
              game: order.game,
              service: order.service,
              price: order.price,
              status: order.status,
              paymentMethod: 'Cryptomus (USDT)',
              timestamp: order.date.toISOString(),
              customerEmail: paymentSession.customerEmail
            });
            
            console.log('✅ PAYMENT CONFIRMED - Notification sent successfully for:', order.id);
          } else {
            console.log('⚠️ PAYMENT CONFIRMED - Notification already exists, skipping duplicate for:', order.id);
          }
          
          // Log success to file
          const successEntry = `${new Date().toISOString()} - PAYMENT CONFIRMATION NOTIFICATION SENT: ${order.id}\n`;
          fs2.appendFileSync('logs/webhook-debug.log', successEntry);
          
        } catch (notificationError: any) {
           console.error('❌ Error sending notification:', notificationError.message);
           
           // Log error to file
           const fs = require('fs');
           const errorEntry = `${new Date().toISOString()} - WEBHOOK NOTIFICATION ERROR: ${notificationError.message}\n`;
           fs.appendFileSync('logs/webhook-debug.log', errorEntry);
        }
        
        // Update payment session status
        await (prisma as any).paymentSession.update({
          where: { orderId: order_id },
          data: { status: 'completed' }
        });

        // Create invoice for the completed order
        try {
          const invoiceData = {
            order_id: order_id,
            customer_email: paymentSession.customerEmail,
            currency: paymentSession.currency
          };
          
          const invoice = await createInvoice(invoiceData, 'Cryptomus', uuid);
          console.log('Invoice created:', (invoice as any).invoiceNumber);
        } catch (invoiceError) {
          console.error('Error creating invoice:', invoiceError);
          // Don't fail the webhook if invoice creation fails
        }

        console.log('✅ WEBHOOK: Order created successfully:', order.id);
      }
    }

    // Handle other payment statuses
    if (status === 'cancel' || status === 'fail' || status === 'wrong_amount_waiting') {
      console.log(`Payment ${status} for order ${order_id}`);
      
      // Try to find and update existing order
      try {
        const existingOrder = await prisma.order.findUnique({
          where: { id: order_id }
        });
        
        if (existingOrder) {
          await prisma.order.update({
            where: { id: order_id },
            data: {
              status: 'cancelled',
              notes: `${existingOrder.notes || ''} | Payment ${status} via Cryptomus webhook at ${new Date().toISOString()}`
            }
          });
          
          // Notify user about payment failure
          emitToUser(existingOrder.userId, 'paymentFailed', {
            orderId: order_id,
            status: status,
            message: 'فشل في عملية الدفع. يرجى المحاولة مرة أخرى.'
          });
        }
      } catch (error) {
        console.error('Error handling failed payment:', error);
      }
    }

    // Respond to Cryptomus
    console.log('✅ CRYPTOMUS WEBHOOK: Processing completed successfully');
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('❌ CRYPTOMUS WEBHOOK: Error occurred:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    // Reset webhook context flag
    (global as any).isWebhookContext = false;
  }
}