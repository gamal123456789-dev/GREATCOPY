import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createInvoice } from '../../../lib/invoiceService';
import crypto from 'crypto';
import axios from 'axios';

interface InvoiceResult {
  id: string;
  [key: string]: any;
}

const prisma = new PrismaClient();

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔄 Manual processing of pending payments initiated`);
    
    // Get all pending payment sessions
    const pendingSessions = await (prisma as any).paymentSession.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (pendingSessions.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No pending payments to process',
        processed: 0,
        completed: 0,
        failed: 0
      });
    }
    
    console.log(`[${timestamp}] Found ${pendingSessions.length} pending payment sessions`);
    
    let processed = 0;
    let completed = 0;
    let failed = 0;
    const results = [];
    
    for (const session of pendingSessions) {
      try {
        processed++;
        
        // Check payment status with Cryptomus
        const paymentStatus = await checkPaymentStatus(session.paymentId);
        
        if (paymentStatus && paymentStatus.state === 0) {
          const status = paymentStatus.result.payment_status;
          
          if (status === 'paid' || status === 'paid_over') {
            console.log(`[${timestamp}] ✅ Payment confirmed: ${session.paymentId}`);
            
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
                  notes: `${existingOrder.notes || ''} | Payment confirmed manually at ${timestamp}`
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
                  notes: `Payment confirmed manually - Payment ID: ${session.paymentId}`
                }
              });
            }
            
            // Create invoice
            let invoiceId = null;
            try {
              const invoiceData = {
                order_id: session.orderId,
                customer_email: session.customerEmail,
                currency: session.currency
              };
              
              const invoice = await createInvoice(invoiceData, 'Cryptomus', session.paymentId) as InvoiceResult;
              invoiceId = invoice.id;
              console.log(`[${timestamp}] 📄 Invoice created for order: ${session.orderId}`);
            } catch (invoiceError: any) {
              console.error(`[${timestamp}] ❌ Invoice creation failed for ${session.orderId}:`, invoiceError?.message || 'Unknown error');
            }
            
            // Update payment session status
            await (prisma as any).paymentSession.update({
              where: { id: session.id },
              data: { status: 'completed' }
            });
            
            completed++;
            results.push({
              sessionId: session.id,
              orderId: session.orderId,
              paymentId: session.paymentId,
              status: 'completed',
              invoiceId,
              message: 'Payment confirmed and order created'
            });
            
          } else if (status === 'cancel' || status === 'fail' || status === 'wrong_amount_waiting') {
            console.log(`[${timestamp}] ❌ Payment ${status}: ${session.paymentId}`);
            
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
                  notes: `${existingOrder.notes || ''} | Payment ${status} - manually checked at ${timestamp}`
                }
              });
            }
            
            failed++;
            results.push({
              sessionId: session.id,
              orderId: session.orderId,
              paymentId: session.paymentId,
              status: 'failed',
              message: `Payment ${status}`
            });
          } else {
            results.push({
              sessionId: session.id,
              orderId: session.orderId,
              paymentId: session.paymentId,
              status: 'pending',
              message: `Payment still ${status}`
            });
          }
        } else {
          results.push({
            sessionId: session.id,
            orderId: session.orderId,
            paymentId: session.paymentId,
            status: 'error',
            message: 'Could not check payment status'
          });
        }
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`[${timestamp}] ❌ Error processing session ${session.id}:`, error?.message || 'Unknown error');
        results.push({
          sessionId: session.id,
          orderId: session.orderId,
          paymentId: session.paymentId,
          status: 'error',
          message: error?.message || 'Unknown error'
        });
      }
    }
    
    console.log(`[${timestamp}] 📊 Manual processing summary: ${processed} processed, ${completed} completed, ${failed} failed`);
    
    res.status(200).json({
      success: true,
      message: 'Manual payment processing completed',
      summary: {
        processed,
        completed,
        failed,
        timestamp
      },
      results
    });
    
  } catch (error: any) {
    console.error('Manual payment processing error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error?.message || 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}