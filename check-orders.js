const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrders() {
  try {
    // Check all recent orders to see their service details
    const recentOrders = await prisma.order.findMany({
      orderBy: {
        date: 'desc'
      },
      take: 5
    });
    
    console.log('📋 Recent Orders Analysis:');
    console.log('=' .repeat(50));
    
    recentOrders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ID: ${order.id}`);
      console.log(`   Game: ${order.game}`);
      console.log(`   Service: "${order.service}"`);
      console.log(`   Price: $${order.price}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Date: ${order.date}`);
      
      // Analyze service field
      if (order.service.includes('Level') && order.service.includes('to')) {
        console.log(`   ✅ Contains detailed level information`);
      } else if (order.service.includes('Main Questline (')) {
        console.log(`   ✅ Contains detailed questline information`);
      } else if (order.service.includes('Silver') || order.service.includes('XB')) {
        console.log(`   ✅ Contains detailed currency information`);
      } else {
        console.log(`   ❌ Generic service name only`);
      }
    });
    
    // Summary
    const detailedOrders = recentOrders.filter(order => 
      order.service.includes('Level') && order.service.includes('to') ||
      order.service.includes('Main Questline (') ||
      order.service.includes('Silver') || order.service.includes('XB')
    );
    
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 SUMMARY:`);
    console.log(`   Total recent orders: ${recentOrders.length}`);
    console.log(`   Orders with detailed info: ${detailedOrders.length}`);
    console.log(`   Orders with generic info: ${recentOrders.length - detailedOrders.length}`);
    
    if (detailedOrders.length === 0) {
      console.log('\n🔍 CONCLUSION: All recent orders have generic service names.');
      console.log('   This suggests either:');
      console.log('   1. Orders were created before serviceDetails implementation');
      console.log('   2. Frontend is not sending serviceDetails correctly');
      console.log('   3. There\'s an issue in the payment flow');
    } else {
      console.log('\n✅ CONCLUSION: Some orders have detailed information!');
      console.log('   The serviceDetails functionality is working for some orders.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();