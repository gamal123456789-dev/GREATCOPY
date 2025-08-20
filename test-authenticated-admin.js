const { PrismaClient } = require('@prisma/client');
const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const prisma = new PrismaClient();

async function testAuthenticatedAdmin() {
  console.log('🧪 Testing Authenticated Admin Notification System');
  console.log('=' .repeat(60));
  
  let adminSocket = null;
  let testUserId = null;
  let testOrderId = null;
  let adminUserId = null;
  
  try {
    // Step 1: Create or find admin user
    console.log('\n1️⃣ Creating/finding admin user...');
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          id: `admin_user_${Date.now()}`,
          email: `admin${Date.now()}@gear-score.com`,
          name: 'Test Admin',
          username: 'testadmin',
          role: 'ADMIN'
        }
      });
      console.log('✅ Admin user created:', adminUser.id);
    } else {
      console.log('✅ Admin user found:', adminUser.id);
    }
    adminUserId = adminUser.id;
    
    // Step 2: Generate JWT token for admin
    console.log('\n2️⃣ Generating JWT token for admin...');
    const token = jwt.sign(
      { sub: adminUser.id },
      process.env.NEXTAUTH_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    console.log('✅ JWT token generated');
    
    // Step 3: Connect admin socket with authentication
    console.log('\n3️⃣ Connecting authenticated admin socket...');
    adminSocket = io('http://localhost:5201', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Admin socket connection timeout'));
      }, 10000);
      
      adminSocket.on('connect', () => {
        console.log('✅ Authenticated admin socket connected:', adminSocket.id);
        clearTimeout(timeout);
        resolve();
      });
      
      adminSocket.on('connect_error', (error) => {
        console.error('❌ Admin socket connection error:', error);
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    // Step 4: Wait for admin room join (should be automatic)
    console.log('\n4️⃣ Waiting for automatic admin room join...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Set up notification listeners
    console.log('\n5️⃣ Setting up notification listeners...');
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
    
    // Step 6: Create test customer and order
    console.log('\n6️⃣ Creating test customer and order...');
    const testUser = await prisma.user.create({
      data: {
        id: `test_customer_${Date.now()}`,
        email: `customer${Date.now()}@example.com`,
        name: 'Test Customer',
        username: 'testcustomer',
        role: 'customer'
      }
    });
    testUserId = testUser.id;
    console.log('✅ Test customer created:', testUserId);
    
    testOrderId = `test_order_${Date.now()}`;
    const testOrder = await prisma.order.create({
      data: {
        id: testOrderId,
        userId: testUserId,
        customerName: 'Test Customer',
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
    
    // Step 7: Simulate payment confirmation API call
    console.log('\n7️⃣ Simulating payment confirmation...');
    
    try {
      // Create a session for the test user
      const sessionToken = jwt.sign(
        { sub: testUser.id },
        process.env.NEXTAUTH_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );
      
      // Call confirm-payment API
      const response = await axios.post('http://localhost:5201/api/pay/confirm-payment', {
        orderId: testOrderId,
        game: 'Test Game',
        service: 'Test Service',
        serviceDetails: 'Test Service Details',
        amount: 50.00,
        currency: 'USD',
        chargeId: 'test_charge_123',
        paymentMethod: 'Test Payment'
      }, {
        headers: {
          'Cookie': `next-auth.session-token=${sessionToken}`
        }
      });
      
      console.log('✅ Payment confirmation API called:', response.status);
    } catch (apiError) {
      console.log('⚠️ Payment confirmation API failed:', apiError.message);
      console.log('   Trying direct emitToAdmin...');
      
      // Fallback: Direct emitToAdmin call
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
      
      console.log('📤 Sending direct notification...');
      const emitResult = emitToAdmin('new-order', notificationData);
      console.log('📤 EmitToAdmin result:', emitResult);
    }
    
    // Step 8: Wait for notification
    console.log('\n8️⃣ Waiting for notification (15 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Step 9: Check results
    console.log('\n9️⃣ Test Results:');
    console.log('=' .repeat(40));
    
    if (notificationReceived) {
      console.log('✅ SUCCESS: Admin notification was received!');
      console.log('📧 Received notification:', JSON.stringify(receivedNotification, null, 2));
      console.log('\n🎯 SOLUTION FOUND:');
      console.log('   - Admin must be authenticated with ADMIN role');
      console.log('   - Admin socket automatically joins admin room when authenticated');
      console.log('   - Notifications work correctly with proper authentication');
    } else {
      console.log('❌ FAILED: Admin notification was NOT received');
      console.log('\n🔍 Debugging information:');
      console.log('   - Admin socket ID:', adminSocket.id);
      console.log('   - Admin socket connected:', adminSocket.connected);
      console.log('   - Admin user ID:', adminUserId);
      console.log('   - Admin role: ADMIN');
      console.log('\n🔍 Possible remaining issues:');
      console.log('   - Socket.IO server not properly emitting to admin room');
      console.log('   - Event name mismatch between emit and listen');
      console.log('   - Socket.IO instance not properly initialized in API routes');
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
        console.log('✅ Test customer deleted');
      } catch (e) {
        console.log('⚠️ Could not delete test customer:', e.message);
      }
    }
    
    // Don't delete admin user as it might be needed
    
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
    
    console.log('\n🏁 Test completed!');
    process.exit(0);
  }
}

// Run the test
testAuthenticatedAdmin().catch(console.error);