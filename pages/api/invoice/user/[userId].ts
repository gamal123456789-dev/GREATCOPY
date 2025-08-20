import { NextApiRequest, NextApiResponse } from 'next';
import { getUserInvoices } from '../../../../lib/invoiceService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user session
    const session = await getServerSession(req, res, authOptions);
    
    // Check if user has permission to view these invoices
    if (session?.user?.id !== userId && session?.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user invoices
    const invoices = await getUserInvoices(userId);

    // Format invoices data
    const formattedInvoices = (invoices as any[]).map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.orderId,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      issueDate: invoice.issueDate,
      status: invoice.status,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      currency: invoice.currency,
      paymentMethod: invoice.paymentMethod,
      paymentGateway: invoice.paymentGateway,
      paymentId: invoice.paymentId,
      createdAt: invoice.createdAt,
      items: invoice.InvoiceItems?.map((item: any) => ({
        id: item.id,
        description: item.description,
        game: item.game,
        service: item.service,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })) || [],
      order: {
        id: invoice.Order?.id,
        game: invoice.Order?.game,
        service: invoice.Order?.service,
        status: invoice.Order?.status,
        date: invoice.Order?.date
      }
    }));

    res.status(200).json({
      success: true,
      invoices: formattedInvoices,
      count: formattedInvoices.length
    });

  } catch (error) {
    console.error('Error fetching user invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}