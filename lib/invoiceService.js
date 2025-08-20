const prisma = require('./prisma.js');

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-XXXX (e.g., INV-20250117-0001)
 */
function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Generate random 4-digit number
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  
  return `INV-${dateStr}-${randomNum}`;
}

/**
 * Create an invoice for a completed order
 * @param {Object} orderData - Order data from webhook
 * @param {string} paymentGateway - Payment gateway name (e.g., 'Cryptomus')
 * @param {string} paymentId - Payment transaction ID
 * @returns {Promise<Object>} Created invoice
 */
async function createInvoice(orderData, paymentGateway, paymentId) {
  try {
    // Generate unique invoice number
    let invoiceNumber;
    let isUnique = false;
    
    // Ensure invoice number is unique
    while (!isUnique) {
      invoiceNumber = generateInvoiceNumber();
      const existingInvoice = await prisma.invoice.findUnique({
        where: { invoiceNumber }
      });
      if (!existingInvoice) {
        isUnique = true;
      }
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderData.order_id },
      include: {
        User: true
      }
    });

    if (!order) {
      throw new Error(`Order not found: ${orderData.order_id}`);
    }

    // Calculate invoice totals
    const subtotal = order.price;
    const tax = 0; // No tax for now
    const total = subtotal + tax;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        userId: order.userId,
        customerName: order.customerName,
        customerEmail: orderData.customer_email || order.User?.email,
        subtotal,
        tax,
        total,
        currency: orderData.currency || 'USD',
        paymentMethod: paymentGateway,
        paymentGateway,
        paymentId,
        status: 'paid',
        notes: `Payment completed via ${paymentGateway}`
      }
    });

    // Create invoice items
    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: `${order.service} service for ${order.game}`,
        game: order.game,
        service: order.service,
        quantity: 1,
        unitPrice: order.price,
        totalPrice: order.price
      }
    });

    console.log(`Invoice created successfully: ${invoiceNumber} for order: ${order.id}`);
    
    return invoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

/**
 * Get invoice with items by invoice ID
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<Object>} Invoice with items
 */
async function getInvoiceById(invoiceId) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        InvoiceItems: true,
        Order: true,
        User: true
      }
    });
    
    return invoice;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
}

/**
 * Get invoice by order ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Invoice with items
 */
async function getInvoiceByOrderId(orderId) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { orderId },
      include: {
        InvoiceItems: true,
        Order: true,
        User: true
      }
    });
    
    return invoice;
  } catch (error) {
    console.error('Error fetching invoice by order ID:', error);
    throw error;
  }
}

/**
 * Get all invoices for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User invoices
 */
async function getUserInvoices(userId) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: {
        InvoiceItems: true,
        Order: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return invoices;
  } catch (error) {
    console.error('Error fetching user invoices:', error);
    throw error;
  }
}

module.exports = {
  createInvoice,
  getInvoiceById,
  getInvoiceByOrderId,
  getUserInvoices,
  generateInvoiceNumber
};