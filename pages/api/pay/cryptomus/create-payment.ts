import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import crypto from 'crypto';

/**
 * Cryptomus Payment Creation API
 * Creates a payment request with Cryptomus and returns the payment URL
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== Cryptomus Payment Creation Started ===');
    console.log('Request body:', req.body);
    
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    console.log('Session check:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userEmail: session?.user?.email 
    });
    
    if (!session?.user?.id) {
      console.log('Unauthorized: No session or user ID');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, currency = 'USD', game, service, serviceDetails, description } = req.body;
    console.log('Extracted data:', { amount, currency, game, service, serviceDetails });

    // Validate required fields
    if (!amount || !game || !service) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: amount, game, service' 
      });
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      console.log('Validation failed: Invalid amount:', amount);
      return res.status(400).json({ error: 'Invalid amount' });
    }
    console.log('Validation passed. Amount:', numAmount);

    // Generate unique order ID
    const orderId = `cm_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Cryptomus API configuration
    const apiKey = process.env.CRYPTOMUS_API_KEY || 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
    const merchantId = process.env.CRYPTOMUS_MERCHANT_ID || '07d3dac2-7868-4fda-b6e9-7d2cfca03da4';
    const baseUrl = 'https://api.cryptomus.com/v1';
    
    console.log('Cryptomus config:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      hasMerchantId: !!merchantId,
      merchantId: merchantId,
      baseUrl
    });
    
    if (!apiKey || !merchantId) {
      console.log('Missing Cryptomus credentials');
      return res.status(500).json({ 
        error: 'Cryptomus API credentials not configured' 
      });
    }
    
    // Prepare invoice data for Cryptomus
    const invoiceData = {
      amount: numAmount.toString(),
      currency: currency,
      order_id: orderId,
      url_return: `${process.env.NEXTAUTH_URL || 'http://localhost:5200'}/pay/success?orderId=${orderId}&game=${encodeURIComponent(game)}&service=${encodeURIComponent(service)}&serviceDetails=${encodeURIComponent(serviceDetails || service)}&amount=${numAmount}`,
      url_callback: `${process.env.NEXTAUTH_URL || 'http://localhost:5200'}/api/pay/cryptomus/webhook`,
      url_success: `${process.env.NEXTAUTH_URL || 'http://localhost:5200'}/pay/success?orderId=${orderId}`,
      url_cancel: `${process.env.NEXTAUTH_URL || 'http://localhost:5200'}/pay/failed?orderId=${orderId}`,
      is_payment_multiple: false,
      lifetime: 7200, // 2 hours
      to_currency: 'USDT', // Default to USDT
      subtract: '1', // Subtract fees from merchant
      accuracy_payment_percent: '1',
      additional_data: JSON.stringify({
        user_id: session.user.id,
        game: game,
        service: service,
        customer_email: session.user.email || ''
      })
    };
    
    console.log('Invoice data prepared:', {
      orderId,
      amount: invoiceData.amount,
      currency: invoiceData.currency,
      urls: {
        return: invoiceData.url_return,
        callback: invoiceData.url_callback,
        success: invoiceData.url_success,
        cancel: invoiceData.url_cancel
      }
    });

    // Create signature for Cryptomus API
    const dataString = Buffer.from(JSON.stringify(invoiceData)).toString('base64');
    const signature = crypto
      .createHash('md5')
      .update(dataString + apiKey)
      .digest('hex');
    
    console.log('Signature created:', {
      dataStringLength: dataString.length,
      signatureLength: signature.length
    });

    // Make request to Cryptomus API
    console.log('Sending request to Cryptomus API:', `${baseUrl}/payment`);
    const cryptomusResponse = await fetch(`${baseUrl}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': merchantId,
        'sign': signature
      },
      body: JSON.stringify(invoiceData)
    });
    
    console.log('Cryptomus API response status:', cryptomusResponse.status);

    const cryptomusResult = await cryptomusResponse.json();
    
    console.log('Cryptomus Response:', {
      status: cryptomusResponse.status,
      ok: cryptomusResponse.ok,
      result: cryptomusResult
    });

    if (!cryptomusResponse.ok || cryptomusResult.state !== 0) {
      console.error('Cryptomus API error:', cryptomusResult);
      return res.status(500).json({ 
        error: 'Failed to create payment',
        details: cryptomusResult.message || 'Unknown error'
      });
    }

    // Return payment URL to frontend
    res.status(200).json({
      success: true,
      paymentUrl: cryptomusResult.result.url,
      orderId,
      invoiceId: cryptomusResult.result.uuid,
      amount: numAmount,
      currency
    });

  } catch (error) {
    console.error('Cryptomus payment creation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}