import { NextApiRequest, NextApiResponse } from 'next';
import { getInvoiceByOrderId } from '../../../../lib/invoiceService';
import { generateInvoiceHTML } from '../../../../lib/invoiceTemplate';
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
    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get user session
    const session = await getServerSession(req, res, authOptions);
    
    // Get invoice by order ID
    const invoice = await getInvoiceByOrderId(orderId);

    if (!invoice) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>فاتورة غير موجودة</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #dc3545; font-size: 1.2em; }
            </style>
        </head>
        <body>
            <div class="error">
                <h2>فاتورة غير موجودة</h2>
                <p>لم يتم العثور على فاتورة لهذا الطلب</p>
            </div>
        </body>
        </html>
      `);
    }

    // Type cast invoice for TypeScript
    const invoiceData = invoice as any;

    // Check if user has permission to view this invoice
    if (session?.user?.id !== invoiceData.userId && session?.user?.role !== 'admin') {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>غير مصرح</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #dc3545; font-size: 1.2em; }
            </style>
        </head>
        <body>
            <div class="error">
                <h2>غير مصرح لك بعرض هذه الفاتورة</h2>
                <p>يرجى تسجيل الدخول بالحساب المناسب</p>
            </div>
        </body>
        </html>
      `);
    }

    // Prepare invoice data for template
    const templateData = {
      invoiceNumber: invoiceData.invoiceNumber,
      customerName: invoiceData.customerName,
      customerEmail: invoiceData.customerEmail,
      issueDate: invoiceData.issueDate,
      orderId: invoiceData.orderId,
      subtotal: invoiceData.subtotal,
      tax: invoiceData.tax,
      total: invoiceData.total,
      currency: invoiceData.currency,
      paymentMethod: invoiceData.paymentMethod,
      paymentGateway: invoiceData.paymentGateway,
      paymentId: invoiceData.paymentId,
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
    };

    // Generate HTML invoice
    const htmlInvoice = generateInvoiceHTML(templateData);

    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(htmlInvoice);

  } catch (error) {
    console.error('Error generating invoice view:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
          <meta charset="UTF-8">
          <title>خطأ في الخادم</title>
          <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc3545; font-size: 1.2em; }
          </style>
      </head>
      <body>
          <div class="error">
              <h2>خطأ في الخادم</h2>
              <p>حدث خطأ أثناء إنشاء الفاتورة</p>
          </div>
      </body>
      </html>
    `);
  }
}