import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;
  
  if (typeof orderId !== 'string') {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Check if user owns this order or is admin
      const isOwner = order.userId === session.user.id;
      const isAdmin = session.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.status(200).json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  } else if (req.method === 'PUT') {
    try {
      // Check if user is admin for order status updates
      if (session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { status, price, service } = req.body;
      
      if (!status && !price && !service) {
        return res.status(400).json({ error: 'At least one field (status, price, service) is required' });
      }

      // Get current order to check if status changed
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, userId: true }
      });

      if (!currentOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Prepare update data
      const updateData: any = {};
      if (status) updateData.status = status;
      if (price) updateData.price = parseFloat(price);
      if (service) updateData.service = service;

      // Update the order
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
      });

      // Send real-time update via Socket.IO for status changes
      if (status && status !== currentOrder.status) {
        try {
          const io = require('socket.io-client');
          const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'https://gear-score.com');
          
          socket.emit('orderStatusUpdate', {
            orderId: orderId,
            status: status,
            userId: currentOrder.userId
          });

          socket.disconnect();
        } catch (socketError) {
          console.error('Error sending socket update:', socketError);
        }
      }

      res.status(200).json(updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: 'Failed to update order' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}