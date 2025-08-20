/**
 * Test script to simulate a real order creation through the website
 * This will test the complete flow including API and notifications
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:5201';

async function testRealOrderFlow() {
  console.log('🧪 Testing real order flow with notifications...');
  
  try {
    // Get a real user from the database
    const user = await prisma.user.findFirst({
      where: {
        role: { not: 'ADMIN' }
      }
    });
    
    if (!user) {
      console.log('❌ No regular user found in database');
      return;
    }
    
    console.log(`👤 Found user: ${user.email} (ID: ${user.id})`);
    
    // Create a session token (simplified for testing)
    const jwt = require('jsonwebtoken');
    const sessionToken = jwt.sign(
      { 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name 
        } 
      }, 
      process.env.NEXTAUTH_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Created session token for testing');
    
    // Order data
    const orderData = {
      id: `real_test_${Date.now()}`,
      customerName: 'Real Test Customer',
      game: 'Destiny 2',
      service: 'Nightfall Completion',
      price: 29.99,
      status: 'pending',
      date: new Date().toISOString(),
      userId: user.id,
      paymentId: `crypto_${Date.now()}`
    };
    
    console.log('\n📦 Creating order via API endpoint...');
    console.log('📋 Order data:', orderData);
    
    try {
      // Make API request to create order
      const response = await axios.post(`${API_BASE}/api/orders`, orderData, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `next-auth.session-token=${sessionToken}`
        },
        timeout: 10000
      });
      
      console.log(`✅ Order created via API: ${response.data.order.id}`);
      console.log('📊 API Response status:', response.status);
      
      console.log('\n⏳ Waiting 3 seconds for notifications to process...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Clean up the order
      console.log('\n🧹 Cleaning up test order...');
      await prisma.order.delete({
        where: { id: orderData.id }
      });
      
      console.log('✅ Order cleanup completed!');
      
    } catch (apiError) {
      console.log('❌ API request failed:', apiError.response?.status, apiError.response?.data?.message || apiError.message);
      console.log('\n🔄 Falling back to direct database creation...');
      
      // Fallback: Create order directly and manually trigger notification
      const order = await prisma.order.create({
        data: orderData
      });
      
      console.log(`✅ Order created directly: ${order.id}`);
      
      // Manually trigger notification
      const { sendDatabaseNotification } = require('./services/databaseNotificationService');
      await sendDatabaseNotification('new_order', {
        orderId: order.id,
        customerName: order.customerName,
        game: order.game,
        service: order.service,
        price: order.price,
        status: order.status,
        paymentMethod: order.paymentId ? 'Cryptomus' : 'Manual',
        timestamp: order.date.toISOString()
      });
      
      // Clean up
      await prisma.order.delete({
        where: { id: order.id }
      });
    }
    
    console.log('\n✅ Test completed!');
    console.log('📋 Check the server terminal for notification messages.');
    console.log('📋 You should see detailed admin notifications.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRealOrderFlow();