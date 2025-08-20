/**
 * Test script to debug notification system
 * This will simulate a new order and check if notifications are sent
 */

const { PrismaClient } = require('@prisma/client');
const { sendNewOrderNotification } = require('./lib/notificationService');
const { getSocketIO } = require('./lib/socket-cjs');

const prisma = new PrismaClient();

async function testNotificationSystem() {
  console.log('🧪 Testing notification system...');
  console.log('='.repeat(50));
  
  // Check Socket.IO status
  console.log('\n1. Checking Socket.IO status:');
  const io = getSocketIO();
  console.log('Socket.IO available:', !!io);
  
  if (io) {
    console.log('Connected sockets:', io.sockets.sockets.size);
    console.log('Available rooms:', Array.from(io.sockets.adapter.rooms.keys()));
    console.log('Admin room exists:', io.sockets.adapter.rooms.has('admin'));
  }
  
  // Test notification sending
  console.log('\n2. Testing notification sending:');
  const testOrderData = {
    orderId: 'TEST-' + Date.now(),
    customerName: 'Test Customer',
    game: 'Test Game',
    service: 'Test Service',
    price: 100,
    status: 'pending',
    paymentMethod: 'Test Payment',
    createdAt: new Date()
  };
  
  console.log('Sending test notification with data:', testOrderData);
  
  try {
    const result = await sendNewOrderNotification(testOrderData);
    console.log('Notification result:', result);
  } catch (error) {
    console.error('Notification error:', error);
  }
  
  console.log('\n3. Checking logs for fallback notifications...');
  console.log('Check the console output above for any FALLBACK_NOTIFICATION entries');
  
  console.log('\n='.repeat(50));
  console.log('🧪 Test completed!');
  
  // Close Prisma connection
  await prisma.$disconnect();
}

// Run the test
testNotificationSystem().catch(console.error);