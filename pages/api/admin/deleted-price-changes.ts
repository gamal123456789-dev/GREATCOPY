import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Authentication and authorization - SECURITY FIX: Removed test admin bypass
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true }
    });
    
    if (!adminUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Security logging for admin actions
    console.log(`[SECURITY] Admin access: User ${adminUser.id} accessing deleted price changes at ${new Date().toISOString()}`);

    if (req.method === 'GET') {
      try {
        const deletedPriceChanges = await prisma.deletedPriceChange.findMany({
          orderBy: {
            deletedAt: 'desc'
          }
        });

        return res.status(200).json(deletedPriceChanges);
      } catch (error) {
        console.error('Error fetching deleted price changes:', error);
        return res.status(500).json({ 
          error: 'Failed to fetch deleted price changes',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}