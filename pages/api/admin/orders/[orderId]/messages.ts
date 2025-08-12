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

  if (req.method === 'GET') {
    try {
      // Fetch chat messages for the specified order
      const messages = await prisma.chatMessage.findMany({
        where: { orderId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              role: true,
              accounts: {
                select: {
                  provider: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Enhance data to include appropriate display name
      const enhancedMessages = messages.map(message => {
        let displayName = 'Unknown';
        
        if (message.User) {
          // Determine display name
          if (message.User.username) {
            displayName = message.User.username;
          } else if (message.User.name && message.User.accounts.some(acc => acc.provider === 'discord')) {
            displayName = message.User.name; // Discord username
          } else if (message.User.email) {
            displayName = message.User.email.split('@')[0];
          }
        }

        return {
          id: message.id,
          content: message.message,
          createdAt: message.createdAt,
          isSystem: message.isSystem,
          user: message.User ? {
            id: message.User.id,
            displayName,
            role: message.User.role
          } : null
        };
      });

      res.status(200).json(enhancedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Error fetching messages', error: (error as any).message });
    }
  } else if (req.method === 'POST') {
    try {
      const { content, isSystem = false } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: 'Message content is required' });
      }

      // Check if order exists
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Create new message
      const { v4: uuidv4 } = require('uuid');
      const newMessage = await prisma.chatMessage.create({
        data: {
          id: uuidv4(),
          message: content,
          orderId,
          userId: session.user.id,
          isSystem
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              role: true,
              accounts: {
                select: {
                  provider: true
                }
              }
            }
          }
        }
      });

      // Enhance data to include appropriate display name
      let displayName = 'Unknown';
      if (newMessage.User) {
        if (newMessage.User.username) {
          displayName = newMessage.User.username;
        } else if (newMessage.User.name && newMessage.User.accounts.some(acc => acc.provider === 'discord')) {
          displayName = newMessage.User.name;
        } else if (newMessage.User.email) {
          displayName = newMessage.User.email.split('@')[0];
        }
      }

      const enhancedMessage = {
        id: newMessage.id,
        content: newMessage.message,
        createdAt: newMessage.createdAt,
        isSystem: newMessage.isSystem,
        user: newMessage.User ? {
          id: newMessage.User.id,
          displayName,
          role: newMessage.User.role
        } : null
      };

      res.status(201).json(enhancedMessage);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: 'Error creating message', error: (error as any).message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}