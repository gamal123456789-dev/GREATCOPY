const { PrismaClient } = require('@prisma/client');
const io = require('socket.io-client');
const axios = require('axios');

const prisma = new PrismaClient();

// Test configuration
const SOCKET_URL = 'http://localhost:5201';
const API_BASE = 'http://localhost:3000';

async function testRealAdminNotifications() {
  console.log('🔍 Testing Real Admin Notifications System');
  console.log('=' .repeat(50));
  
  let adminSocket = null;
  let testUserId = null;
  let testOrderId = null;
  
  try {
    // Step 1: Create test user
    console.log('\n1. Creating test user...');
    const testUser = await prisma.user.upsert({
      where: { email: 'test-admin-notifications@example.com' },
      update: {},
      create: {
        id: `test-user-${Date.now()}`,
        email: 'test-admin-notifications@example.com',
        name: 'Test Admin Notifications User',
        role: 'USER'
      }
    });
    testUserId = testUser.id;
    console.log('✅ Test user created:', testUser.name);
    
    // Step 2: Connect admin socket to admin room
    console.log('\n2. Connecting admin socket...');
    adminSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000
    });
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 10000);
      
      adminSocket.on('connect', () => {
        console.log('✅ Admin socket connected:', adminSocket.id);
        clearTimeout(timeout);
        resolve();
      });
      
      adminSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    // Step 3: Join admin room
    console.log('\n3. Joining admin room...');
    adminSocket.emit('join-admin-room');
    
    // Wait a moment for room join
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Joined admin room');
    
    // Step 4: Set up notification listener
    console.log('\n4. Setting up notification listener...');
    let notificationReceived = false;
    let receivedNotification = null;
    
    adminSocket.on('new-notification', (notification) => {
      console.log('🔔 NOTIFICATION RECEIVED:', notification);
      notificationReceived = true;
      receivedNotification = notification;
    });
    
    adminSocket.on('new-order', (orderData) => {
      console.log('📦 NEW ORDER NOTIFICATION:', orderData);
      notificationReceived = true;
      receivedNotification = orderData;
    });
    
    console.log('✅ Notification listeners set up');
    
    // Step 5: Create test order to trigger notification
    console.log('\n5. Creating test order...');
    const testOrder = await prisma.order.create({
      data: {
        id: `test-order-${Date.now()}`,
        userId: testUserId,
        customerName: testUser.name,
        game: 'Test Game',
        service: 'Test Service',
        price: 25.99,
        status: 'pending',
        date: new Date()
      }
    });
    testOrderId = testOrder.id;
    console.log('✅ Test order created:', testOrder.id);
    
    // Step 6: Manually trigger admin notification (simulate what happens in confirm-payment.ts)
    console.log('\n6. Triggering admin notification...');
    
    try {
      // Make HTTP request to trigger notification
      const response = await axios.post(`${API_BASE}/api/admin/test-notification`, {
        orderId: testOrder.id,
        customerName: testOrder.customerName,
        game: testOrder.game,
        service: testOrder.service,
        price: testOrder.price
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log('✅ Notification API call successful');
      } else {
        console.log('⚠️ Notification API call returned:', response.status);
      }
    } catch (apiError) {
      console.log('⚠️ Notification API not available, using direct socket emission');
      
      // Direct socket emission as fallback
      const notificationData = {
        type: 'new-order',
        message: `New order from ${testOrder.customerName}`,
        orderId: testOrder.id,
        customerName: testOrder.customerName,
        game: testOrder.game,
        service: testOrder.service,
        price: testOrder.price,
        order: testOrder
      };
      
      // Emit to admin room directly
      adminSocket.emit('send-admin-notification', notificationData);
    }
    
    // Step 7: Wait for notification
    console.log('\n7. Waiting for notification...');
    
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve();
      }, 5000);
      
      const checkNotification = () => {
        if (notificationReceived) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkNotification, 100);
        }
      };
      
      checkNotification();
    });
    
    // Step 8: Results
    console.log('\n8. Test Results:');
    console.log('=' .repeat(30));
    
    if (notificationReceived) {
      console.log('✅ SUCCESS: Admin notification was received!');
      console.log('📋 Notification details:', JSON.stringify(receivedNotification, null, 2));
    } else {
      console.log('❌ FAILED: Admin notification was NOT received');
      console.log('🔍 Possible issues:');
      console.log('   - Socket.IO server not running on port 5201');
      console.log('   - Admin room not properly configured');
      console.log('   - Notification emission not working');
      console.log('   - Socket connection issues');
    }
    
    // Step 9: Additional diagnostics
    console.log('\n9. Connection Diagnostics:');
    console.log('   - Socket connected:', adminSocket.connected);
    console.log('   - Socket ID:', adminSocket.id);
    console.log('   - Socket URL:', SOCKET_URL);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
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
        console.log('⚠️ Could not delete test order:', e.message);
      }
    }
    
    if (testUserId) {
      try {
        await prisma.user.delete({ where: { id: testUserId } });
        console.log('✅ Test user deleted');
      } catch (e) {
        console.log('⚠️ Could not delete test user:', e.message);
      }
    }
    
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  }
  
  console.log('\n🏁 Test completed!');
}

// Run the test
testRealAdminNotifications().catch(console.error);