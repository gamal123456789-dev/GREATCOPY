const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInvoices() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('🧾 Recent Invoices:');
    
    if (invoices.length === 0) {
      console.log('No invoices found.');
      return;
    }
    
    invoices.forEach((invoice, index) => {
      console.log(`\n${index + 1}. Invoice: ${invoice.invoiceNumber}`);
      console.log(`   Order ID: ${invoice.orderId}`);
      console.log(`   Customer: ${invoice.customerEmail}`);
      console.log(`   Amount: $${invoice.amount} ${invoice.currency}`);
      console.log(`   Status: ${invoice.status}`);
      console.log(`   Created: ${new Date(invoice.createdAt).toString()}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvoices();