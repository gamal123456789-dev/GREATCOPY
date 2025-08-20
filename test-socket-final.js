/**
 * Final Socket.IO Test - Port 5201
 * Tests Socket.IO connection and real-time notifications on the correct port
 */

const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');
const prisma = require('./lib/prisma.js');

async function testSocketIOFinal() {
  console.log('🔍 Final Socket.IO Test on Port 5201...');
  
  try {
    // Find the test user
    const testUser = await prisma.user.findUnique({
      where: { id: '7d14fc11-a0bf-449f-97af-6c3e9faa8841' },
      select: { id: true, email: true, role: true }
    });
    
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('👤 Found test user:', testUser.email);
    
    // Create JWT token
    const token = jwt.sign(
      { sub: testUser.id },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Generated JWT token');
    
    // Connect to Socket.IO server on port 5201
    const socket = io('http://localhost:5201', {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 10000
    });
    
    let testCompleted = false;
    
    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      console.log('🔗 Connected to server on port 5201');
      
      // Test notification after connection
      setTimeout(() => {
        console.log('\n📡 Testing real-time notification...');
        testRealTimeNotification(socket, testUser.id);
      }, 2000);
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Socket connection error:', error.message);
      if (!testCompleted) {
        testCompleted = true;
        process.exit(1);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });
    
    // Listen for notifications
    socket.on('payment-confirmed', (data) => {
      console.log('🔔 Received payment confirmation:', data);
    });
    
    socket.on('new-notification', (data) => {
      console.log('🔔 Received notification:', data);
    });
    
    // Test function
    async function testRealTimeNotification(socket, userId) {
      try {
        // Import notification service
        const { sendDatabaseNotification } = require('./services/databaseNotificationService');
        
        console.log('📤 Sending test notification...');
        
        // Send a test notification
        await sendDatabaseNotification({
          userId: userId,
          type: 'test',
          title: 'اختبار الإشعارات الفورية',
          message: 'هذا اختبار للتأكد من وصول الإشعارات فوراً',
          data: {
            testId: Date.now(),
            source: 'socket-test'
          }
        });
        
        console.log('✅ Test notification sent to database');
        
        // Wait for real-time notification
        setTimeout(() => {
          console.log('\n📊 Test Results:');
          console.log('✅ Socket.IO connection: SUCCESS');
          console.log('✅ Notification sent to database: SUCCESS');
          console.log('⏳ Real-time delivery: Check browser for instant notification');
          
          socket.disconnect();
          testCompleted = true;
          process.exit(0);
        }, 3000);
        
      } catch (error) {
        console.error('❌ Error in test notification:', error);
        socket.disconnect();
        testCompleted = true;
        process.exit(1);
      }
    }
    
    // Timeout after 15 seconds
    setTimeout(() => {
      if (!testCompleted) {
        console.log('⏰ Test timeout - disconnecting');
        socket.disconnect();
        testCompleted = true;
        process.exit(1);
      }
    }, 15000);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  process.exit(0);
});

// Run the test
testSocketIOFinal();