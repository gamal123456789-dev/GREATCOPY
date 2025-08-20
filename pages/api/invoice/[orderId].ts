import { NextApiRequest, NextApiResponse } from 'next';
import { getInvoiceByOrderId } from '../../../lib/invoiceService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get user session
    const session = await getServerSession(req, res, authOptions);
    
    // Get invoice by order ID
    const invoice = await getInvoiceByOrderId(orderId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Type cast invoice for TypeScript
    const invoiceData = invoice as any;

    // Check if user has permission to view this invoice
    if (session?.user?.id !== invoiceData.userId && session?.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Return invoice data
    res.status(200).json({
      success: true,
      invoice: {
        id: invoiceData.id,
        invoiceNumber: invoiceData.invoiceNumber,
        orderId: invoiceData.orderId,
        customerName: invoiceData.customerName,
        customerEmail: invoiceData.customerEmail,
        issueDate: invoiceData.issueDate,
        status: invoiceData.status,
        subtotal: invoiceData.subtotal,
        tax: invoiceData.tax,
        total: invoiceData.total,
        currency: invoiceData.currency,
        paymentMethod: invoiceData.paymentMethod,
        paymentGateway: invoiceData.paymentGateway,
        paymentId: invoiceData.paymentId,
        notes: invoiceData.notes,
        items: invoiceData.InvoiceItems?.map((item: any) => ({
          id: item.id,
          description: item.description,
          game: item.game,
          service: item.service,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })) || [],
        order: {
          id: invoiceData.Order?.id,
          game: invoiceData.Order?.game,
          service: invoiceData.Order?.service,
          status: invoiceData.Order?.status,
          date: invoiceData.Order?.date
        }
      }
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}