import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import NotificationCenter from '../../components/NotificationCenter';

interface InvoiceData {
  id: string;
  game: string;
  service: string;
  details?: string;
  price: number;
  status: string;
  paymentMethod: string;
  date: string;
  customerName?: string;
  customerEmail?: string;
  transactionId?: string;
}

/**
 * Invoice Page Component
 * Displays invoice with real-time notifications for Cryptomus payments
 */
export default function InvoicePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { orderId } = router.query;

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session && !orderId) {
      router.push('/auth/signin');
      return;
    }

    if (orderId) {
      fetchInvoiceData(orderId as string);
    }
  }, [session, status, orderId]);

  const fetchInvoiceData = async (orderIdParam: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/orders/${orderIdParam}`);
      
      if (!response.ok) {
        throw new Error('Invoice not found');
      }
      
      const orderData = await response.json();
      setInvoice({
        id: orderData.id,
        game: orderData.game,
        service: orderData.service,
        details: orderData.details,
        price: orderData.price,
        status: orderData.status,
        paymentMethod: orderData.paymentMethod || 'Cryptomus',
        date: orderData.date,
        customerName: orderData.customerName || session?.user?.name,
        customerEmail: orderData.customerEmail || session?.user?.email,
        transactionId: orderData.transactionId
      });
      
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('فشل في تحميل الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Open the HTML invoice view in a new tab for PDF generation
    window.open(`/api/invoice/view/${orderId}`, '_blank');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">جاري تحميل الفاتورة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center border border-gray-700">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">خطأ</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/orders')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة إلى الطلبات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Notification Center for payment confirmations */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationCenter />
      </div>
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">فاتورة رقم #{invoice?.id}</h1>
            <div className="flex space-x-4 rtl:space-x-reverse">
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                طباعة
              </button>
              <button
                onClick={handleDownloadPDF}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تحميل PDF
              </button>
            </div>
          </div>
          
          {/* Payment Status Badge */}
          <div className="flex justify-center mb-6">
            <span className={`px-6 py-3 rounded-full text-lg font-bold ${
              invoice?.status === 'COMPLETED' 
                ? 'bg-green-100 text-green-800'
                : invoice?.status === 'PROCESSING'
                ? 'bg-blue-100 text-blue-800'
                : invoice?.status === 'PENDING'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {invoice?.status === 'COMPLETED' ? 'مدفوعة' : 
               invoice?.status === 'PROCESSING' ? 'قيد المعالجة' :
               invoice?.status === 'PENDING' ? 'في الانتظار' : invoice?.status}
            </span>
          </div>
        </div>

        {/* Invoice Details */}
        {invoice && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Customer Information */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">معلومات العميل</h2>
                <div className="space-y-2">
                  <p className="text-gray-300">
                    <span className="font-medium">الاسم:</span> {invoice.customerName || 'غير محدد'}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">البريد الإلكتروني:</span> {invoice.customerEmail || 'غير محدد'}
                  </p>
                </div>
              </div>
              
              {/* Invoice Information */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">معلومات الفاتورة</h2>
                <div className="space-y-2">
                  <p className="text-gray-300">
                    <span className="font-medium">تاريخ الإنشاء:</span> {new Date(invoice.date).toLocaleDateString('ar-SA')}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">طريقة الدفع:</span> {invoice.paymentMethod}
                  </p>
                  {invoice.transactionId && (
                    <p className="text-gray-300">
                      <span className="font-medium">معرف المعاملة:</span> {invoice.transactionId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="border-t border-gray-600 pt-8">
              <h2 className="text-xl font-semibold text-white mb-4">تفاصيل الخدمة</h2>
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">اللعبة</p>
                    <p className="text-white font-medium">{invoice.game}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">الخدمة</p>
                    <p className="text-white font-medium">{invoice.service}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">المبلغ</p>
                    <p className="text-white font-bold text-lg">${invoice.price}</p>
                  </div>
                </div>
                
                {invoice.details && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">تفاصيل إضافية</p>
                    <div className="bg-gray-600 rounded p-3">
                      <p className="text-gray-200 text-sm whitespace-pre-wrap">{invoice.details}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-600 pt-6 mt-8">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-white">المجموع الكلي:</span>
                <span className="text-2xl font-bold text-green-400">${invoice.price}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-600 pt-6 mt-8 text-center">
              <p className="text-gray-400 text-sm">
                شكراً لك على اختيار خدماتنا. إذا كان لديك أي استفسارات، يرجى التواصل معنا.
              </p>
              <p className="text-gray-500 text-xs mt-2">
                gear-score.com - خدمات الألعاب الاحترافية
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Server-side props to handle query parameters properly
export async function getServerSideProps(context: any) {
  const { orderId } = context.query;
  
  return {
    props: {
      orderId: orderId || null,
    },
  };
}