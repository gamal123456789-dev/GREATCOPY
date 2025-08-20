require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createUserNotification() {
  try {
    const orderId = 'cm_order_1755507139724_lfqw076dy';
    const userId = '7d14fc11-a0bf-449f-97af-6c3e9faa8841';
    
    console.log('🔔 Creating payment confirmation notification for user...');
    console.log('Order ID:', orderId);
    console.log('User ID:', userId);
    console.log('============================================');
    
    // Create notification directly in database
    const notification = await prisma.notification.create({
      data: {
        type: 'payment-confirmed',
        title: 'تأكيد دفع',
        message: `تم تأكيد دفعتك بنجاح للطلب ${orderId}. سيتم البدء في تنفيذ الخدمة قريباً.`,
        data: {
          orderId: orderId,
          paymentAmount: '0.56',
          currency: 'USD',
          game: 'Black Desert Online',
          service: 'Power Leveling'
        },
        userId: userId,
        read: false
      }
    });
    
    console.log('✅ Notification created successfully!');
    console.log('Notification ID:', notification.id);
    console.log('Created at:', notification.createdAt);
    
    // Verify notification was created
    const userNotifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n📊 Verification:');
    console.log('User notifications in last minute:', userNotifications.length);
    
    userNotifications.forEach((n, index) => {
      console.log(`${index + 1}. ID: ${n.id}`);
      console.log(`   Type: ${n.type}`);
      console.log(`   Title: ${n.title}`);
      console.log(`   Message: ${n.message}`);
      console.log(`   Created: ${n.createdAt}`);
      console.log(`   Read: ${n.read}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUserNotification();