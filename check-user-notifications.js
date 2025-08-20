require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserNotifications() {
  try {
    const userId = '7d14fc11-a0bf-449f-97af-6c3e9faa8841';
    
    console.log('🔍 Checking notifications for user:', userId);
    console.log('============================================');
    
    // Get all notifications for this user
    const allNotifications = await prisma.notification.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Total notifications for user: ${allNotifications.length}`);
    
    if (allNotifications.length > 0) {
      console.log('\n📋 All notifications:');
      allNotifications.forEach((notification, index) => {
        console.log(`${index + 1}. ID: ${notification.id}`);
        console.log(`   Type: ${notification.type}`);
        console.log(`   Title: ${notification.title}`);
        console.log(`   Message: ${notification.message}`);
        console.log(`   Created: ${notification.createdAt}`);
        console.log(`   Read: ${notification.read}`);
        if (notification.data) {
          console.log(`   Data: ${JSON.stringify(notification.data, null, 2)}`);
        }
        console.log('   ---');
      });
    }
    
    // Get recent notifications (last hour)
    const recentNotifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: new Date(Date.now() - 3600000) // Last hour
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n🕐 Recent notifications (last hour): ${recentNotifications.length}`);
    
    // Get unread notifications
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        read: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n📬 Unread notifications: ${unreadNotifications.length}`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log('\n👤 User details:');
    if (user) {
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
    } else {
      console.log('   ❌ User not found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserNotifications();