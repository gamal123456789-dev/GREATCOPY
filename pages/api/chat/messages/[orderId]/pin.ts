import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import prisma from '../../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;

  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ message: 'You need to be logged in' });
  }

  try {
    // Verify that the user owns this order or is an admin
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { User: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isOwner = order.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.method === 'GET') {
      // Get pinned messages for the order
      const pinnedMessages = await prisma.chatMessage.findMany({
        where: {
          orderId,
          isPinned: true
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Format messages for client
      const formattedMessages = pinnedMessages.map(msg => ({
        id: msg.id,
        orderId: msg.orderId,
        senderId: msg.userId,
        senderName: msg.User?.username || msg.User?.name || 'Unknown',
        senderRole: msg.User?.role,
        message: msg.message,
        messageType: msg.messageType,
        isSystem: msg.isSystem,
        isPinned: msg.isPinned,
        timestamp: msg.createdAt.toISOString()
      }));

      return res.status(200).json({ 
        success: true, 
        pinnedMessages: formattedMessages 
      });
    }

    if (req.method === 'POST') {
      const { messageId, isPinned } = req.body;

      if (!messageId || typeof isPinned !== 'boolean') {
        return res.status(400).json({ message: 'Message ID and pin status are required' });
      }

      // Verify the message belongs to this order
      const message = await prisma.chatMessage.findFirst({
        where: {
          id: messageId,
          orderId
        }
      });

      if (!message) {
        return res.status(404).json({ message: 'Message not found in this order' });
      }

      // Update pin status
      const updatedMessage = await prisma.chatMessage.update({
        where: { id: messageId },
        data: { isPinned },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true
            }
          }
        }
      });

      // Format updated message
      const formattedMessage = {
        id: updatedMessage.id,
        orderId: updatedMessage.orderId,
        senderId: updatedMessage.userId,
        senderName: updatedMessage.User?.username || updatedMessage.User?.name || 'Unknown',
        senderRole: updatedMessage.User?.role,
        message: updatedMessage.message,
        messageType: updatedMessage.messageType,
        isSystem: updatedMessage.isSystem,
        isPinned: updatedMessage.isPinned,
        timestamp: updatedMessage.createdAt.toISOString()
      };

      return res.status(200).json({ 
        success: true, 
        message: formattedMessage 
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling pinned messages:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: (error as any).message 
    });
  }
}