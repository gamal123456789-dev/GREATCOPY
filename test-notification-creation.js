const { PrismaClient } = require('@prisma/client');
const { sendDatabaseNotification } = require('./services/databaseNotificationService');

const prisma = new PrismaClient();

async function testNotificationCreation() {
  try {
    console.log('🧪 Testing notification creation...');
    
    // Test 1: Direct notification
    console.log('\n1. Testing direct notification...');
    await sendDatabaseNotification('new_order', {
      orderId: 'TEST-' + Date.now(),
      customerName: 'Test Customer',
      game: 'Test Game',
      service: 'Test Service',
      price: 99.99,
      status: 'pending'
    });
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Check if notifications were created
    console.log('\n2. Checking created notifications...');
    const notifications = await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`Found ${notifications.length} recent notifications:`);
    notifications.forEach((notification, index) => {
      console.log(`\n${index + 1}. ID: ${notification.id}`);
      console.log(`   Type: ${notification.type}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   User ID: ${notification.userId}`);
      console.log(`   Read: ${notification.read}`);
      console.log(`   Created: ${notification.createdAt}`);
      if (notification.data) {
        console.log(`   Data: ${JSON.stringify(notification.data, null, 2)}`);
      }
    });
    
    // Test 3: Create a real order to test middleware
    console.log('\n3. Testing order creation (middleware trigger)...');
    const testOrder = await prisma.order.create({
      data: {
        id: 'TEST-ORDER-' + Date.now(),
        customerName: 'Middleware Test Customer',
        game: 'Test Game',
        service: 'Test Service',
        status: 'pending',
        price: 149.99,
        date: new Date(),
        userId: '4f2cb557-a0d7-472b-92e5-dc953fd8d570', // First admin user
        paymentId: null
      }
    });
    
    console.log(`✅ Created test order: ${testOrder.id}`);
    
    // Wait for middleware to process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check notifications again
    console.log('\n4. Checking notifications after order creation...');
    const newNotifications = await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 1000) // Last 2 minutes
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${newNotifications.length} notifications in the last 2 minutes`);
    
    console.log('\n✅ Notification test completed!');
    
  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationCreation();