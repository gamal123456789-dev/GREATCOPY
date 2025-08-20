const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔍 Testing existing server events...');

async function testExistingEvents() {
  let adminSocket = null;
  let testUserId = null;
  let testOrderId = null;
  
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
    
    // 2. Create test order
    console.log('\n2️⃣ Creating test order...');
    testOrderId = `test_order_${Date.now()}`;
    await prisma.order.create({
      data: {
        id: testOrderId,
        userId: testUserId,
        customerName: 'Test Customer',
        date: new Date(),
        game: 'Test Game',
        price: 50,
        service: 'Test Service',
        status: 'pending',
        notes: 'Test order for socket testing'
      }
    });
    console.log('✅ Test order created:', testOrderId);
    
    // 3. Generate JWT token
    console.log('\n3️⃣ Generating JWT token...');
    const adminToken = jwt.sign(
      { sub: testUserId, email: testUser.email },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ JWT token generated');
    
    // 4. Connect admin socket
    console.log('\n4️⃣ Connecting admin socket...');
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
    
    // 5. Test joining order room
    console.log('\n5️⃣ Testing join-order-room event...');
    let previousMessagesReceived = false;
    let errorReceived = false;
    
    adminSocket.on('previous-messages', (messages) => {
      console.log('📨 Received previous-messages:', messages.length, 'messages');
      previousMessagesReceived = true;
    });
    
    adminSocket.on('error', (error) => {
      console.log('❌ Received error:', error);
      errorReceived = true;
    });
    
    // Join order room
    adminSocket.emit('join-order-room', testOrderId);
    console.log('📤 Sent join-order-room event for order:', testOrderId);
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6. Test sending message
    console.log('\n6️⃣ Testing send-message event...');
    let messageReceived = false;
    let receivedMessage = null;
    
    adminSocket.on('new-message', (message) => {
      console.log('📨 Received new-message:', message);
      messageReceived = true;
      receivedMessage = message;
    });
    
    // Send a test message
    adminSocket.emit('send-message', {
      orderId: testOrderId,
      message: 'Test message from admin',
      messageType: 'text'
    });
    console.log('📤 Sent test message to order room');
    
    // Wait for message response
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 7. Test direct Socket.IO emission to admin room
    console.log('\n7️⃣ Testing direct emission to admin room...');
    
    // Create another admin socket to test admin room communication
    const testUserId2 = `test_admin2_${Date.now()}`;
    const testUser2 = await prisma.user.create({
      data: {
        id: testUserId2,
        email: `admin2${Date.now()}@test.com`,
        username: `admin2${Date.now()}`,
        role: 'ADMIN'
      }
    });
    
    const adminToken2 = jwt.sign(
      { sub: testUserId2, email: testUser2.email },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '1h' }
    );
    
    const adminSocket2 = io('http://localhost:5201', {
      auth: { token: adminToken2 },
      transports: ['websocket', 'polling']
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Second admin socket connection timeout'));
      }, 10000);
      
      adminSocket2.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Second admin socket connected:', adminSocket2.id);
        resolve();
      });
      
      adminSocket2.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    // Listen for admin notifications on both sockets
    let adminNotificationReceived1 = false;
    let adminNotificationReceived2 = false;
    
    adminSocket.on('new-order', (data) => {
      console.log('📨 Admin socket 1 received new-order:', data);
      adminNotificationReceived1 = true;
    });
    
    adminSocket2.on('new-order', (data) => {
      console.log('📨 Admin socket 2 received new-order:', data);
      adminNotificationReceived2 = true;
    });
    
    // Now test the notification API
    console.log('📤 Testing notification API...');
    const fetch = require('node-fetch');
    
    try {
      const response = await fetch('http://localhost:5201/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'admin',
          event: 'new-order',
          data: {
            orderId: testOrderId,
            customerName: 'Test Customer',
            game: 'Test Game',
            service: 'Test Service',
            price: 50,
            message: 'Test notification from API'
          }
        })
      });
      
      console.log('📤 Notification API response status:', response.status);
      const responseText = await response.text();
      console.log('📤 Notification API response:', responseText);
      
    } catch (error) {
      console.log('⚠️ Notification API failed:', error.message);
    }
    
    // Wait for admin notifications
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 8. Results
    console.log('\n8️⃣ Test Results:');
    console.log('========================================');
    console.log('🔍 Admin socket 1 ID:', adminSocket.id);
    console.log('🔍 Admin socket 2 ID:', adminSocket2.id);
    console.log('🔍 Both sockets connected:', adminSocket.connected && adminSocket2.connected);
    console.log('📨 Previous messages received:', previousMessagesReceived);
    console.log('📨 Error received:', errorReceived);
    console.log('📨 Message sent/received:', messageReceived);
    console.log('📨 Admin notification 1 received:', adminNotificationReceived1);
    console.log('📨 Admin notification 2 received:', adminNotificationReceived2);
    
    if (previousMessagesReceived || messageReceived || adminNotificationReceived1 || adminNotificationReceived2) {
      console.log('✅ SUCCESS: At least one event worked!');
    } else {
      console.log('❌ FAILED: No events were received');
    }
    
    // Cleanup second socket and user
    adminSocket2.disconnect();
    await prisma.user.delete({ where: { id: testUserId2 } });
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    
    if (adminSocket) {
      adminSocket.disconnect();
      console.log('✅ Admin socket disconnected');
    }
    
    if (testOrderId) {
      try {
        await prisma.order.delete({ where: { id: testOrderId } });
        console.log('✅ Test order deleted');
      } catch (e) {
        console.log('⚠️ Failed to delete test order:', e.message);
      }
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

testExistingEvents();