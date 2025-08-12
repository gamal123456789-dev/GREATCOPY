import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import crypto from 'crypto';

/**
 * REAL PAYMENT GATEWAY INTEGRATION
 * This endpoint integrates with Coinbase Commerce for cryptocurrency payments
 */

// Coinbase Commerce API configuration
const COINBASE_API_URL = 'https://api.commerce.coinbase.com';
const COINBASE_API_KEY = process.env.COINBASE_API_KEY;
const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET;

// Security validation for API keys
function validateApiKeys(): { isValid: boolean; error?: string } {
  if (!COINBASE_API_KEY || COINBASE_API_KEY === 'test-coinbase-key') {
    return { isValid: false, error: 'Coinbase API key not configured or using test key' };
  }
  return { isValid: true };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // SECURITY: Validate API keys before processing
  const keyValidation = validateApiKeys();
  if (!keyValidation.isValid) {
    console.error('Payment API key validation failed:', {
      error: keyValidation.error,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ 
      message: 'Payment service temporarily unavailable',
      error: 'SERVICE_CONFIGURATION_ERROR'
    });
  }

  // Authenticate user before processing payment
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    console.log('Payment attempt without authentication:', {
      hasSession: !!session,
      hasUserId: !!(session?.user?.id),
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ 
      message: 'You need to be logged in to make a payment',
      error: 'AUTHENTICATION_REQUIRED',
      redirectTo: '/auth'
    });
  }

  const { amount, currency, game, service, serviceDetails, paymentMethod, customerInfo } = req.body;

  // Validate required payment data
  if (!amount || !currency || !game || !service) {
    return res.status(400).json({ 
      message: 'Missing required payment data',
      required: ['amount', 'currency', 'game', 'service']
    });
  }

  // Use serviceDetails if available, otherwise fallback to service
  const finalService = serviceDetails || service;

  // Validate amount is positive
  if (amount <= 0) {
    return res.status(400).json({ message: 'Amount must be greater than 0' });
  }

  try {
    // Coinbase Commerce payment processing
    const coinbasePayload = {
      name: `${game} - ${finalService}`,
      description: `Gaming service: ${finalService} for ${game}`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toString(),
        currency: currency || 'USD'
      },
      metadata: {
        customer_id: session.user.id,
        game: game,
        service: finalService,
        serviceDetails: serviceDetails, // Store both for compatibility
        order_id: `order_${Date.now()}_${session.user.id}`
      },
      redirect_url: `${process.env.NEXTAUTH_URL || 'https://gear-score.com'}/orders`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'https://gear-score.com'}/pay/failed`
    };

    const response = await fetch(`${COINBASE_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY!,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(coinbasePayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Payment gateway error details:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        gateway: 'coinbase',
        apiKeyPrefix: COINBASE_API_KEY?.substring(0, 8) + '...'
      });
      
      // Enhanced error handling for API issues
      if (response.status === 401) {
        console.error('🚨 Coinbase API authentication failed:', {
          apiKeyPrefix: COINBASE_API_KEY?.substring(0, 10) + '...',
          timestamp: new Date().toISOString(),
          orderId: coinbasePayload.metadata.order_id,
          amount: coinbasePayload.local_price.amount
        });
        
        return res.status(503).json({
          error: 'Payment service temporarily unavailable',
          message: 'Our payment system is currently being configured. Please contact our support team for assistance.',
          code: 'PAYMENT_SERVICE_UNAVAILABLE',
          alternatives: {
            contact: 'Please reach out to our support team',
            email: 'support@gear-score.com',
            discord: 'Join our Discord server for immediate assistance'
          },
          orderId: coinbasePayload.metadata.order_id
        });
      }
      
      throw new Error(`Payment gateway error: ${response.status} - ${errorData.error?.message || response.statusText || 'Unknown error'}`);
    }

    const paymentResult = await response.json();

    // Handle Coinbase Commerce response
    if (paymentResult.data) {
      const coinbaseData = paymentResult.data;
      
      const successResponse = {
        success: true,
        charge_id: coinbaseData.id,
        hosted_url: coinbaseData.hosted_url,
        amount: parseFloat(amount),
        currency,
        game,
        service: finalService,
        serviceDetails: serviceDetails, // Include serviceDetails in response
        status: 'pending_payment',
        timestamp: new Date().toISOString(),
        message: 'Coinbase Commerce payment created successfully',
        payment_url: coinbaseData.hosted_url,
        gateway_response: { provider: 'coinbase' }
      };

      console.log('REAL PAYMENT PROCESSED:', {
        ...successResponse,
        gateway_response: '[REDACTED]' // Don't log sensitive data
      });

      res.status(200).json(successResponse);
    } else {
      throw new Error('Invalid response from Coinbase Commerce API');
    }
  } catch (error) {
    console.error('Error processing real payment:', error);
    
    // Return appropriate error response
    const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
    
    res.status(500).json({ 
      success: false,
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to validate payment method
function isValidPaymentMethod(method: string): boolean {
  const validMethods = ['card', 'paypal', 'bank_transfer', 'crypto', 'coinbase'];
  return validMethods.includes(method);
}

// Helper function to format amount
function formatAmount(amount: number): number {
  return Math.round(amount * 100) / 100; // Round to 2 decimal places
}