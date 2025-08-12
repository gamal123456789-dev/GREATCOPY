// Load environment variables from .env file
require('dotenv').config();

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { setSocketIO } = require('./lib/socket-cjs');
const jwt = require('jsonwebtoken');
const { messageLimiter } = require('./lib/rateLimiter.js');
const { globalErrorHandler, socketErrorHandler, databaseErrorHandler } = require('./middleware/errorMiddleware');
const { logError } = require('./lib/errorHandler');

// Performance and security middleware
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const prisma = new PrismaClient();

const dev = process.env.NODE_ENV !== 'production';
const LOG_VERBOSE = process.env.LOG_VERBOSE === 'true';
const hostname = '0.0.0.0'; // Changed from 'localhost' to '0.0.0.0' to allow network access
const port = process.env.PORT || 3000; // Updated to use port 3000

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      req.setMaxListeners(0);
      
      // Performance and Security Headers
      res.setHeader('X-DNS-Prefetch-Control', 'on');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

      // Cache-Control: avoid caching during development to prevent HMR reload loops
      if (dev) {
        // Never cache anything in dev, especially Next.js assets and hot updates
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
      } else {
        // Production caching for static assets
        if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (req.url.match(/\.(html|json)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
        }
      }
      
      
      
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      // Use new error handling system
      const context = {
        url: req.url,
        method: req.method,
        userAgent: req.headers?.['user-agent'],
        ip: req.connection?.remoteAddress
      };
      
      logError(err, context);
      
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        message: 'A server error occurred. Please try again later.',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Socket.IO setup - attach to the same HTTP server with performance optimizations
  const io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.NEXTAUTH_URL || `https://gear-score.com`,
    `https://gear-score.com`, // Production domain
        `http://gear-score.com`,
        `https://gear-score.com`,
        `http://localhost:${port}`, // Local development
        `https://localhost:${port}`, // Local development with HTTPS
        `http://127.0.0.1:${port}`, // Local IP
        `https://127.0.0.1:${port}`, // Local IP with HTTPS
        `http://62.169.19.154:${port}`, // VPS IP address
        `https://62.169.19.154:${port}`, // VPS IP address with HTTPS
        `http://62.169.19.154:5200`, // VPS legacy port
        `https://62.169.19.154:5200`, // VPS legacy port with HTTPS
        process.env.NEXT_PUBLIC_BASE_URL // Production domain if set
      ].filter(Boolean), // Remove any undefined values
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Range']
    },
    allowEIO3: true,
    transports: ['websocket', 'polling'], // Prioritize websocket for better performance
    path: '/socket.io/',
    pingTimeout: 30000, // Reduced from 60000 for faster detection
    pingInterval: 15000, // Reduced from 25000 for more responsive connection
    // Performance optimizations
    compression: true,
    httpCompression: true,
    perMessageDeflate: {
      threshold: 1024,
      concurrencyLimit: 10,
      memLevel: 7
    },
    maxHttpBufferSize: 1e6, // 1MB limit
    connectTimeout: 20000 // 20 seconds connection timeout
  });
  
  console.log('🔧 Socket.IO server initialized on path /socket.io/');
  
  // Set Socket.IO instance for API routes
  setSocketIO(io);

  // Authentication middleware - Allow both authenticated and unauthenticated connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      
      // If no token provided, allow unauthenticated connection for general notifications
      if (!token) {
        if (LOG_VERBOSE) {
          console.log(`[INFO] Unauthenticated socket connection from ${socket.handshake.address} at ${new Date().toISOString()}`);
        }
        socket.data.isAuthenticated = false;
        socket.data.userId = null;
        socket.data.userRole = 'GUEST';
        return next();
      }

      // If token provided, verify it
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
        
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.sub },
          select: { id: true, role: true, email: true, username: true }
        });
        
        if (!user) {
          console.log(`[SECURITY] Socket connection: User not found for token from ${socket.handshake.address} at ${new Date().toISOString()}`);
          // Allow connection but mark as unauthenticated
          socket.data.isAuthenticated = false;
          socket.data.userId = null;
          socket.data.userRole = 'GUEST';
          return next();
        }
        
        socket.data.isAuthenticated = true;
        socket.data.userId = user.id;
        socket.data.userRole = user.role;
        socket.data.userEmail = user.email;
        socket.data.username = user.username;
        
        // Security logging for successful socket authentication
        console.log(`[SECURITY] Socket authenticated: User ${user.id} connected from ${socket.handshake.address} at ${new Date().toISOString()}`);
        
        next();
      } catch (tokenError) {
        console.log(`[SECURITY] Invalid token from ${socket.handshake.address}: ${tokenError.message}`);
        // Allow connection but mark as unauthenticated
        socket.data.isAuthenticated = false;
        socket.data.userId = null;
        socket.data.userRole = 'GUEST';
        next();
      }
    } catch (error) {
      console.error(`[SECURITY] Socket authentication error from ${socket.handshake.address}:`, error);
      // Allow connection but mark as unauthenticated
      socket.data.isAuthenticated = false;
      socket.data.userId = null;
      socket.data.userRole = 'GUEST';
      next();
    }
  });

  // Socket.IO connection handler
  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    const userRole = socket.data.userRole;
    const isAuthenticated = socket.data.isAuthenticated;
    
    // Add error handling for Socket
    socketErrorHandler(socket);
    
    try {
      if (isAuthenticated) {
        if (LOG_VERBOSE) {
          console.log(`✅ Authenticated user connected: ${userId} (${userRole})`);
        }
        
        // User joins their personal room
        await socket.join(`user:${userId}`);
        
        // If admin, join admin room
        if (userRole && userRole.toUpperCase() === 'ADMIN') {
          await socket.join('admin');
          console.log(`👑 Admin joined admin room: ${userId}`);
        }
      } else {
        if (LOG_VERBOSE) {
          console.log(`✅ Unauthenticated user connected for general notifications`);
        }
        // Join a general notifications room for unauthenticated users
        await socket.join('general-notifications');
      }
    } catch (error) {
      logError(error, {
        socketId: socket.id,
        userId,
        userRole,
        type: 'socket_connection_error'
      });
      
      socket.emit('error_message', {
        message: 'A connection error occurred. Please reload the page.',
        type: 'connection_error'
      });
    }
    
    // Join specific order room
    socket.on('join-order-room', async (orderId) => {
      try {
        // Check if user is authenticated
        if (!isAuthenticated) {
          console.log(`❌ Unauthenticated user attempted to join order room: ${orderId}`);
          socket.emit('error', { message: 'Authentication required to join order room' });
          return;
        }
        
        console.log(`👤 User ${userId} joining order room: ${orderId}`);
        console.log(`🔍 Socket ID: ${socket.id}`);
        console.log(`👑 Is Admin: ${userRole && userRole.toUpperCase() === 'ADMIN'}`);
        
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { userId: true }
        });
        
        if (!order) {
          console.log(`❌ Order ${orderId} not found`);
          socket.emit('error', { message: 'Order not found' });
          return;
        }
        
        console.log(`📦 Order found: ${orderId}, Owner: ${order.userId}`);
        console.log(`🔐 Authorization check - Admin: ${userRole && userRole.toUpperCase() === 'ADMIN'}, Owner: ${order.userId === userId}`);
        
        if ((userRole && userRole.toUpperCase() === 'ADMIN') || order.userId === userId) {
          await socket.join(`order:${orderId}`);
          console.log(`✅ User ${userId} joined order room: ${orderId}`);
          console.log(`🏠 Current rooms for socket ${socket.id}:`, Array.from(socket.rooms));
          
          // Send previous messages with user data
          const messages = await prisma.chatMessage.findMany({
            where: { orderId },
            include: {
              User: {
                select: {
                  username: true,
                  name: true,
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
            orderBy: { createdAt: 'asc' },
            take: 50
          });
          
          // Process messages to add senderName
          const enhancedMessages = messages.map(msg => {
            let senderName = '';
            if (msg.User) {
              // Display username from database only: username > name (Discord) > email prefix
              if (msg.User.username && msg.User.username.trim()) {
                senderName = msg.User.username.trim();
              } else if (msg.User.name && msg.User.name.trim() && msg.User.accounts.some(acc => acc.provider === 'discord')) {
                senderName = msg.User.name.trim(); // Discord name
              } else if (msg.User.email) {
                const emailPrefix = msg.User.email.split('@')[0];
                senderName = emailPrefix || '';
              }
            }
            
            return {
              id: msg.id,
              orderId: msg.orderId,
              senderId: msg.userId,
              message: msg.message,
              messageType: msg.messageType,
              isSystem: msg.isSystem,
              timestamp: msg.createdAt || new Date().toISOString(),
              senderRole: msg.User?.role || 'customer',
              senderName: senderName
            };
          });
          
          socket.emit('previous-messages', enhancedMessages);
        } else {
          socket.emit('error', { message: 'Access denied to this order' });
        }
      } catch (error) {
        console.error('Error joining order room:', error);
        socket.emit('error', { message: 'Failed to join order room' });
      }
    });
    
    // Send message
    socket.on('send-message', async (data) => {
      try {
        // Check if user is authenticated
        if (!isAuthenticated) {
          console.log(`❌ Unauthenticated user attempted to send message`);
          socket.emit('error', { message: 'Authentication required to send messages' });
          return;
        }
        
        const { orderId, message, messageType = 'text' } = data;
        
        console.log(`📤 Received send-message request:`);
        console.log(`📤 Order ID: ${orderId}`);
        console.log(`📤 Message: ${message}`);
        console.log(`📤 Message Type: ${messageType}`);
        console.log(`📤 Sender ID: ${userId}`);
        console.log(`📤 Sender Role: ${userRole}`);
        
        // Security: Rate limiting for messages
        if (!messageLimiter.isAllowed(userId)) {
          console.log(`[SECURITY] Message rate limit exceeded for user ${userId} at ${new Date().toISOString()}`);
          socket.emit('error', { message: 'Too many messages. Please slow down.' });
          return;
        }
        
        if (!orderId || !message) {
          console.log('❌ Missing order ID or message');
          socket.emit('error', { message: 'Order ID and message are required' });
          return;
        }
        
        if (message.length > 1000) {
          socket.emit('error', { message: 'Message too long (max 1000 characters)' });
          return;
        }
        
        // Security: Sanitize message content
        const sanitizedMessage = message.trim().replace(/<script[^>]*>.*?<\/script>/gi, '').substring(0, 1000);
        
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { userId: true }
        });
        
        if (!order) {
          console.log(`❌ Order ${orderId} not found`);
          socket.emit('error', { message: 'Order not found' });
          return;
        }
        
        console.log(`📦 Order found: ${orderId}, Owner: ${order.userId}`);
        
        if (!(userRole && userRole.toUpperCase() === 'ADMIN') && order.userId !== userId) {
          console.log(`❌ User ${userId} not authorized for order ${orderId}`);
          socket.emit('error', { message: 'Access denied to this order' });
          return;
        }
        
        console.log('✅ Authorization passed');
        
        // Fetch user data to determine sender name
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { 
            username: true,
            name: true,
            email: true,
            accounts: {
              select: {
                provider: true
              }
            }
          }
        });
        
        console.log(`👤 Sender info: ${user?.username || user?.name || user?.email} (${userRole})`);
        
        // Determine sender name based on available data
        let senderName = '';
        if (user) {
          // Display username from database only: username > name (Discord) > email prefix
          if (user.username && user.username.trim()) {
            senderName = user.username.trim();
          } else if (user.name && user.name.trim() && user.accounts && user.accounts.some(acc => acc.provider === 'discord')) {
            senderName = user.name.trim(); // Discord name
          } else if (user.email) {
            const emailPrefix = user.email.split('@')[0];
            senderName = emailPrefix || '';
          }
        }
        
        // Save message
        const { v4: uuidv4 } = require('uuid');
        const chatMessage = await prisma.chatMessage.create({
          data: {
            id: uuidv4(),
            orderId,
            userId: userId,
            message: sanitizedMessage,
            messageType,
            isSystem: false
          }
        });
        
        console.log(`💾 Message saved to database with ID: ${chatMessage.id}`);
        
        // Format message for sending
        const messageData = {
          id: chatMessage.id,
          orderId: chatMessage.orderId,
          senderId: chatMessage.userId,
          message: sanitizedMessage,
          messageType: chatMessage.messageType,
          isSystem: chatMessage.isSystem,
          timestamp: chatMessage.createdAt.toISOString(),
          senderRole: userRole,
          senderName: senderName
        };
        
        // Send message to room
        const roomName = `order:${orderId}`;
        console.log(`📡 Broadcasting message to room: ${roomName}`);
        console.log(`📡 Room members:`, io.sockets.adapter.rooms.get(roomName));
        
        // Broadcast to order room with immediate delivery
        io.to(roomName).emit('new-message', messageData);
        console.log(`📨 Message sent to order room: ${roomName}`);
        
        // Also send directly to customer if admin is sending
        if (userRole === 'ADMIN') {
          const customerRoom = `user:${order.userId}`;
          console.log(`📢 Sending direct message to customer room: ${customerRoom}`);
          io.to(customerRoom).emit('new-message', messageData);
          console.log(`📨 Direct message sent to customer: ${customerRoom}`);
        }
        
        // Send to admin room if customer is sending
        if (userRole !== 'ADMIN') {
          io.to('admin').emit('new-message', messageData);
          console.log(`📨 Message sent to admin room`);
        }
        
        // Send notifications
        if (userRole !== 'ADMIN') {
          io.to('admin').emit('new-notification', {
            type: 'new-message',
            orderId,
            message: `New message in order ${orderId}`,
            timestamp: new Date()
          });
          console.log('📢 Admin notification sent for customer message');
        }
        
        if (userRole === 'ADMIN') {
          const customerRoom = `user:${order.userId}`;
          console.log(`📢 Sending customer notification to room: ${customerRoom}`);
          io.to(customerRoom).emit('new-notification', {
            type: 'admin-reply',
            orderId,
            message: `New support reply for order ${orderId}`,
            timestamp: new Date()
          });
          console.log(`📢 Customer notification sent to ${customerRoom}`);
        }
        
        console.log(`💬 Message sent in order ${orderId} by ${userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Mark messages as read
    socket.on('mark-messages-read', async (data) => {
      try {
        const { orderId } = data;
        
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { userId: true }
        });
        
        if (!order) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }
        
        if (userRole !== 'ADMIN' && order.userId !== userId) {
          socket.emit('error', { message: 'Access denied to this order' });
          return;
        }
        
        // Update messages to mark as read (messages not sent by current user)
        await prisma.chatMessage.updateMany({
          where: {
            orderId: orderId,
            userId: { not: userId },
            isRead: false
          },
          data: {
            isRead: true
          }
        });
        
        console.log(`📖 Messages marked as read in order ${orderId} by user ${userId}`);
        
        // Send confirmation to client
        socket.emit('messages-marked-read', { orderId });
        
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // Handle unread count updates
    socket.on('unreadCountUpdate', async (data) => {
      try {
        const { orderId, count } = data;
        
        // Broadcast unread count update to admin users
        socket.to('admin').emit('unreadCountUpdate', { orderId, count });
        
        console.log(`📊 Unread count updated for order ${orderId}: ${count}`);
      } catch (error) {
        console.error('Error handling unread count update:', error);
      }
    });

    // Leave order room
    socket.on('leave-order-room', async (orderId) => {
      await socket.leave(`order:${orderId}`);
      console.log(`📋 User ${userId} left order room: ${orderId}`);
    });
    
    // Handle ping for connection check
    socket.on('ping', () => {
      console.log(`🏓 Ping received from user: ${userId}`);
      socket.emit('pong');
    });
    
    // Add new events
    socket.on('order-status-update', (data) => {
      const roomName = `order:${data.orderId}`;
      io.to(roomName).emit('order-status-updated', data);
      console.log(`📊 Status update sent to room: ${roomName}`);
    });

    socket.on('admin-notification', (data) => {
      io.emit('admin-notification', data);
    });
    
    // Disconnect
    socket.on('disconnect', () => {
        if (LOG_VERBOSE) {
          console.log(`❌ User disconnected: ${userId}`);
        }
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('🚀 Socket.IO server is running');
    });
});