import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

/**
 * Coinbase Commerce Payment Creation API
 * Creates a payment request with Coinbase Commerce and returns the payment URL
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, currency = 'USD', game, service, serviceDetails, description } = req.body;

    // Validate required fields
    if (!amount || !game || !service) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, game, service' 
      });
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Generate unique order ID
    const orderId = `cb_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Coinbase Commerce API configuration
    const apiKey = process.env.COINBASE_COMMERCE_API_KEY;
    const baseUrl = 'https://api.commerce.coinbase.com';
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Coinbase Commerce API key not configured' 
      });
    }
    
    // Prepare charge data for Coinbase Commerce
    const chargeData = {
      name: `${game} - ${service}`,
      description: description || `${service} for ${game}`,
      local_price: {
        amount: numAmount.toString(),
        currency: currency
      },
      pricing_type: 'fixed_price',
      metadata: {
        order_id: orderId,
        user_id: session.user.id,
        game: game,
        service: service,
        customer_email: session.user.email || ''
      },
      redirect_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pay/success?orderId=${orderId}&game=${encodeURIComponent(game)}&service=${encodeURIComponent(service)}&serviceDetails=${encodeURIComponent(serviceDetails || service)}&amount=${numAmount}`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/pay/failed?orderId=${orderId}`
    };

    // Make request to Coinbase Commerce API
    const coinbaseResponse = await fetch(`${baseUrl}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': apiKey,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(chargeData)
    });

    const coinbaseResult = await coinbaseResponse.json();
    
    console.log('Coinbase Commerce Response:', {
      status: coinbaseResponse.status,
      ok: coinbaseResponse.ok,
      data: coinbaseResult.data,
      hosted_url: coinbaseResult.data?.hosted_url
    });

    if (!coinbaseResponse.ok) {
      console.error('Coinbase Commerce API error:', coinbaseResult);
      return res.status(500).json({ 
        error: 'Failed to create payment',
        details: coinbaseResult.error?.message || 'Unknown error'
      });
    }

    // Note: Order will be created only after successful payment confirmation
    // via webhook or success page to prevent creating orders without payment

    // Return payment URL to frontend
    res.status(200).json({
      success: true,
      paymentUrl: coinbaseResult.data.hosted_url,
      orderId,
      chargeId: coinbaseResult.data.id,
      amount: numAmount,
      currency
    });

  } catch (error) {
    console.error('Coinbase Commerce payment creation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}