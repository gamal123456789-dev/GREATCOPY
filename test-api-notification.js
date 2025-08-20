/**
 * Test script to create an order via API and check notifications
 * This simulates a real order creation through the API endpoint
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:5201';

async function testApiNotification() {
  console.log('🧪 Testing API notification system...');
  
  try {
    // First, get a real user from the database
    const user = await prisma.user.findFirst({
      where: {
        role: { not: 'ADMIN' }
      }
    });
    
    if (!user) {
      console.log('❌ No regular user found in database');
      return;
    }
    
    console.log(`👤 Using user: ${user.email} (ID: ${user.id})`);
    
    // Create order data
    const orderData = {
      id: `api_test_${Date.now()}`,
      customerName: 'API Test Customer',
      game: 'Destiny 2',
      service: 'Raid Completion',
      price: 35.99,
      status: 'pending',
      date: new Date().toISOString(),
      userId: user.id,
      paymentId: null
    };
    
    console.log('\n📦 Creating order via direct database call...');
    console.log('📋 Order data:', orderData);
    
    // Create order directly in database to trigger middleware
    const order = await prisma.order.create({
      data: orderData
    });
    
    console.log(`✅ Order created: ${order.id}`);
    console.log('\n⏳ Waiting 2 seconds for notifications to process...');
    
    // Wait for notifications to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n🧹 Cleaning up test order...');
    await prisma.order.delete({
      where: { id: order.id }
    });
    
    console.log('✅ Test completed!');
    console.log('\n📋 Check the server terminal for notification messages.');
    console.log('📋 You should see admin notifications in the server logs.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testApiNotification();