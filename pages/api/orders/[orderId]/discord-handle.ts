import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';


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
      // Get Discord handle for the order
      const discordHandle = await prisma.orderDiscordHandle.findUnique({
        where: { orderId }
      });

      return res.status(200).json({ 
        discordHandle: discordHandle?.discordHandle || null 
      });
    }

    if (req.method === 'POST') {
      const { discordHandle } = req.body;

      if (!discordHandle || typeof discordHandle !== 'string') {
        return res.status(400).json({ message: 'Discord handle is required' });
      }

      // Validate Discord handle format (basic validation)
      if (discordHandle.length > 64) {
        return res.status(400).json({ message: 'Discord handle too long' });
      }

      // Save or update Discord handle
      await prisma.orderDiscordHandle.upsert({
        where: { orderId },
        update: { discordHandle },
        create: {
          id: uuidv4(),
          orderId,
          discordHandle,
          userId: session.user.id,
          updatedAt: new Date()
        }
      });

      // Send a system message to the chat with the Discord handle
      const systemMessage = await prisma.chatMessage.create({
        data: {
          id: uuidv4(),
          orderId,
          message: `🎮 Discord Handle Updated: ${discordHandle}`,
          userId: session.user.id,
          isSystem: true
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              role: true
            }
          }
        }
      });

      // Format the message for real-time broadcast
      const formattedMessage = {
        id: systemMessage.id,
        content: systemMessage.message,
        createdAt: systemMessage.createdAt,
        isSystem: systemMessage.isSystem,
        user: systemMessage.User ? {
          id: systemMessage.User.id,
          displayName: systemMessage.User.username || systemMessage.User.name || systemMessage.User.email?.split('@')[0] || 'Unknown',
          role: systemMessage.User.role
        } : null
      };

      // Note: Real-time broadcasting removed - system message saved to database

      return res.status(200).json({ 
        message: 'Discord handle saved successfully',
        discordHandle 
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling Discord handle:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: (error as any).message 
    });
  }
}