import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import { createInvoice } from '../../../lib/invoiceService';
import crypto from 'crypto';
import axios from 'axios';

// Cryptomus API configuration
const apiKey = process.env.CRYPTOMUS_API_KEY || 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
const merchantId = process.env.CRYPTOMUS_MERCHANT_ID || '07d3dac2-7868-4fda-b6e9-7d2cfca03da4';

async function checkPaymentStatus(paymentId: string) {
  try {
    const data = {
      uuid: paymentId,
      merchant: merchantId
    };
    
    const dataString = Buffer.from(JSON.stringify(data)).toString('base64');
    const signature = crypto
      .createHash('md5')
      .update(dataString + apiKey)
      .digest('hex');
    
    const response = await axios.post('https://api.cryptomus.com/v1/payment/info', data, {
      headers: {
        'Content-Type': 'application/json',
        'merchant': merchantId,
        'sign': signature
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error checking payment status:', error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // For now, allow any authenticated user. In production, add admin role check
    // if (session.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Forbidden - Admin access required' });
    // }

    console.log('🔄 Processing pending payments via API...');
    
    // Get all pending payment sessions
    const pendingSessions = await (prisma as any).paymentSession.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });
    
    const results = {
      processed: 0,
      completed: 0,
      failed: 0,
      stillPending: 0,
      errors: [] as string[]
    };
    
    for (const session of pendingSessions) {
      try {
        results.processed++;
        
        // Check payment status with Cryptomus
        const paymentStatus = await checkPaymentStatus(session.paymentId);
        
        if (paymentStatus && paymentStatus.state === 0) {
          const status = paymentStatus.result.payment_status;
          
          if (status === 'paid' || status === 'paid_over') {
            // Check if order already exists
            const existingOrder = await prisma.order.findUnique({
              where: { id: session.orderId }
            });
            
            if (existingOrder) {
              // Update existing order
              await prisma.order.update({
                where: { id: session.orderId },
                data: {
                  status: 'completed',
                  notes: `${existingOrder.notes || ''} | Payment confirmed via admin API at ${new Date().toISOString()}`
                }
              });
            } else {
              // Create new order
              await prisma.order.create({
                data: {
                  id: session.orderId,
                  userId: session.userId,
                  customerName: session.customerEmail,
                  date: new Date(),
                  game: session.game,
                  service: session.serviceDetails || session.service,
                  price: session.amount,
                  status: 'completed',
                  paymentId: session.paymentId,
                  notes: `Payment confirmed via admin API - Payment ID: ${session.paymentId}`
                }
              });
            }
            
            // Create invoice
            try {
              const invoiceData = {
                order_id: session.orderId,
                customer_email: session.customerEmail,
                currency: session.currency
              };
              
              await createInvoice(invoiceData, 'Cryptomus', session.paymentId);
            } catch (invoiceError) {
              results.errors.push(`Invoice creation failed for ${session.orderId}: ${invoiceError}`);
            }
            
            // Update payment session status
            await (prisma as any).paymentSession.update({
              where: { id: session.id },
              data: { status: 'completed' }
            });
            
            results.completed++;
            
          } else if (status === 'cancel' || status === 'fail' || status === 'wrong_amount_waiting') {
            // Update payment session status
            await (prisma as any).paymentSession.update({
              where: { id: session.id },
              data: { status: 'failed' }
            });
            
            // Update order if exists
            const existingOrder = await prisma.order.findUnique({
              where: { id: session.orderId }
            });
            
            if (existingOrder) {
              await prisma.order.update({
                where: { id: session.orderId },
                data: {
                  status: 'cancelled',
                  notes: `${existingOrder.notes || ''} | Payment ${status} - checked via admin API at ${new Date().toISOString()}`
                }
              });
            }
            
            results.failed++;
          } else {
            results.stillPending++;
          }
        } else {
          results.errors.push(`Could not check payment status for ${session.paymentId}`);
        }
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        results.errors.push(`Error processing session ${session.id}: ${error}`);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Pending payments processed successfully',
      results
    });
    
  } catch (error) {
    console.error('Error processing pending payments:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}