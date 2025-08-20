/**
 * Test Socket.IO Direct Access
 * Tests Socket.IO instance directly from the server process
 */

const { getSocketIO } = require('./lib/socket-cjs');

async function testSocketIODirect() {
  console.log('🔍 Testing Socket.IO Direct Access...');
  
  // Wait a bit for server to initialize
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const io = getSocketIO();
  
  console.log('📡 Socket.IO Instance:', {
    available: !!io,
    type: typeof io,
    hasEmit: !!(io && io.emit),
    hasTo: !!(io && io.to),
    hasAdapter: !!(io && io.sockets && io.sockets.adapter),
    hasRooms: !!(io && io.sockets && io.sockets.adapter && io.sockets.adapter.rooms)
  });
  
  if (io) {
    console.log('✅ Socket.IO is available!');
    console.log('👥 Connected sockets:', io.sockets.sockets.size);
    console.log('🏠 Available rooms:');
    
    for (const [roomName, room] of io.sockets.adapter.rooms) {
      if (!roomName.startsWith('socket_')) { // Skip individual socket rooms
        console.log(`   - ${roomName}: ${room.size} clients`);
      }
    }
    
    // Test emitting to admin room
    console.log('\n📤 Testing direct emission to admin room...');
    
    const testNotification = {
      id: `direct_test_${Date.now()}`,
      type: 'test',
      title: 'اختبار مباشر للإشعارات',
      message: 'هذا اختبار مباشر لإرسال الإشعارات للإدمن',
      timestamp: new Date().toISOString(),
      read: false
    };
    
    try {
      // Direct emission to admin room
      io.to('admin').emit('new-notification', testNotification);
      console.log('✅ Direct emission to admin room successful');
      
      // Check if admin room exists
      const adminRoom = io.sockets.adapter.rooms.get('admin');
      if (adminRoom) {
        console.log(`🏠 Admin room has ${adminRoom.size} connected clients`);
      } else {
        console.log('❌ Admin room does not exist - no admin users connected');
      }
      
    } catch (error) {
      console.error('❌ Error in direct emission:', error);
    }
    
  } else {
    console.log('❌ Socket.IO is not available');
    console.log('🔍 This means setSocketIO was not called or failed');
  }
}

// Test the emitToAdmin function specifically
async function testEmitToAdminFunction() {
  console.log('\n📡 Testing emitToAdmin function...');
  
  const { emitToAdmin } = require('./lib/socket-cjs');
  
  const testData = {
    id: `emit_test_${Date.now()}`,
    type: 'test',
    title: 'اختبار دالة emitToAdmin',
    message: 'اختبار إرسال الإشعارات باستخدام دالة emitToAdmin',
    timestamp: new Date().toISOString()
  };
  
  const result = emitToAdmin('new-notification', testData);
  
  if (result) {
    console.log('✅ emitToAdmin function worked successfully');
  } else {
    console.log('❌ emitToAdmin function failed - Socket.IO not available');
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Socket.IO Direct Tests...');
  console.log('=' .repeat(50));
  
  await testSocketIODirect();
  await testEmitToAdminFunction();
  
  console.log('\n🏁 Tests completed.');
}

runTests().catch(console.error);