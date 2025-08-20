/**
 * Test Socket.IO Connection on Correct Port
 * Tests Socket.IO connection on port 5201 and admin room functionality
 */

const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');
const prisma = require('./lib/prisma.js');

async function testSocketIOConnection() {
  console.log('🔍 Testing Socket.IO Connection on Port 5201...');
  
  try {
    // Find an admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, role: true }
    });
    
    if (!adminUser) {
      console.log('❌ No admin user found in database');
      return;
    }
    
    console.log('👑 Found admin user:', adminUser.email);
    
    // Create JWT token for admin
    const token = jwt.sign(
      { sub: adminUser.id },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Generated JWT token for admin');
    
    // Connect to Socket.IO server on correct port
    const socket = io('http://localhost:5201', {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 10000
    });
    
    let connected = false;
    
    // Connection events
    socket.on('connect', () => {
      connected = true;
      console.log('✅ Admin socket connected:', socket.id);
      console.log('🔗 Socket connected to server on port 5201');
      
      // Test emitting to admin room after connection
      setTimeout(() => {
        console.log('\n📡 Testing admin notification emission...');
        testAdminNotification();
      }, 2000);
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Socket connection error:', error.message);
      console.log('🔍 Error details:', error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });
    
    // Listen for notifications
    socket.on('new-notification', (data) => {
      console.log('🔔 ✅ RECEIVED NOTIFICATION:', data);
    });
    
    socket.on('browserNotification', (data) => {
      console.log('🌐 ✅ RECEIVED BROWSER NOTIFICATION:', data);
    });
    
    socket.on('notificationCountUpdate', (data) => {
      console.log('📊 ✅ RECEIVED NOTIFICATION COUNT UPDATE:', data);
    });
    
    // Wait for connection or timeout
    await new Promise((resolve) => {
      setTimeout(() => {
        if (!connected) {
          console.log('⏰ Connection timeout - Socket.IO may not be working properly');
        }
        resolve();
      }, 5000);
    });
    
    // Keep connection alive for testing
    setTimeout(() => {
      console.log('🔚 Closing socket connection...');
      socket.disconnect();
    }, 15000);
    
  } catch (error) {
    console.error('❌ Error testing socket connection:', error);
  }
}

// Test admin notification using the actual service
async function testAdminNotification() {
  console.log('📤 Testing admin notification via emitToAdmin...');
  
  try {
    const { emitToAdmin } = require('./lib/socket-cjs');
    
    // Test notification data
    const testNotification = {
      id: `test_admin_${Date.now()}`,
      type: 'payment_confirmed',
      title: 'تأكيد دفع - اختبار',
      message: 'تم تأكيد دفع طلب اختبار بقيمة $10.00',
      data: {
        orderId: 'test-order-123',
        customerName: 'عميل تجريبي',
        game: 'Black Desert Online',
        service: 'Power Leveling',
        price: 10.00,
        status: 'completed'
      },
      timestamp: new Date().toISOString(),
      read: false
    };
    
    console.log('📤 Sending test notification to admin room...');
    const result = emitToAdmin('new-notification', testNotification);
    
    if (result) {
      console.log('✅ Notification sent successfully via emitToAdmin');
    } else {
      console.log('❌ Failed to send notification - Socket.IO not available in emitToAdmin');
    }
    
    // Also test browser notification
    setTimeout(() => {
      console.log('📤 Sending browser notification...');
      const browserResult = emitToAdmin('browserNotification', {
        title: testNotification.title,
        message: testNotification.message,
        icon: '/favicon.ico',
        tag: `test_${Date.now()}`,
        data: testNotification.data
      });
      
      if (browserResult) {
        console.log('✅ Browser notification sent successfully');
      } else {
        console.log('❌ Failed to send browser notification');
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error testing admin notification:', error);
  }
}

// Run the test
testSocketIOConnection().catch(console.error);

// Keep process alive
setTimeout(() => {
  console.log('\n🏁 Test completed. Exiting...');
  process.exit(0);
}, 20000);