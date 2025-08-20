const { PrismaClient } = require('@prisma/client');
const { io } = require('socket.io-client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testAdminNotificationDirect() {
  console.log('🧪 Testing Admin Notification System - Direct Test');
  console.log('=' .repeat(60));
  
  let adminSocket = null;
  let testUserId = null;
  let testOrderId = null;
  
  try {
    // Step 1: Connect admin socket
    console.log('\n1️⃣ Connecting admin socket to http://localhost:5201...');
    adminSocket = io('http://localhost:5201', {
      transports: ['websocket', 'polling'],
      timeout: 10000
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Admin socket connection timeout'));
      }, 10000);
      
      adminSocket.on('connect', () => {
        console.log('✅ Admin socket connected:', adminSocket.id);
        clearTimeout(timeout);
        resolve();
      });
      
      adminSocket.on('connect_error', (error) => {
        console.error('❌ Admin socket connection error:', error);
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    // Step 2: Join admin room
    console.log('\n2️⃣ Joining admin room...');
    adminSocket.emit('join-admin-room');
    
    // Step 3: Set up notification listener
    console.log('\n3️⃣ Setting up notification listeners...');
    let notificationReceived = false;
    let receivedNotification = null;
    
    adminSocket.on('new-order', (data) => {
      console.log('🎉 NEW ORDER NOTIFICATION RECEIVED!');
      console.log('Data:', JSON.stringify(data, null, 2));
      notificationReceived = true;
      receivedNotification = data;
    });
    
    adminSocket.on('new-notification', (data) => {
      console.log('🔔 NEW NOTIFICATION RECEIVED!');
      console.log('Data:', JSON.stringify(data, null, 2));
      notificationReceived = true;
      receivedNotification = data;
    });
    
    // Step 4: Create test user
    console.log('\n4️⃣ Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        id: `test_user_${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        name: 'Test User',
        username: 'testuser',
        role: 'customer'
      }
    });
    testUserId = testUser.id;
    console.log('✅ Test user created:', testUserId);
    
    // Step 5: Create test order
    console.log('\n5️⃣ Creating test order...');
    testOrderId = `test_order_${Date.now()}`;
    const testOrder = await prisma.order.create({
      data: {
        id: testOrderId,
        userId: testUserId,
        customerName: 'Test User',
        date: new Date(),
        game: 'Test Game',
        service: 'Test Service',
        price: 50.00,
        status: 'pending',
        notes: 'Test order for notification testing'
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        }
      }
    });
    console.log('✅ Test order created:', testOrderId);
    
    // Step 6: Manually trigger admin notification using the same logic as confirm-payment.ts
    console.log('\n6️⃣ Triggering admin notification...');
    const { emitToAdmin } = require('./lib/socket-cjs');
    
    const displayName = testOrder.User.name || testOrder.User.username || testOrder.User.email?.split('@')[0] || 'Unknown';
    const notificationData = {
      type: 'new-order',
      orderId: testOrder.id,
      customerName: displayName,
      game: testOrder.game,
      service: testOrder.service,
      serviceName: `${testOrder.game} - ${testOrder.service}`,
      price: testOrder.price,
      message: `New order from ${displayName} - ${testOrder.game} (${testOrder.service})`,
      timestamp: new Date(),
      order: {
        id: testOrder.id,
        customerName: displayName,
        game: testOrder.game,
        service: testOrder.service,
        status: testOrder.status,
        price: testOrder.price,
        date: testOrder.date.toISOString(),
        userId: testOrder.userId,
        notes: testOrder.notes,
        user: {
          id: testOrder.User.id,
          name: testOrder.User.name,
          email: testOrder.User.email,
          username: testOrder.User.username,
          displayName
        }
      }
    };
    
    console.log('📤 Sending notification data:', JSON.stringify(notificationData, null, 2));
    const emitResult = emitToAdmin('new-order', notificationData);
    console.log('📤 EmitToAdmin result:', emitResult);
    
    // Step 7: Wait for notification
    console.log('\n7️⃣ Waiting for notification (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 8: Check results
    console.log('\n8️⃣ Test Results:');
    console.log('=' .repeat(40));
    
    if (notificationReceived) {
      console.log('✅ SUCCESS: Admin notification was received!');
      console.log('📧 Received notification:', JSON.stringify(receivedNotification, null, 2));
    } else {
      console.log('❌ FAILED: Admin notification was NOT received');
      console.log('🔍 Possible issues:');
      console.log('   - Admin socket not properly connected to admin room');
      console.log('   - Socket.IO server not emitting to admin room');
      console.log('   - Event name mismatch');
      console.log('   - Socket.IO instance not properly initialized');
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
    
    console.log('\n🏁 Test completed!');
    process.exit(0);
  }
}

// Run the test
testAdminNotificationDirect().catch(console.error);