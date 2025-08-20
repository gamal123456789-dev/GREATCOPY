const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔍 Testing simple admin socket connection...');

async function testSimpleAdminSocket() {
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
    
    // 4. Test self-messaging
    console.log('\n4️⃣ Testing self-messaging...');
    let messageReceived = false;
    let receivedMessage = null;
    
    // Listen for test message
    adminSocket.on('test-message', (data) => {
      console.log('📨 Received test message:', data);
      messageReceived = true;
      receivedMessage = data;
    });
    
    // Send test message to self
    adminSocket.emit('test-message', { message: 'Hello from admin!', timestamp: new Date().toISOString() });
    console.log('📤 Test message sent to self');
    
    // 5. Test admin room broadcasting
    console.log('\n5️⃣ Testing admin room broadcasting...');
    let adminBroadcastReceived = false;
    let receivedBroadcast = null;
    
    // Listen for admin broadcast
    adminSocket.on('admin-broadcast', (data) => {
      console.log('📨 Received admin broadcast:', data);
      adminBroadcastReceived = true;
      receivedBroadcast = data;
    });
    
    // Emit to admin room (this should come back to us since we're in admin room)
    adminSocket.emit('broadcast-to-admin', { 
      message: 'Broadcasting to admin room!', 
      timestamp: new Date().toISOString() 
    });
    console.log('📤 Admin broadcast sent');
    
    // 6. Wait for messages
    console.log('\n6️⃣ Waiting for messages (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 7. Test manual emission to admin room
    console.log('\n7️⃣ Testing manual emission to admin room...');
    let manualEmissionReceived = false;
    
    adminSocket.on('manual-admin-test', (data) => {
      console.log('📨 Received manual admin test:', data);
      manualEmissionReceived = true;
    });
    
    // Use server-side emission (this simulates what emitToAdmin should do)
    adminSocket.emit('server-emit-to-admin', {
      event: 'manual-admin-test',
      data: { message: 'Manual test from server', timestamp: new Date().toISOString() }
    });
    console.log('📤 Manual emission request sent');
    
    // Wait for manual emission
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 8. Results
    console.log('\n8️⃣ Test Results:');
    console.log('========================================');
    console.log('🔍 Admin socket ID:', adminSocket.id);
    console.log('🔍 Admin socket connected:', adminSocket.connected);
    console.log('📨 Self-message received:', messageReceived);
    console.log('📨 Admin broadcast received:', adminBroadcastReceived);
    console.log('📨 Manual emission received:', manualEmissionReceived);
    
    if (messageReceived || adminBroadcastReceived || manualEmissionReceived) {
      console.log('✅ SUCCESS: At least one message type worked!');
    } else {
      console.log('❌ FAILED: No messages were received');
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

testSimpleAdminSocket();