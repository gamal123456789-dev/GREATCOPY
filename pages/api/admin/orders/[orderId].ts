import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';
import { emitOrderStatusUpdate, emitNewMessage } from '../../../../lib/socket-bridge';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;

  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  // Authentication and authorization - SECURITY FIX: Removed test admin bypass
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Security logging for admin actions
  console.log(`[SECURITY] Admin action: User ${session.user.id} updating order ${orderId} at ${new Date().toISOString()}`);
  
  const adminUserId = session.user.id;

  if (req.method === 'PUT') {
    try {
      const { status, price, service, notes } = req.body;

      // Check for at least one field to update
      if (!status && !price && !service && notes === undefined) {
        return res.status(400).json({ message: 'At least one field (status, price, service, notes) is required' });
      }

      // Validate status if provided
      if (status) {
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: 'Invalid status value' });
        }
      }

      // Validate price if provided
      if (price !== undefined) {
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
          return res.status(400).json({ message: 'Price must be a positive number' });
        }
      }

      // Fetch current order to check previous status
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, price: true, service: true, notes: true }
      });

      if (!currentOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const previousStatus = currentOrder.status;

      // Prepare update data
      const updateData: any = {};
      if (status) updateData.status = status;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (service) updateData.service = service;
      if (notes !== undefined) updateData.notes = notes;

      // Update order
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              accounts: {
                where: {
                  provider: 'discord'
                },
                select: {
                  providerAccountId: true
                }
              }
            }
          }
        }
      });

      // Enhance order data for admin display
      let displayName = updatedOrder.customerName;
      if (updatedOrder.User.username) {
        displayName = updatedOrder.User.username;
      } else if (updatedOrder.User.name && updatedOrder.User.accounts.length > 0) {
        displayName = updatedOrder.User.name;
      } else if (updatedOrder.User.email) {
        displayName = updatedOrder.User.email.split('@')[0];
      }

      const enhancedOrder = {
        id: updatedOrder.id,
        customerName: displayName,
        game: updatedOrder.game,
        service: updatedOrder.service,
        status: updatedOrder.status,
        price: updatedOrder.price,
        notes: updatedOrder.notes,
        date: updatedOrder.date.toISOString(),
        userId: updatedOrder.userId,
        user: {
          id: updatedOrder.User.id,
          name: updatedOrder.User.name,
          email: updatedOrder.User.email,
          username: updatedOrder.User.username,
          displayName
        }
      };



      // Send Socket.IO notification for real-time update only if status changed
      console.log(`🔍 Status change check: status=${status}, previousStatus=${previousStatus}`);
      if (status && status !== previousStatus) {
        console.log('✅ Status changed, calling emitOrderStatusUpdate...');
        emitOrderStatusUpdate({
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          customerName: displayName,
          game: updatedOrder.game,
          service: updatedOrder.service,
          serviceName: updatedOrder.service || updatedOrder.game,
          userId: updatedOrder.userId,
          order: enhancedOrder
        });
      } else {
        console.log('❌ Status not changed, skipping Socket.IO emission');
      }

      // Automatic messages on order status change have been removed

      // Notification to order owner has already been sent in emitOrderStatusUpdate above

      res.status(200).json(updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ message: 'Error updating order', error: (error as any).message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}