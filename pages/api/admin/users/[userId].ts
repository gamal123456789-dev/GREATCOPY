import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (adminUser.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { userId } = req.query;

  if (typeof userId !== 'string') {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { role } = req.body;

      // Validate role
      if (!role || (role !== 'user' && role !== 'ADMIN')) {
        return res.status(400).json({ message: 'Invalid role. Must be "user" or "ADMIN"' });
      }

      // Security logging for admin actions
      console.log(`[SECURITY] Admin ${adminUser.id} updating user ${userId} role to ${role} at ${new Date().toISOString()}`);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent admin from demoting themselves
      if (userId === adminUser.id && role !== 'ADMIN') {
        return res.status(400).json({ message: 'Cannot demote yourself from admin role' });
      }

      // Update user role
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role }
      });

      res.status(200).json({
        message: 'User role updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Error updating user role', error: (error as any).message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}