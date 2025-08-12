/**
 * API endpoint for fetching chat messages for a specific order
 * Used for manual message refresh when socket connection fails
 * BACKEND FOCUS: Secure message retrieval with proper authentication
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Authentication and authorization - SECURITY FIX: Removed test admin bypass
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      console.log('❌ Unauthorized access attempt to messages API');
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, name: true, email: true }
    });
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Security logging for chat access
    console.log(`[SECURITY] Chat access: User ${user.id} accessing messages for order ${req.query.orderId} at ${new Date().toISOString()}`);

    const { orderId } = req.query;
    const userId = user.id;
    const userRole = user.role;

    console.log(`📨 Fetching messages for order: ${orderId}`);
    console.log(`👤 User: ${userId} (${userRole})`);

    // Validate order ID
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid order ID is required' 
      });
    }

    // Check if order exists and user has access
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { User: true }
    });

    if (!order) {
      console.log(`❌ Order ${orderId} not found`);
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    // Check authorization
    const isAdmin = userRole === 'ADMIN';
    const isOwner = order.userId === userId;

    if (!isAdmin && !isOwner) {
      console.log(`❌ User ${userId} not authorized for order ${orderId}`);
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to access this order' 
      });
    }

    console.log('✅ Authorization passed, fetching messages');

    // Fetch messages for the order
    const messages = await prisma.chatMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: {
        User: {
          select: { id: true, name: true, role: true, username: true }
        }
      }
    });

    // Format messages for frontend
    const formattedMessages = messages.map(msg => {
      let senderName = 'Unknown';
      if (msg.User) {
        senderName = msg.User.username || msg.User.name || 'Unknown';
      }
      
      return {
        id: msg.id,
        orderId: msg.orderId,
        senderId: msg.userId,
        senderName: senderName,
        senderRole: msg.User?.role || 'user',
        message: msg.message,
        messageType: msg.messageType || 'text',
        imageUrl: msg.imageUrl, // Add missing image field
        isSystem: msg.isSystem || false,
        isDelivered: msg.isDelivered || false,
        isRead: msg.isRead || false,
        timestamp: msg.createdAt
      };
    });

    console.log(`✅ Successfully fetched ${formattedMessages.length} messages`);

    return res.status(200).json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length
    });

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}