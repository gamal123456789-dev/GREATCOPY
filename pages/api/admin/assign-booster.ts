import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication and admin role
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { orderId, boosterId } = req.body;

    if (!orderId || !boosterId) {
      return res.status(400).json({ message: 'Order ID and Booster ID are required' });
    }

    // Verify that the order exists and is not cancelled
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        User: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot assign booster to cancelled order' });
    }

    if (order.boosterId) {
      return res.status(400).json({ message: 'Order already has a booster assigned' });
    }

    // Verify that the booster exists and has appropriate role
    const booster = await prisma.user.findUnique({
      where: { id: boosterId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!booster) {
      return res.status(404).json({ message: 'Booster not found' });
    }

    if (booster.role !== 'ADMIN' && booster.role !== 'BOOSTER') {
      return res.status(400).json({ message: 'User does not have booster privileges' });
    }

    // Assign the booster to the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        boosterId: boosterId,
        boosterName: booster.name || booster.email?.split('@')[0] || 'Unknown',
        status: 'in_progress' // Update status when booster is assigned
      },
      include: {
        User: {
          select: {
            name: true,
            email: true
          }
        },
        Booster: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Log the assignment
    console.log(`Booster ${booster.name || booster.email} assigned to order ${orderId}`);

    // Send notification to customer (optional)
    try {
      // You can add notification logic here if needed
      // For example, send email or push notification to customer
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the assignment if notification fails
    }

    res.status(200).json({ 
      message: 'Booster assigned successfully',
      order: updatedOrder,
      booster: {
        id: booster.id,
        name: booster.name,
        email: booster.email
      }
    });
  } catch (error) {
    console.error('Error assigning booster:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}