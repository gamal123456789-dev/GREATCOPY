/**
 * Generate HTML template for invoice
 * @param {Object} invoiceData - Invoice data with items and order details
 * @returns {string} HTML template
 */
function generateInvoiceHTML(invoiceData) {
  const {
    invoiceNumber,
    customerName,
    customerEmail,
    issueDate,
    orderId,
    subtotal,
    tax,
    total,
    currency,
    paymentMethod,
    paymentGateway,
    paymentId,
    items = [],
    order = {}
  } = invoiceData;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, curr = currency) => {
    return `${amount.toFixed(2)} ${curr}`;
  };

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة رقم ${invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            padding: 20px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .invoice-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .invoice-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
        }
        
        .invoice-number {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .invoice-body {
            padding: 30px;
        }
        
        .invoice-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .info-section h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.1em;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 5px;
        }
        
        .info-item {
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }
        
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        
        .info-value {
            color: #6c757d;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .items-table th {
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: right;
            font-weight: 600;
        }
        
        .items-table td {
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .items-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .totals-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
        }
        
        .total-row.final {
            border-top: 2px solid #667eea;
            padding-top: 15px;
            margin-top: 15px;
            font-size: 1.2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .payment-info {
            background: #e8f4f8;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
            border-right: 4px solid #17a2b8;
        }
        
        .payment-info h3 {
            color: #17a2b8;
            margin-bottom: 15px;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            color: #6c757d;
            font-size: 0.9em;
        }
        
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-paid {
            background: #d4edda;
            color: #155724;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .invoice-container {
                box-shadow: none;
                border-radius: 0;
            }
        }
        
        @media (max-width: 768px) {
            .invoice-info {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .items-table {
                font-size: 0.9em;
            }
            
            .items-table th,
            .items-table td {
                padding: 10px 8px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <h1>فاتورة</h1>
            <div class="invoice-number">رقم الفاتورة: ${invoiceNumber}</div>
        </div>
        
        <div class="invoice-body">
            <div class="invoice-info">
                <div class="info-section">
                    <h3>معلومات العميل</h3>
                    <div class="info-item">
                        <span class="info-label">اسم العميل:</span>
                        <span class="info-value">${customerName}</span>
                    </div>
                    ${customerEmail ? `
                    <div class="info-item">
                        <span class="info-label">البريد الإلكتروني:</span>
                        <span class="info-value">${customerEmail}</span>
                    </div>
                    ` : ''}
                    <div class="info-item">
                        <span class="info-label">رقم الطلب:</span>
                        <span class="info-value">${orderId}</span>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3>معلومات الفاتورة</h3>
                    <div class="info-item">
                        <span class="info-label">تاريخ الإصدار:</span>
                        <span class="info-value">${formatDate(issueDate)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">حالة الفاتورة:</span>
                        <span class="info-value">
                            <span class="status-badge status-paid">مدفوعة</span>
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">طريقة الدفع:</span>
                        <span class="info-value">${paymentGateway}</span>
                    </div>
                    ${paymentId ? `
                    <div class="info-item">
                        <span class="info-label">معرف الدفع:</span>
                        <span class="info-value">${paymentId}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>الوصف</th>
                        <th>اللعبة</th>
                        <th>الخدمة</th>
                        <th>الكمية</th>
                        <th>السعر الوحدة</th>
                        <th>المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                    <tr>
                        <td>${item.description}</td>
                        <td>${item.game}</td>
                        <td>${item.service}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.unitPrice)}</td>
                        <td>${formatCurrency(item.totalPrice)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="totals-section">
                <div class="total-row">
                    <span>المجموع الفرعي:</span>
                    <span>${formatCurrency(subtotal)}</span>
                </div>
                ${tax > 0 ? `
                <div class="total-row">
                    <span>الضريبة:</span>
                    <span>${formatCurrency(tax)}</span>
                </div>
                ` : ''}
                <div class="total-row final">
                    <span>المجموع الإجمالي:</span>
                    <span>${formatCurrency(total)}</span>
                </div>
            </div>
            
            <div class="payment-info">
                <h3>معلومات الدفع</h3>
                <p><strong>بوابة الدفع:</strong> ${paymentGateway}</p>
                <p><strong>طريقة الدفع:</strong> ${paymentMethod}</p>
                ${paymentId ? `<p><strong>معرف المعاملة:</strong> ${paymentId}</p>` : ''}
                <p><strong>حالة الدفع:</strong> <span class="status-badge status-paid">تم الدفع بنجاح</span></p>
            </div>
        </div>
        
        <div class="footer">
            <p>شكراً لك على ثقتك بنا | Gear Score</p>
            <p>تم إنشاء هذه الفاتورة تلقائياً في ${formatDate(new Date())}</p>
        </div>
    </div>
</body>
</html>
  `;
}

module.exports = {
  generateInvoiceHTML
};