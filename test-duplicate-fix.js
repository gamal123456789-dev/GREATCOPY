const { PrismaClient } = require('@prisma/client');
const { setupDatabaseMonitoring } = require('./services/databaseNotificationService');

const prisma = new PrismaClient();

/**
 * Test to verify duplicate notification fix
 * This test creates a new order and verifies only one set of notifications is created
 */
async function testDuplicateFix() {
  console.log('🧪 Testing Duplicate Notification Fix');
  console.log('=' .repeat(50));
  
  try {
    // Setup middleware on Prisma client
    console.log('\n1️⃣ Setting up database monitoring middleware...');
    setupDatabaseMonitoring(prisma);
    
    // Try to setup middleware again to test duplicate prevention
    console.log('\n2️⃣ Attempting to setup middleware again (should be skipped)...');
    setupDatabaseMonitoring(prisma);
    
    // Get existing users for valid foreign key
    const existingUsers = await prisma.user.findMany({
      select: { id: true, email: true },
      take: 3
    });
    
    if (existingUsers.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`\n3️⃣ Found ${existingUsers.length} users for testing`);
    
    // Count notifications before test
    const notificationsBefore = await prisma.notification.count();
    console.log(`\n4️⃣ Notifications in database before test: ${notificationsBefore}`);
    
    // Create a manual order (should trigger new-order notification)
    console.log('\n5️⃣ Creating manual order (should trigger new-order notification)...');
    const manualOrder = await prisma.order.create({
      data: {
        id: `test_manual_${Date.now()}`,
        userId: existingUsers[0].id,
        customerName: 'Test Manual Customer',
        date: new Date(),
        game: 'Test Game',
        price: 25.00,
        service: 'Test Service',
        status: 'pending'
        // No paymentId - this should trigger new-order notification
      }
    });
    
    console.log('✅ Manual order created:', manualOrder.id);
    
    // Wait a moment for middleware to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Count notifications after manual order
    const notificationsAfterManual = await prisma.notification.count();
    const manualNotificationsCreated = notificationsAfterManual - notificationsBefore;
    console.log(`\n6️⃣ Notifications created for manual order: ${manualNotificationsCreated}`);
    
    // Create a webhook-style order (should NOT trigger new-order notification)
    console.log('\n7️⃣ Creating webhook-style order (should NOT trigger new-order notification)...');
    const webhookOrder = await prisma.order.create({
      data: {
        id: `test_webhook_${Date.now()}`,
        userId: existingUsers[1].id,
        customerName: 'Test Webhook Customer',
        date: new Date(),
        game: 'Test Game',
        price: 30.00,
        service: 'Test Service',
        status: 'pending',
        paymentId: 'test-uuid-webhook-payment-123' // This should prevent new-order notification
      }
    });
    
    console.log('✅ Webhook-style order created:', webhookOrder.id);
    
    // Wait a moment for middleware to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Count notifications after webhook order
    const notificationsAfterWebhook = await prisma.notification.count();
    const webhookNotificationsCreated = notificationsAfterWebhook - notificationsAfterManual;
    console.log(`\n8️⃣ Notifications created for webhook order: ${webhookNotificationsCreated}`);
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST RESULTS SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`Manual order notifications: ${manualNotificationsCreated} (expected: 3 for 3 admins)`);
    console.log(`Webhook order notifications: ${webhookNotificationsCreated} (expected: 0)`);
    
    if (manualNotificationsCreated === 3 && webhookNotificationsCreated === 0) {
      console.log('✅ SUCCESS: Duplicate notification fix is working correctly!');
    } else {
      console.log('❌ FAILURE: Duplicate notification issue may still exist');
    }
    
    // Check specific notifications for the orders
    const manualOrderNotifications = await prisma.notification.findMany({
      where: {
        data: {
          path: ['orderId'],
          equals: manualOrder.id
        }
      }
    });
    
    const webhookOrderNotifications = await prisma.notification.findMany({
      where: {
        data: {
          path: ['orderId'],
          equals: webhookOrder.id
        }
      }
    });
    
    console.log(`\nManual order (${manualOrder.id}) notifications: ${manualOrderNotifications.length}`);
    console.log(`Webhook order (${webhookOrder.id}) notifications: ${webhookOrderNotifications.length}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDuplicateFix();