const { PrismaClient } = require('@prisma/client');
const { createInvoice } = require('./lib/invoiceService');
const { emitToUser, emitToAdmin } = require('./lib/socket-cjs');
const { sendNewOrderNotification, sendCompleteOrderNotifications } = require('./lib/notificationService');
const crypto = require('crypto');
const axios = require('axios');

// Notification functions are now handled by notificationService

const prisma = new PrismaClient();

// Cryptomus API configuration
const apiKey = process.env.CRYPTOMUS_API_KEY || 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
const merchantId = process.env.CRYPTOMUS_MERCHANT_ID || '07d3dac2-7868-4fda-b6e9-7d2cfca03da4';

async function checkPaymentStatus(paymentId) {
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

async function processPayments() {
  try {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] 🔄 Auto-processing pending payments...`);
    
    // Get all pending payment sessions
    const pendingSessions = await prisma.paymentSession.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (pendingSessions.length === 0) {
      console.log(`[${timestamp}] ✅ No pending payments to process`);
      return;
    }
    
    console.log(`[${timestamp}] Found ${pendingSessions.length} pending payment sessions`);
    
    let processed = 0;
    let completed = 0;
    let failed = 0;
    
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
              // Check if payment was already confirmed for this order
              if (existingOrder.notes && existingOrder.notes.includes('Payment confirmed automatically')) {
                console.log(`[${timestamp}] ⏭️  Payment already processed for order: ${session.orderId}`);
                // Update session status to completed to avoid reprocessing
                await prisma.paymentSession.update({
                  where: { id: session.id },
                  data: { status: 'completed' }
                });
                continue;
              }
              
              // Update existing order (first time confirmation)
              await prisma.order.update({
                where: { id: session.orderId },
                data: {
                  status: 'pending',
                  notes: `${existingOrder.notes || ''} | Payment confirmed automatically at ${timestamp}`
                }
              });
              
              console.log(`[${timestamp}] ✅ Updated existing order: ${session.orderId}`);
            } else {
              // Create new order
              const newOrder = await prisma.order.create({
                data: {
                  id: session.orderId,
                  userId: session.userId,
                  customerName: session.customerEmail,
                  date: new Date(),
                  game: session.game,
                  service: session.serviceDetails || session.service,
                  price: session.amount,
                  status: 'pending',
                  paymentId: session.paymentId,
                  notes: `Payment confirmed automatically - Payment ID: ${session.paymentId}`
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
              
              // Skip notifications - will be handled by webhook to prevent duplicates
              console.log(`[${timestamp}] ⚠️ Notifications skipped for order: ${newOrder.id} (handled by webhook)`);
              
              // Note: Notifications will be sent by the webhook handler to ensure single collective notification
            }
            
            // Create invoice
            try {
              const invoiceData = {
                order_id: session.orderId,
                customer_email: session.customerEmail,
                currency: session.currency
              };
              
              await createInvoice(invoiceData, 'Cryptomus', session.paymentId);
              console.log(`[${timestamp}] 📄 Invoice created for order: ${session.orderId}`);
            } catch (invoiceError) {
              console.error(`[${timestamp}] ❌ Invoice creation failed for ${session.orderId}:`, invoiceError.message);
            }
            
            // Update payment session status
            await prisma.paymentSession.update({
              where: { id: session.id },
              data: { status: 'completed' }
            });
            
            completed++;
            
          } else if (status === 'cancel' || status === 'fail' || status === 'wrong_amount_waiting') {
            console.log(`[${timestamp}] ❌ Payment ${status}: ${session.paymentId}`);
            
            // Update payment session status
            await prisma.paymentSession.update({
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
                  notes: `${existingOrder.notes || ''} | Payment ${status} - auto-checked at ${timestamp}`
                }
              });
            }
            
            failed++;
          }
        }
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`[${timestamp}] ❌ Error processing session ${session.id}:`, error.message);
      }
    }
    
    console.log(`[${timestamp}] 📊 Processing summary: ${processed} processed, ${completed} completed, ${failed} failed`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Auto-processing error:`, error);
  }
}

// Run immediately on start
processPayments();

// Run every 1 second
setInterval(processPayments, 1000);

console.log('🚀 Auto payment processor started - checking every 1 second');
console.log('Press Ctrl+C to stop');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down auto payment processor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down auto payment processor...');
  await prisma.$disconnect();
  process.exit(0);
});