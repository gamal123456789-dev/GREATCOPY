import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import prisma from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;

  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  // Check admin permissions
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ message: 'You need to be logged in' });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.method === 'POST') {
    try {
      // Fetch order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              accounts: {
                select: {
                  provider: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Determine customer display name
      let customerDisplayName = 'Unknown Customer';
      if (order.User) {
        if (order.User.username) {
          customerDisplayName = order.User.username;
        } else if (order.User.name && order.User.accounts.some(acc => acc.provider === 'discord')) {
          customerDisplayName = order.User.name; // Discord username
        } else if (order.User.email) {
          customerDisplayName = order.User.email.split('@')[0];
        }
      }

      // Check for existing messages
      const existingMessages = await prisma.chatMessage.findMany({
        where: { orderId },
        take: 1
      });

      // If no previous messages exist, create an automatic message with order details
      if (existingMessages.length === 0) {
        const orderDetailsMessage = `🎮 Boost Order Chat Started\n\n` +
      `📋 Order Details:\n` +
      `• Order ID: ${order.id}\n` +
      `• Customer: ${customerDisplayName}\n` +
      `• Game: ${order.game}\n` +
      `• Service: ${order.service}\n` +
      `• Status: ${order.status}\n` +
      `• Order Date: ${new Date(order.date).toLocaleDateString('en-US')}\n\n` +
          `🔗 Order ID: ${order.id}`;

        const { v4: uuidv4 } = require('uuid');
        await prisma.chatMessage.create({
          data: {
            id: uuidv4(),
            message: orderDetailsMessage,
            orderId,
            userId: session.user.id,
            isSystem: true
          }
        });
      }

      res.status(200).json({ message: 'Chat initialized successfully' });
    } catch (error) {
      console.error('Error initializing chat:', error);
      res.status(500).json({ message: 'Error initializing chat', error: (error as any).message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}