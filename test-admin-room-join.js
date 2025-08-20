const { io } = require('socket.io-client');

async function testAdminRoomJoin() {
  console.log('🧪 Testing Admin Room Join Process');
  console.log('=' .repeat(50));
  
  let adminSocket = null;
  
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
    
    // Step 2: Check if we need to authenticate as admin
    console.log('\n2️⃣ Checking authentication requirements...');
    
    // Step 3: Try to join admin room manually
    console.log('\n3️⃣ Attempting to join admin room...');
    
    // Listen for any events that might indicate successful room joining
    adminSocket.on('joined-admin', (data) => {
      console.log('✅ Successfully joined admin room:', data);
    });
    
    adminSocket.on('error', (error) => {
      console.log('❌ Socket error:', error);
    });
    
    // Try different ways to join admin room
    console.log('   Trying: join-admin-room event...');
    adminSocket.emit('join-admin-room');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('   Trying: join-admin event...');
    adminSocket.emit('join-admin');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Set up notification listeners
    console.log('\n4️⃣ Setting up notification listeners...');
    let notificationReceived = false;
    
    adminSocket.on('new-order', (data) => {
      console.log('🎉 NEW ORDER NOTIFICATION RECEIVED!');
      console.log('Data:', JSON.stringify(data, null, 2));
      notificationReceived = true;
    });
    
    adminSocket.on('new-notification', (data) => {
      console.log('🔔 NEW NOTIFICATION RECEIVED!');
      console.log('Data:', JSON.stringify(data, null, 2));
      notificationReceived = true;
    });
    
    // Step 5: Test direct emission to admin room from server side
    console.log('\n5️⃣ Testing direct emission to admin room...');
    
    // Use the notification API endpoint
    const axios = require('axios');
    
    try {
      const response = await axios.post('http://localhost:5201/api/notifications/send', {
        type: 'admin',
        event: 'new-order',
        data: {
          type: 'new-order',
          orderId: 'test_order_123',
          customerName: 'Test Customer',
          game: 'Test Game',
          service: 'Test Service',
          message: 'Test notification from API',
          timestamp: new Date()
        }
      });
      
      console.log('✅ API notification sent:', response.data);
    } catch (apiError) {
      console.error('❌ API notification failed:', apiError.message);
    }
    
    // Step 6: Wait for notification
    console.log('\n6️⃣ Waiting for notification (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 7: Results
    console.log('\n7️⃣ Test Results:');
    console.log('=' .repeat(40));
    
    if (notificationReceived) {
      console.log('✅ SUCCESS: Admin notification was received!');
    } else {
      console.log('❌ FAILED: Admin notification was NOT received');
      console.log('\n🔍 Debugging information:');
      console.log('   - Socket ID:', adminSocket.id);
      console.log('   - Socket connected:', adminSocket.connected);
      console.log('   - Socket rooms: Need to check server-side');
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
    
    console.log('\n🏁 Test completed!');
    process.exit(0);
  }
}

// Run the test
testAdminRoomJoin().catch(console.error);