const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

async function testSocketConnection() {
  try {
    console.log('🔌 Testing Socket.IO connection...');
    
    // Create a test admin token
    const adminPayload = {
      sub: 'test-admin-id',
      email: 'test-admin@example.com',
      role: 'ADMIN'
    };
    
    const token = jwt.sign(adminPayload, process.env.NEXTAUTH_SECRET || 'test-secret');
    
    // Connect to Socket.IO server
    const socket = io('http://localhost:3000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      console.log('🆔 Socket ID:', socket.id);
      
      // Test admin notification
      socket.on('new-notification', (data) => {
        console.log('🔔 Received notification:', data);
      });
      
      console.log('👑 Admin socket connected and listening for notifications');
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
    });
    
    // Keep connection alive for testing
    setTimeout(() => {
      console.log('🧪 Sending test notification after socket connection...');
      
      // Import and send notification
      const { sendDatabaseNotification } = require('./services/databaseNotificationService');
      
      const testData = {
        userId: 'test_user_socket_' + Date.now(),
        orderId: 'test_order_socket_' + Date.now(),
        customerName: 'Socket Test Customer',
        game: 'Socket Test Game',
        service: 'Socket Test Service',
        price: 2.00,
        status: 'pending',
        paymentMethod: 'Socket Test Payment',
        timestamp: new Date().toISOString(),
        customerEmail: 'socket-test@example.com'
      };
      
      sendDatabaseNotification('payment-confirmed', testData)
        .then(() => {
          console.log('✅ Test notification sent with active socket connection!');
          
          // Disconnect after test
          setTimeout(() => {
            socket.disconnect();
            process.exit(0);
          }, 2000);
        })
        .catch((error) => {
          console.error('❌ Error sending notification:', error);
          socket.disconnect();
          process.exit(1);
        });
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error in socket test:', error);
    process.exit(1);
  }
}

testSocketConnection();