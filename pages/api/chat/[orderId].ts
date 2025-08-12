import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import multer from 'multer';
import { emitNewMessage } from '../../../lib/socket-bridge';
import { v4 as uuidv4 } from 'uuid';
import FormData from 'form-data';
import { Readable } from 'stream';
import axios from 'axios';

// Import socket bridge functions for real-time messaging

// Configure multer for file upload with size limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1073741824,  // 1GB file size limit
    files: 10,             // Allow up to 10 files
    fields: 20,            // Allow up to 20 form fields
    fieldSize: 1073741824, // 1GB field size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept any file type
    cb(null, true);
  },
});

// Helper function to run multer
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Simple in-memory cache to prevent duplicate requests
const messageCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds cache

// Helper function to get cached data
function getCachedMessages(orderId: string, userId: string) {
  const cacheKey = `${orderId}-${userId}`;
  const cached = messageCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  return null;
}

// Helper function to set cached data
function setCachedMessages(orderId: string, userId: string, data: any) {
  const cacheKey = `${orderId}-${userId}`;
  messageCache.set(cacheKey, { data, timestamp: Date.now() });
  
  // Clean up old cache entries
  setTimeout(() => {
    messageCache.delete(cacheKey);
  }, CACHE_DURATION);
}

// Helper function to invalidate cache for an order
function invalidateOrderCache(orderId: string) {
  // Remove all cache entries for this order
  for (const [key] of messageCache) {
    if (key.startsWith(`${orderId}-`)) {
      messageCache.delete(key);
    }
  }
}

export const config = {
  api: {
    bodyParser: false,        // Disable default body parser to handle multipart/form-data
    sizeLimit: false,         // No size limit
    responseLimit: false,     // No response limit
    externalResolver: true,   // Handle large file processing
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  // console.log('Chat API - Session check:', {
  //   hasSession: !!session,
  //   userId: session?.user?.id,
  //   userEmail: session?.user?.email,
  //   userRole: session?.user?.role,
  //   method: req.method,
  //   orderId: req.query.orderId
  // });
  
  if (!session) {
    // console.log('Chat API - No session found, returning 401');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!session.user?.id) {
    // console.log('Chat API - Session exists but no user ID, returning 401');
    return res.status(401).json({ error: 'User ID not found in session' });
  }

  const { orderId } = req.query;
  
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  try {
    // Verify that the user owns this order or is an admin
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { User: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const isOwner = order.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.method === 'GET') {
      // Check cache first to prevent duplicate database queries
      const cachedMessages = getCachedMessages(orderId, session.user.id);
      if (cachedMessages) {
        return res.status(200).json(cachedMessages);
      }

      // Get chat messages for the order
      const messages = await prisma.chatMessage.findMany({
        where: { orderId },
        include: {
          User: {
            select: {
              name: true,
              username: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      const responseData = { messages };
      
      // Cache the response to prevent duplicate queries
      setCachedMessages(orderId, session.user.id, responseData);
      
      return res.status(200).json(responseData);
    }

    if (req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      
      let message = '';
      let messageType = 'text';
      let imageUrl = null;
      
      if (contentType.includes('multipart/form-data')) {
        // Handle image upload
        try {
          await runMiddleware(req, res, upload.single('image'));
          const file = (req as any).file;
          const body = (req as any).body;
          
          if (file) {
            // Upload image using the upload-image API logic with proper FormData handling
            const formData = new FormData();
            formData.append('image', file.buffer, {
              filename: file.originalname,
              contentType: file.mimetype
            });
            
            try {
              const response = await axios.post(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/upload-image`, formData, {
                headers: formData.getHeaders()
              });
              
              const uploadResult = response.data;
              imageUrl = uploadResult.imageUrl;
              messageType = 'image';
              message = body.message || 'Image';
            } catch (uploadError) {
              console.error('Image upload failed:', uploadError);
              return res.status(500).json({ error: 'Failed to upload image' });
            }
          } else {
            message = body.message || '';
            messageType = body.messageType || 'text';
          }
        } catch (error) {
          console.error('Multer error:', error);
          return res.status(400).json({ error: 'Failed to process upload' });
        }
      } else if (contentType.includes('application/json')) {
        // Handle text message
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        await new Promise((resolve) => req.on('end', resolve));
        
        const bodyData = Buffer.concat(chunks).toString();
        const body = JSON.parse(bodyData);
        message = body.message || '';
        messageType = body.messageType || 'text';
      } else {
        return res.status(400).json({ error: 'Unsupported content type' });
      }

      if (!message.trim() && !imageUrl) {
        return res.status(400).json({ error: 'Message or image is required' });
      }

      try {
        const newMessage = await prisma.chatMessage.create({
          data: {
            id: uuidv4(),
            orderId,
            userId: session.user.id,
            message: message || '',
            messageType,
            imageUrl
          },
          include: {
            User: {
              select: {
                name: true,
                username: true,
                email: true,
                role: true
              }
            }
          }
        });

        // Invalidate cache for this order to ensure fresh data
        invalidateOrderCache(orderId);

        // Get order data for serviceName
        const orderData = await prisma.order.findUnique({
          where: { id: orderId },
          select: { service: true, game: true }
        });

        // Emit real-time message to connected clients
        try {
          await emitNewMessage({
            id: newMessage.id,
            orderId: newMessage.orderId,
            senderId: newMessage.userId,
            senderName: newMessage.User?.name || newMessage.User?.username || 'Unknown',
            senderRole: newMessage.User?.role,
            message: newMessage.message,
            messageType: newMessage.messageType,
            imageUrl: newMessage.imageUrl,
            serviceName: orderData?.service || orderData?.game,
            isSystem: false,
            timestamp: newMessage.createdAt
          });
          console.log('✅ Real-time message emitted successfully');
        } catch (socketError) {
          console.error('❌ Failed to emit real-time message:', socketError);
          // Don't fail the request if socket emission fails
        }
        
        return res.status(201).json(newMessage);
      } catch (error) {
        console.error('Message creation error:', error);
        return res.status(500).json({ error: 'Failed to create message' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific Prisma connection errors
    if ((error as any).message && (error as any).message.includes('Engine is not yet connected')) {
      console.log('Prisma connection issue, attempting to reconnect...');
      try {
        await prisma.$connect();
        return res.status(503).json({ 
          error: 'Database connection issue. Please try again in a moment.' 
        });
      } catch (reconnectError) {
        console.error('Failed to reconnect to database:', reconnectError);
        return res.status(503).json({ 
          error: 'Database temporarily unavailable. Please try again later.' 
        });
      }
    }
    
    // Handle authentication errors more specifically
    if ((error as any).message && (error as any).message.includes('Unauthorized')) {
      return res.status(401).json({ 
        error: 'Authentication failed. Please refresh the page and try again.' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error. Please try again.' 
    });
  }
  // Note: Removed prisma.$disconnect() from finally block to prevent connection issues
}