const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

console.log('🔍 Testing notification API specifically...');

async function testNotificationAPI() {
  let adminSocket = null;
  let testUserId = null;
  
  try {
    // 1. Create test admin user
    console.log('\n1️⃣ Creating test admin user...');
    testUserId = `test_admin_${Date.now()}`;
    const testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: `admin${Date.now()}@test.com`,
        username: `admin${Date.now()}`,
        role: 'ADMIN'
      }
    });
    console.log('✅ Test admin user created:', testUserId);
    
    // 2. Generate JWT token
    console.log('\n2️⃣ Generating JWT token...');
    const adminToken = jwt.sign(
      { sub: testUserId, email: testUser.email },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ JWT token generated');
    
    // 3. Connect admin socket
    console.log('\n3️⃣ Connecting admin socket...');
    adminSocket = io('http://localhost:5201', {
      auth: { token: adminToken },
      transports: ['websocket', 'polling']
    });
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 10000);
      
      adminSocket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Admin socket connected:', adminSocket.id);
        resolve();
      });
      
      adminSocket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    // 4. Set up notification listeners
    console.log('\n4️⃣ Setting up notification listeners...');
    let newOrderReceived = false;
    let newNotificationReceived = false;
    let anyEventReceived = false;
    
    adminSocket.on('new-order', (data) => {
      console.log('📨 Received new-order event:', data);
      newOrderReceived = true;
      anyEventReceived = true;
    });
    
    adminSocket.on('new-notification', (data) => {
      console.log('📨 Received new-notification event:', data);
      newNotificationReceived = true;
      anyEventReceived = true;
    });
    
    // Listen for any event
    adminSocket.onAny((eventName, ...args) => {
      console.log('📨 Received ANY event:', eventName, args);
      anyEventReceived = true;
    });
    
    console.log('✅ Notification listeners set up');
    
    // 5. Test notification API with detailed logging
    console.log('\n5️⃣ Testing notification API...');
    
    const testPayload = {
      type: 'admin',
      event: 'new-order',
      data: {
        orderId: `test_order_${Date.now()}`,
        customerName: 'Test Customer',
        game: 'Test Game',
        service: 'Test Service',
        price: 50,
        message: 'Test notification from API'
      }
    };
    
    console.log('📤 Sending payload:', JSON.stringify(testPayload, null, 2));
    
    try {
      const response = await fetch('http://localhost:5201/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log('📤 API Response Status:', response.status);
      console.log('📤 API Response Headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('📤 API Response Body:', responseText);
      
      if (response.status === 200) {
        console.log('✅ API call successful');
      } else {
        console.log('❌ API call failed with status:', response.status);
      }
      
    } catch (error) {
      console.log('❌ API call failed with error:', error.message);
      console.log('Error details:', error);
    }
    
    // 6. Wait for notifications
    console.log('\n6️⃣ Waiting for notifications (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 7. Test direct Socket.IO emission (bypass API)
    console.log('\n7️⃣ Testing direct Socket.IO emission...');
    
    // Import and test emitToAdmin directly
    const { emitToAdmin, getSocketIO } = require('./lib/socket-cjs');
    
    console.log('🔍 Testing getSocketIO():');
    const socketInstance = getSocketIO();
    console.log('Socket instance available:', !!socketInstance);
    
    if (socketInstance) {
      console.log('Socket instance details:', {
        hasEmit: !!socketInstance.emit,
        hasTo: !!socketInstance.to,
        socketsCount: socketInstance.sockets?.sockets?.size || 0
      });
      
      // Test direct emission
      console.log('📤 Testing direct emission to admin room...');
      try {
        socketInstance.to('admin').emit('test-direct-emission', {
          message: 'Direct emission test',
          timestamp: new Date().toISOString()
        });
        console.log('✅ Direct emission sent');
      } catch (error) {
        console.log('❌ Direct emission failed:', error.message);
      }
    }
    
    // Test emitToAdmin function
    console.log('📤 Testing emitToAdmin function...');
    const emitResult = emitToAdmin('test-emit-to-admin', {
      message: 'emitToAdmin test',
      timestamp: new Date().toISOString()
    });
    console.log('emitToAdmin result:', emitResult);
    
    // Wait for direct emissions
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 8. Results
    console.log('\n8️⃣ Test Results:');
    console.log('========================================');
    console.log('🔍 Admin socket ID:', adminSocket.id);
    console.log('🔍 Admin socket connected:', adminSocket.connected);
    console.log('📨 new-order received:', newOrderReceived);
    console.log('📨 new-notification received:', newNotificationReceived);
    console.log('📨 Any event received:', anyEventReceived);
    
    if (anyEventReceived) {
      console.log('✅ SUCCESS: At least one notification was received!');
    } else {
      console.log('❌ FAILED: No notifications were received');
      console.log('\n🔍 Debugging info:');
      console.log('- Check server logs for API call processing');
      console.log('- Check if Socket.IO instance is properly set');
      console.log('- Check if admin room is working correctly');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    
    if (adminSocket) {
      adminSocket.disconnect();
      console.log('✅ Admin socket disconnected');
    }
    
    if (testUserId) {
      try {
        await prisma.user.delete({ where: { id: testUserId } });
        console.log('✅ Test user deleted');
      } catch (e) {
        console.log('⚠️ Failed to delete test user:', e.message);
      }
    }
    
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    
    console.log('\n🏁 Test completed!');
    process.exit(0);
  }
}

testNotificationAPI();