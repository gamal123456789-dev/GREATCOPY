const { setupDatabaseMonitoring, sendDatabaseNotification } = require('../services/databaseNotificationService');
const prisma = require('../lib/prisma');

// Mock console.log to capture output
const originalConsoleLog = console.log;
let logOutput = [];

function mockConsoleLog() {
  console.log = (...args) => {
    logOutput.push(args.join(' '));
    originalConsoleLog(...args);
  };
}

function restoreConsoleLog() {
  console.log = originalConsoleLog;
}

function clearLogOutput() {
  logOutput = [];
}

// Test suite for notification system
async function runNotificationTests() {
  console.log('🧪 Starting Notification System Tests...');
  let testsPassed = 0;
  let testsTotal = 0;
  
  // Test 1: Direct notification sending
  testsTotal++;
  try {
    console.log('\n📋 Test 1: Direct notification sending');
    
    const result = await sendDatabaseNotification('test_event', {
      testData: 'Test notification data',
      timestamp: new Date().toISOString()
    });
    
    if (result && result.success) {
      console.log('✅ Test 1 PASSED: Direct notification sent successfully');
      testsPassed++;
    } else {
      console.log('❌ Test 1 FAILED: Direct notification failed');
    }
  } catch (error) {
    console.log('❌ Test 1 FAILED:', error.message);
  }
  
  // Test 2: Middleware setup and order creation
  testsTotal++;
  try {
    console.log('\n📋 Test 2: Middleware setup and order creation');
    
    // Setup middleware
    setupDatabaseMonitoring(prisma);
    
    // Find a user
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No user found for testing');
    }
    
    const testOrderId = `TEST-UNIT-${Date.now()}`;
    
    // Mock console.log to capture middleware output
    mockConsoleLog();
    
    // Create order
    const order = await prisma.order.create({
      data: {
        id: testOrderId,
        customerName: 'Unit Test Customer',
        game: 'Unit Test Game',
        service: 'Unit Test Service',
        status: 'pending',
        price: 150,
        date: new Date(),
        userId: user.id,
        paymentId: null
      }
    });
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if middleware was triggered
    const middlewareTriggered = logOutput.some(log => 
      log.includes('Middleware intercepted: Order create') ||
      log.includes('Middleware triggered for new order')
    );
    
    // Clean up
    await prisma.order.delete({ where: { id: testOrderId } });
    restoreConsoleLog();
    clearLogOutput();
    
    if (middlewareTriggered && order) {
      console.log('✅ Test 2 PASSED: Middleware triggered for order creation');
      testsPassed++;
    } else {
      console.log('❌ Test 2 FAILED: Middleware not triggered or order not created');
    }
  } catch (error) {
    restoreConsoleLog();
    console.log('❌ Test 2 FAILED:', error.message);
  }
  
  // Test 3: Notification storage in database
  testsTotal++;
  try {
    console.log('\n📋 Test 3: Notification storage in database');
    
    const beforeCount = await prisma.notification.count();
    
    await sendDatabaseNotification('test_storage', {
      testData: 'Storage test data'
    });
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const afterCount = await prisma.notification.count();
    
    if (afterCount > beforeCount) {
      console.log('✅ Test 3 PASSED: Notification stored in database');
      testsPassed++;
    } else {
      console.log('❌ Test 3 FAILED: Notification not stored in database');
    }
  } catch (error) {
    console.log('❌ Test 3 FAILED:', error.message);
  }
  
  // Test 4: Multiple order operations
  testsTotal++;
  try {
    console.log('\n📋 Test 4: Multiple order operations');
    
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No user found for testing');
    }
    
    const testOrderIds = [];
    mockConsoleLog();
    
    // Create multiple orders
    for (let i = 0; i < 3; i++) {
      const orderId = `TEST-MULTI-${Date.now()}-${i}`;
      testOrderIds.push(orderId);
      
      await prisma.order.create({
        data: {
          id: orderId,
          customerName: `Multi Test Customer ${i}`,
          game: 'Multi Test Game',
          service: 'Multi Test Service',
          status: 'pending',
          price: 100 + i * 10,
          date: new Date(),
          userId: user.id,
          paymentId: null
        }
      });
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Count middleware triggers
    const createTriggers = logOutput.filter(log => 
      log.includes('Middleware intercepted: Order create') ||
      log.includes('Middleware triggered for new order')
    ).length;
    
    // Clean up
    for (const orderId of testOrderIds) {
      await prisma.order.delete({ where: { id: orderId } });
    }
    
    restoreConsoleLog();
    clearLogOutput();
    
    if (createTriggers >= 3) {
      console.log('✅ Test 4 PASSED: Multiple order operations triggered middleware');
      testsPassed++;
    } else {
      console.log(`❌ Test 4 FAILED: Expected 3+ triggers, got ${createTriggers}`);
    }
  } catch (error) {
    restoreConsoleLog();
    console.log('❌ Test 4 FAILED:', error.message);
  }
  
  // Test Results
  console.log('\n🏁 Test Results:');
  console.log(`✅ Tests Passed: ${testsPassed}/${testsTotal}`);
  console.log(`❌ Tests Failed: ${testsTotal - testsPassed}/${testsTotal}`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All tests passed! Notification system is working correctly.');
    return true;
  } else {
    console.log('⚠️ Some tests failed. Please review the notification system.');
    return false;
  }
}

// Run tests
runNotificationTests().then((success) => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});