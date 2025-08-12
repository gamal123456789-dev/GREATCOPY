import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

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
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Security logging for admin actions
    console.log(`[SECURITY] Admin access: User ${adminUser.id} accessing price changes at ${new Date().toISOString()}`);

    if (req.method === 'GET') {
      // Get all price changes
      const priceChanges = await prisma.priceChange.findMany({
        include: {
          Order: {
            select: {
              id: true,
              customerName: true,
              game: true,
              service: true
            }
          },
          User: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return res.status(200).json(priceChanges);
    }
    
    if (req.method === 'POST') {
      // Create a new price change record
      const { orderId, oldPrice, newPrice, reason } = req.body;
      
      if (!orderId || oldPrice === undefined || newPrice === undefined || !reason) {
        return res.status(400).json({ error: 'Missing required fields: orderId, oldPrice, newPrice, reason' });
      }
      
      // Verify the order exists
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Create the price change record
      const priceChange = await prisma.priceChange.create({
        data: {
          id: uuidv4(),
          orderId,
          oldPrice: parseFloat(oldPrice.toString()),
          newPrice: parseFloat(newPrice.toString()),
          reason,
          changedBy: adminUser.name || adminUser.email || 'Admin',
          changedById: adminUser.id
        },
        include: {
          Order: {
            select: {
              id: true,
              customerName: true,
              game: true,
              service: true
            }
          },
          User: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      return res.status(201).json(priceChange);
    }
    
    if (req.method === 'DELETE') {
      // Delete a price change record
      const { id } = req.query;
      const { deleteReason } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }
      
      if (!deleteReason) {
        return res.status(400).json({ error: 'Missing required field: deleteReason' });
      }
      
      // Verify the price change exists
      const priceChange = await prisma.priceChange.findUnique({
        where: { id: id as string }
      });
      
      if (!priceChange) {
        return res.status(404).json({ error: 'Price change not found' });
      }
      
      // Create a record in DeletedPriceChange before deleting
      await prisma.deletedPriceChange.create({
        data: {
          id: uuidv4(),
          originalId: priceChange.id,
          orderId: priceChange.orderId,
          oldPrice: priceChange.oldPrice,
          newPrice: priceChange.newPrice,
          reason: priceChange.reason,
          changedBy: priceChange.changedBy,
          changedById: priceChange.changedById,
          originalCreatedAt: priceChange.createdAt,
          deletedBy: adminUser.name || adminUser.email || 'Admin',
          deletedById: adminUser.id,
          deleteReason: deleteReason
        }
      });
      
      // Delete the price change record
      await prisma.priceChange.delete({
        where: { id: id as string }
      });
      
      return res.status(200).json({ message: 'Price change deleted successfully and logged' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Price changes API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}