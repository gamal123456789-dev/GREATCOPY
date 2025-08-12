import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

/**
 * API endpoint for custom payment request processing
 * GET: Retrieve payment request details
 * POST: Process payment and mark as paid
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid payment request ID' });
  }

  try {
    if (req.method === 'GET') {
      // Get payment request details (no authentication required for viewing)
      const paymentRequest = await prisma.customPaymentRequest.findUnique({
        where: { id },
        select: {
          id: true,
          customerEmail: true,
          description: true,
          amount: true,
          status: true,
          dueDate: true,
          createdAt: true
        }
      });

      if (!paymentRequest) {
        return res.status(404).json({ error: 'Payment request not found' });
      }

      // Check if payment request is expired (optional - if dueDate is set)
      if (paymentRequest.dueDate && new Date() > new Date(paymentRequest.dueDate)) {
        return res.status(410).json({ error: 'Payment request has expired' });
      }

      return res.status(200).json(paymentRequest);
    }

    if (req.method === 'POST') {
      // Process payment - requires authentication
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user?.email) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { transactionId, paymentMethod } = req.body;

      if (!transactionId || !paymentMethod) {
        return res.status(400).json({ 
          error: 'Missing required fields: transactionId and paymentMethod' 
        });
      }

      // Get the payment request
      const paymentRequest = await prisma.customPaymentRequest.findUnique({
        where: { id }
      });

      if (!paymentRequest) {
        return res.status(404).json({ error: 'Payment request not found' });
      }

      if (paymentRequest.status === 'paid') {
        return res.status(400).json({ error: 'Payment request already paid' });
      }

      // Check if payment request is expired
      if (paymentRequest.dueDate && new Date() > new Date(paymentRequest.dueDate)) {
        return res.status(410).json({ error: 'Payment request has expired' });
      }

      // Update payment request as paid
      const updatedRequest = await prisma.customPaymentRequest.update({
        where: { id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          paymentMethod,
          paymentId: transactionId
        }
      });

      return res.status(200).json(updatedRequest);
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Custom payment API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}