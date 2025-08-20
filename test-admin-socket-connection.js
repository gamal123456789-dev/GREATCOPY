/**
 * Test Admin Socket.IO Connection
 * Tests if admin users can connect to Socket.IO and receive notifications
 * Updated to debug notification issues on gear-score.com
 */
const { sendNewOrderNotification } = require('./lib/notificationService.js');
const { getSocketIO } = require('./lib/socket-cjs.js');

async function testAdminSocketConnection() {
  console.log('🔍 Testing Admin Socket.IO Connection...');
  
  // Check Socket.IO status
  const io = getSocketIO();
  console.log('📡 Socket.IO Status:', io ? 'Available' : 'Not Available');
  
  if (io) {
    console.log('👥 Connected Sockets:', io.engine.clientsCount);
    
    // Check if admin room exists
    const adminRoom = io.sockets.adapter.rooms.get('admin');
    console.log('🏠 Admin Room:', adminRoom ? `${adminRoom.size} clients` : 'No clients connected');
    
    // List all rooms
    console.log('🏠 All Rooms:');
    for (const [roomName, room] of io.sockets.adapter.rooms) {
      if (!roomName.startsWith('socket_')) { // Skip individual socket rooms
        console.log(`   - ${roomName}: ${room.size} clients`);
      }
    }
  }
  
  // Test sending a notification
  console.log('\n📨 Testing Admin Notification...');
  
  const testOrder = {
    id: 'test-order-' + Date.now(),
    customerName: 'Test Customer',
    game: 'Test Game',
    service: 'Test Service',
    price: 99.99,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  const testUser = {
    id: 'test-user-' + Date.now(),
    email: 'test@example.com',
    name: 'Test User'
  };
  
  try {
    const result = await sendNewOrderNotification(testOrder, testUser);
    console.log('✅ Notification Result:', result ? 'Success' : 'Failed/Fallback');
  } catch (error) {
    console.error('❌ Notification Error:', error.message);
  }
  
  console.log('\n🎯 Summary:');
  console.log('- If you see "FALLBACK_NOTIFICATION" above, it means no admin is connected to Socket.IO');
  console.log('- Admin needs to open the admin panel in browser to connect to Socket.IO');
  console.log('- Once connected, real-time notifications will work instead of fallback');
}

testAdminSocketConnection().catch(console.error);