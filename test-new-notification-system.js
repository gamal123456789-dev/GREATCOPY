/**
 * Test New Database Notification System
 * Tests the new database-driven notification system
 */

const { sendDatabaseNotification, getAdminUsers, prisma } = require('./services/databaseNotificationService');

// Create a test order directly in database
async function createTestOrder() {
  try {
    // Get or create a test user
    let testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          id: `test_user_${Date.now()}`,
          email: 'test@example.com',
          name: 'Test Customer',
          username: 'testcustomer',
          role: 'user',
          emailVerified: new Date()
        }
      });
      console.log('✅ Test user created:', testUser.id);
    }
    
    // Create test order
    const orderId = `test_order_${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId: testUser.id,
        customerName: testUser.email,
        date: new Date(),
        game: 'Valorant',
        service: 'Rank Boost - Silver to Gold',
        price: 75.00,
        status: 'pending',
        notes: 'Test order created by notification system test'
      }
    });
    
    console.log('✅ تم إنشاء الطلب التجريبي:', order.id);
    return order;
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الطلب التجريبي:', error);
    return null;
  }
}

// اختبار إرسال الإشعارات يدوياً
async function testManualNotification() {
  try {
    console.log('\n🧪 اختبار إرسال الإشعارات يدوياً...');
    
    await sendDatabaseNotification('new_order', {
      orderId: `manual_test_${Date.now()}`,
      customerName: 'عميل اختبار يدوي',
      game: 'Call of Duty',
      service: 'خدمة فتح الأسلحة',
      price: 45.00,
      status: 'pending',
      paymentMethod: 'اختبار يدوي',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Manual notification test completed');
    
  } catch (error) {
    console.error('❌ Error in manual notification test:', error);
  }
}

// Test admin user fetching
async function testAdminUsers() {
  try {
    console.log('\n👥 Testing admin user fetching...');
    
    const adminUsers = await getAdminUsers();
    console.log(`Found ${adminUsers.length} admin users:`);
    
    adminUsers.forEach(admin => {
      console.log(`  - ${admin.name} (${admin.email})`);
    });
    
    if (adminUsers.length === 0) {
      console.warn('⚠️ No admin users found. Make sure you have users with ADMIN role.');
    }
    
  } catch (error) {
    console.error('❌ Error testing admin users:', error);
  }
}

// Check notification log
function checkNotificationLog() {
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log('\n📋 Checking notification log...');
    
    const logFile = path.join(__dirname, 'logs/admin-notifications.log');
    
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      const lines = logContent.trim().split('\n').filter(line => line.trim());
      
      console.log(`📄 Log file contains ${lines.length} entries`);
      
      if (lines.length > 0) {
        console.log('\n📝 Last 3 log entries:');
        const lastEntries = lines.slice(-3);
        
        lastEntries.forEach((line, index) => {
          try {
            const entry = JSON.parse(line);
            console.log(`  ${index + 1}. [${entry.timestamp}] ${entry.type} - Order: ${entry.orderId}`);
          } catch (error) {
            console.log(`  ${index + 1}. Invalid log entry: ${line.substring(0, 50)}...`);
          }
        });
      }
    } else {
      console.log('📄 No log file found yet');
    }
    
  } catch (error) {
    console.error('❌ Error checking notification log:', error);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting New Notification System Tests');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Check admin users
    await testAdminUsers();
    
    // Test 2: Test manual notification
    await testManualNotification();
    
    // Test 3: Create test order (this should trigger automatic notification)
    console.log('\n🛒 Testing automatic notification via database trigger...');
    const testOrder = await createTestOrder();
    
    if (testOrder) {
      console.log('✅ Test order created - automatic notification should have been sent');
    }
    
    // Wait a moment for async operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Check log file
    checkNotificationLog();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check the server console for notification output');
    console.log('2. Visit https://gear-score.com/admin/notifications to see the admin panel');
    console.log('3. Check logs/admin-notifications.log for logged notifications');
    console.log('4. Test real-time notifications by creating actual orders');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };