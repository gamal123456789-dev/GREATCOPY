const { PrismaClient } = require('@prisma/client');
const { createInvoice } = require('./lib/invoiceService');

const prisma = new PrismaClient();

async function createManualOrder() {
  try {
    console.log('🔄 Creating manual order for successful payment...');
    
    // Example payment data - replace with actual payment details
    const paymentData = {
      order_id: `manual_order_${Date.now()}`,
      amount: '75.50', // Replace with actual amount
      currency: 'USD',
      uuid: `manual_payment_${Date.now()}`,
      user_id: 'user_id_here', // Replace with actual user ID
      customer_email: 'customer@example.com', // Replace with actual email
      game: 'Game Name', // Replace with actual game
      service: 'Service Description' // Replace with actual service
    };
    
    console.log('Payment data:', paymentData);
    
    // Check if order already exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: paymentData.order_id }
    });
    
    if (existingOrder) {
      console.log('❌ Order already exists:', paymentData.order_id);
      return;
    }
    
    // Create the order
    const order = await prisma.order.create({
      data: {
        id: paymentData.order_id,
        userId: paymentData.user_id,
        customerName: paymentData.customer_email,
        date: new Date(),
        game: paymentData.game,
        service: paymentData.service,
        price: parseFloat(paymentData.amount),
        status: 'completed',
        paymentId: paymentData.uuid,
        notes: `Manual order creation - Payment ID: ${paymentData.uuid}`
      }
    });
    
    console.log('✅ Order created successfully:', order.id);
    
    // Create invoice
    try {
      const invoiceData = {
        order_id: paymentData.order_id,
        customer_email: paymentData.customer_email,
        currency: paymentData.currency
      };
      
      const invoice = await createInvoice(invoiceData, 'Manual', paymentData.uuid);
      console.log('✅ Invoice created:', invoice.invoiceNumber);
    } catch (invoiceError) {
      console.error('❌ Error creating invoice:', invoiceError);
    }
    
    console.log('\n🎉 Manual order creation completed successfully!');
    console.log('Order details:');
    console.log('- Order ID:', order.id);
    console.log('- Customer:', order.customerName);
    console.log('- Game:', order.game);
    console.log('- Service:', order.service);
    console.log('- Amount:', `$${order.price}`);
    console.log('- Status:', order.status);
    
  } catch (error) {
    console.error('❌ Error creating manual order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Instructions for usage
console.log('📋 Manual Order Creation Tool');
console.log('============================');
console.log('Before running this script:');
console.log('1. Replace user_id with actual user ID');
console.log('2. Replace customer_email with actual email');
console.log('3. Replace game and service with actual details');
console.log('4. Replace amount with actual payment amount');
console.log('\nTo run: node create-manual-order.js\n');

// Uncomment the line below to run the script
// createManualOrder();

module.exports = { createManualOrder };