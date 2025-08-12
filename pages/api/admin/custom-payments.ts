import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

/**
 * API endpoint for managing custom payment requests
 * Handles creating new custom payment requests and retrieving existing ones
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Authentication and authorization - SECURITY FIX: Removed test admin bypass
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, name: true, email: true }
    });
    
    if (!adminUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    // Security logging for admin actions
    console.log(`[SECURITY] Admin access: User ${adminUser.id} accessing custom payments at ${new Date().toISOString()}`);

    if (req.method === 'GET') {
      // Retrieve all custom payment requests
      const customPayments = await prisma.customPaymentRequest.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json(customPayments);
    }

    if (req.method === 'POST') {
      // Create new custom payment request
      const { customerEmail, description, amount, dueDate } = req.body;

      // Validate required fields
      if (!customerEmail || !description || !amount) {
        return res.status(400).json({ 
          error: 'Missing required fields: customerEmail, description, and amount are required' 
        });
      }

      // Validate amount is a positive number
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ 
          error: 'Amount must be a positive number' 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        return res.status(400).json({ 
          error: 'Invalid email format' 
        });
      }

      // Create the custom payment request
      const { v4: uuidv4 } = require('uuid');
      const customPaymentRequest = await prisma.customPaymentRequest.create({
        data: {
          id: uuidv4(),
          customerEmail,
          description,
          amount: parsedAmount,
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'pending',
          createdBy: adminUser.id,
          updatedAt: new Date()
        }
      });

      return res.status(201).json(customPaymentRequest);
    }

    if (req.method === 'DELETE') {
      // Delete custom payment request
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ 
          error: 'Missing required field: id' 
        });
      }

      // Check if payment request exists
      const existingRequest = await prisma.customPaymentRequest.findUnique({
        where: { id }
      });

      if (!existingRequest) {
        return res.status(404).json({ 
          error: 'Payment request not found' 
        });
      }

      // Only allow deletion of pending requests
      if (existingRequest.status === 'paid') {
        return res.status(400).json({ 
          error: 'Cannot delete paid payment requests' 
        });
      }

      // Delete the payment request
      await prisma.customPaymentRequest.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Payment request deleted successfully' });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Custom payments API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}