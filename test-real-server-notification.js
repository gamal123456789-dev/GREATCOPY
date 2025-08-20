const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔍 Testing real server admin notifications...');

async function testRealServerNotification() {
  let adminSocket = null;
  let testUserId = null;
  let testOrderId = null;
  
  try {
    // 1. Create test user
    console.log('\n1️⃣ Creating test user...');
    testUserId = `test_user_${Date.now()}`;
    const testUser = await prisma.user.create({
      data: {
        id: testUserId,
        email: `test${Date.now()}@test.com`,
        username: `testuser${Date.now()}`,
        role: 'ADMIN' // Make this user an admin
      }
    });
    console.log('✅ Test admin user created:', testUserId);
    
    // 2. Generate JWT token for admin
    console.log('\n2️⃣ Generating admin JWT token...');
    const adminToken = jwt.sign(
      { sub: testUserId, email: testUser.email },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ Admin JWT token generated');
    
    // 3. Connect admin socket with authentication
    console.log('\n3️⃣ Connecting admin socket...');
    adminSocket = io('http://localhost:5201', {
      auth: { token: adminToken },
      transports: ['websocket', 'polling']
    });
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Admin socket connection timeout'));
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
    let notificationReceived = false;
    let receivedData = null;
    
    adminSocket.on('new-order', (data) => {
      console.log('📨 Received new-order notification:', data);
      notificationReceived = true;
      receivedData = data;
    });
    
    adminSocket.on('new-notification', (data) => {
      console.log('📨 Received new-notification:', data);
      notificationReceived = true;
      receivedData = data;
    });
    
    console.log('✅ Notification listeners set up');
    
    // 5. Create test order
    console.log('\n5️⃣ Creating test order...');
    testOrderId = `test_order_${Date.now()}`;
    const testOrder = await prisma.order.create({
      data: {
        id: testOrderId,
        userId: testUserId,
        customerName: 'Test Customer',
        date: new Date(),
        game: 'Test Game',
        price: 50,
        service: 'Test Service',
        status: 'pending',
        notes: 'Test order for notification testing'
      }
    });
    console.log('✅ Test order created:', testOrderId);
    
    // 6. Test direct API call to confirm-payment
    console.log('\n6️⃣ Testing payment confirmation API...');
    const fetch = require('node-fetch');
    
    try {
      const response = await fetch('http://localhost:5201/api/pay/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          orderId: testOrderId,
          paymentId: `test_payment_${Date.now()}`,
          amount: 50
        })
      });
      
      console.log('📤 Payment confirmation API response status:', response.status);
      const responseText = await response.text();
      console.log('📤 Payment confirmation API response:', responseText.substring(0, 200));
      
    } catch (error) {
      console.log('⚠️ Payment confirmation API failed:', error.message);
    }
    
    // 7. Test direct notification via API
    console.log('\n7️⃣ Testing direct notification API...');
    try {
      const notificationResponse = await fetch('http://localhost:5201/api/notifications/send', {
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
      
      console.log('📤 Notification API response status:', notificationResponse.status);
      const notificationText = await notificationResponse.text();
      console.log('📤 Notification API response:', notificationText);
      
    } catch (error) {
      console.log('⚠️ Notification API failed:', error.message);
    }
    
    // 8. Wait for notification
    console.log('\n8️⃣ Waiting for notification (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 9. Results
    console.log('\n9️⃣ Test Results:');
    console.log('========================================');
    if (notificationReceived) {
      console.log('✅ SUCCESS: Admin notification was received!');
      console.log('📨 Received data:', JSON.stringify(receivedData, null, 2));
    } else {
      console.log('❌ FAILED: Admin notification was NOT received');
      console.log('🔍 Admin socket ID:', adminSocket.id);
      console.log('🔍 Admin socket connected:', adminSocket.connected);
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

testRealServerNotification();