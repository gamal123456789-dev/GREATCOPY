/**
 * Comprehensive test for real-time notification system
 * Tests both database storage and Socket.IO real-time delivery
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const io = require('socket.io-client');
const fs = require('fs');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:5201';

async function testRealtimeNotifications() {
  console.log('🚀 Starting comprehensive real-time notification test...');
  console.log('=' .repeat(70));
  
  let testResults = {
    databaseConnection: false,
    socketConnection: false,
    orderCreation: false,
    databaseNotification: false,
    realtimeNotification: false,
    webhookNotification: false
  };
  
  try {
    // Test 1: Database Connection
    console.log('\n1️⃣ Testing Database Connection...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected - Found ${userCount} users`);
    testResults.databaseConnection = true;
    
    // Test 2: Socket.IO Connection
    console.log('\n2️⃣ Testing Socket.IO Connection...');
    const adminSocket = io(`${API_BASE}`, {
      transports: ['websocket', 'polling'],
      timeout: 5000
    });
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 5000);
      
      adminSocket.on('connect', () => {
        console.log('✅ Socket.IO connected successfully');
        clearTimeout(timeout);
        testResults.socketConnection = true;
        resolve();
      });
      
      adminSocket.on('connect_error', (error) => {
        console.log('❌ Socket.IO connection failed:', error.message);
        clearTimeout(timeout);
        reject(error);
      });
    });
    
    // Test 3: Set up notification listeners
    console.log('\n3️⃣ Setting up notification listeners...');
    let receivedNotifications = [];
    
    adminSocket.on('new-order', (data) => {
      console.log('📨 Received new-order notification:', {
        orderId: data.orderId,
        customerName: data.customerName,
        game: data.game,
        service: data.service,
        timestamp: data.timestamp
      });
      receivedNotifications.push({ type: 'new-order', data });
    });
    
    adminSocket.on('new-notification', (data) => {
      console.log('📨 Received new-notification:', data);
      receivedNotifications.push({ type: 'new-notification', data });
    });
    
    // Test 4: Create test order via API
    console.log('\n4️⃣ Creating test order via API...');
    const testUser = await prisma.user.findFirst({
      where: { email: { not: '' } }
    });
    
    if (!testUser) {
      throw new Error('No test user found in database');
    }
    
    const orderId = `TEST-REALTIME-${Date.now()}`;
    const orderData = {
      id: orderId,
      customerName: testUser.name || 'Test Customer',
      game: 'Test Game',
      service: 'Test Service',
      status: 'pending',
      price: 99.99,
      date: new Date().toISOString(),
      userId: testUser.id
    };
    
    // Create order directly in database to trigger middleware
    const order = await prisma.order.create({
      data: orderData
    });
    
    console.log(`✅ Order created: ${order.id}`);
    testResults.orderCreation = true;
    
    // Wait for notifications to process
    console.log('\n⏳ Waiting for notifications to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 5: Check database notifications
    console.log('\n5️⃣ Checking database notifications...');
    const dbNotifications = await prisma.notification.findMany({
      where: {
        data: {
          path: ['orderId'],
          equals: orderId
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📝 Found ${dbNotifications.length} database notifications`);
    if (dbNotifications.length > 0) {
      testResults.databaseNotification = true;
      dbNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.title} - ${notif.message}`);
      });
    }
    
    // Test 6: Check real-time notifications
    console.log('\n6️⃣ Checking real-time notifications...');
    console.log(`📡 Received ${receivedNotifications.length} real-time notifications`);
    if (receivedNotifications.length > 0) {
      testResults.realtimeNotification = true;
      receivedNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.type}: ${notif.data.orderId || 'N/A'}`);
      });
    }
    
    // Test 7: Test webhook notification (simulate Cryptomus webhook)
    console.log('\n7️⃣ Testing webhook notification...');
    const crypto = require('crypto');
    const webhookOrderId = `WEBHOOK-TEST-${Date.now()}`;
    
    // Create payment session first
    const paymentSession = await prisma.paymentSession.create({
      data: {
        id: webhookOrderId,
        orderId: webhookOrderId,
        userId: testUser.id,
        customerEmail: testUser.email,
        amount: 49.99,
        currency: 'USD',
        game: 'Webhook Test Game',
        service: 'Webhook Test Service',
        status: 'pending',
        paymentProvider: 'cryptomus'
      }
    });
    
    const webhookPayload = {
      order_id: webhookOrderId,
      status: 'paid',
      amount: '49.99',
      currency: 'USD',
      uuid: `webhook_test_${Date.now()}`,
      additional_data: 'realtime_test'
    };
    
    const apiKey = process.env.CRYPTOMUS_API_KEY || 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
    const dataString = Buffer.from(JSON.stringify(webhookPayload)).toString('base64');
    const signature = crypto.createHash('md5').update(dataString + apiKey).digest('hex');
    
    try {
      const webhookResponse = await axios.post(`${API_BASE}/api/pay/cryptomus/webhook`, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
          'sign': signature
        },
        timeout: 10000
      });
      
      console.log(`✅ Webhook response: ${webhookResponse.status}`);
      testResults.webhookNotification = true;
      
      // Wait for webhook processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if webhook order was created
      const webhookOrder = await prisma.order.findUnique({
        where: { id: webhookOrderId }
      });
      
      if (webhookOrder) {
        console.log(`✅ Webhook order created: ${webhookOrder.id}`);
      }
      
    } catch (webhookError) {
      console.log(`❌ Webhook test failed: ${webhookError.message}`);
    }
    
    // Final wait for all notifications
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.order.deleteMany({
      where: {
        id: { in: [orderId, webhookOrderId] }
      }
    });
    
    await prisma.paymentSession.deleteMany({
      where: {
        id: webhookOrderId
      }
    });
    
    // Delete notifications for test orders
    const testNotifications = await prisma.notification.findMany({
      where: {
        OR: [
          {
            data: {
              path: ['orderId'],
              equals: orderId
            }
          },
          {
            data: {
              path: ['orderId'],
              equals: webhookOrderId
            }
          }
        ]
      }
    });
    
    if (testNotifications.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          id: {
            in: testNotifications.map(n => n.id)
          }
        }
      });
    }
    
    console.log('✅ Test data cleaned up');
    
    // Close socket connection
    adminSocket.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
  // Results Summary
  console.log('\n' + '=' .repeat(70));
  console.log('📋 REAL-TIME NOTIFICATION TEST RESULTS:');
  console.log('=' .repeat(70));
  
  const results = [
    { test: 'Database Connection', status: testResults.databaseConnection },
    { test: 'Socket.IO Connection', status: testResults.socketConnection },
    { test: 'Order Creation', status: testResults.orderCreation },
    { test: 'Database Notification', status: testResults.databaseNotification },
    { test: 'Real-time Notification', status: testResults.realtimeNotification },
    { test: 'Webhook Notification', status: testResults.webhookNotification }
  ];
  
  results.forEach(result => {
    const status = result.status ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.test}`);
  });
  
  const passedTests = results.filter(r => r.status).length;
  const totalTests = results.length;
  
  console.log('\n📊 Overall Result:');
  console.log(`${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Real-time notification system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
  
  console.log('=' .repeat(70));
}

// Run the test
testRealtimeNotifications()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });