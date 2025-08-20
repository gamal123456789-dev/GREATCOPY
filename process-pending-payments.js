const { PrismaClient } = require('@prisma/client');
const { createInvoice } = require('./lib/invoiceService');
const crypto = require('crypto');
const axios = require('axios');

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
    
    const result = response.data;
    return result;
  } catch (error) {
    console.error('Error checking payment status:', error);
    return null;
  }
}

async function processPendingPayments() {
  try {
    console.log('🔄 Processing Pending Payments...');
    console.log('=' .repeat(60));
    
    // Get all pending payment sessions
    const pendingSessions = await prisma.paymentSession.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${pendingSessions.length} pending payment sessions`);
    
    for (const session of pendingSessions) {
      console.log(`\n🔍 Checking payment: ${session.paymentId}`);
      console.log(`   Order ID: ${session.orderId}`);
      console.log(`   Amount: $${session.amount}`);
      console.log(`   Game: ${session.game}`);
      
      // Check payment status with Cryptomus
      const paymentStatus = await checkPaymentStatus(session.paymentId);
      
      if (paymentStatus && paymentStatus.state === 0) {
        const status = paymentStatus.result.payment_status;
        console.log(`   Status from Cryptomus: ${status}`);
        
        if (status === 'paid' || status === 'paid_over') {
          console.log('   ✅ Payment confirmed! Creating order...');
          
          // Check if order already exists
          const existingOrder = await prisma.order.findUnique({
            where: { id: session.orderId }
          });
          
          if (existingOrder) {
            // Update existing order
            await prisma.order.update({
              where: { id: session.orderId },
              data: {
                status: 'pending',
                notes: `${existingOrder.notes || ''} | Payment confirmed manually at ${new Date().toISOString()}`
              }
            });
            console.log('   📝 Order status updated to completed');
          } else {
            // Create new order
            const order = await prisma.order.create({
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
                notes: `Payment confirmed manually - Payment ID: ${session.paymentId}`
              }
            });
            console.log('   📝 Order created successfully');
          }
          
          // Create invoice
          try {
            const invoiceData = {
              order_id: session.orderId,
              customer_email: session.customerEmail,
              currency: session.currency
            };
            
            const invoice = await createInvoice(invoiceData, 'Cryptomus', session.paymentId);
            console.log(`   📄 Invoice created: ${invoice.invoiceNumber}`);
          } catch (invoiceError) {
            console.error('   ❌ Error creating invoice:', invoiceError.message);
          }
          
          // Update payment session status
          await prisma.paymentSession.update({
            where: { id: session.id },
            data: { status: 'completed' }
          });
          
          console.log('   ✅ Payment session marked as completed');
          
        } else if (status === 'cancel' || status === 'fail' || status === 'wrong_amount_waiting') {
          console.log(`   ❌ Payment ${status} - marking as failed`);
          
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
                notes: `${existingOrder.notes || ''} | Payment ${status} - checked manually at ${new Date().toISOString()}`
              }
            });
          }
        } else {
          console.log(`   ⏳ Payment still pending (${status})`);
        }
      } else {
        console.log('   ❌ Could not check payment status');
      }
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 Processing completed!');
    
  } catch (error) {
    console.error('❌ Error processing pending payments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processPendingPayments();