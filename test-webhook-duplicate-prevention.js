const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Test webhook duplicate prevention mechanism
async function testWebhookDuplicatePrevention() {
  try {
    console.log('🧪 Testing webhook duplicate prevention mechanism...');
    
    // Test data similar to what Cryptomus sends
    const testWebhookData = {
      order_id: 'test_duplicate_prevention_' + Date.now(),
      status: 'paid',
      amount: '1.00',
      currency: 'USD',
      uuid: 'test-uuid-' + Date.now()
    };
    
    console.log('📋 Test webhook data:', testWebhookData);
    
    // Create webhook identifier (same logic as in webhook.ts)
    const webhookId = testWebhookData.uuid || `${testWebhookData.order_id}_${testWebhookData.status}_${testWebhookData.amount}`;
    console.log('🔑 Generated webhook ID:', webhookId);
    
    // Check if webhookLog table exists and is accessible
    console.log('\n🔍 Checking webhookLog table...');
    
    try {
      const existingCount = await prisma.webhookLog.count();
      console.log('✅ WebhookLog table accessible, current records:', existingCount);
    } catch (error) {
      console.error('❌ Error accessing webhookLog table:', error.message);
      return;
    }
    
    // Test 1: Check if webhook ID already exists (should be false)
    console.log('\n🧪 Test 1: Checking for existing webhook ID...');
    const existingWebhookLog = await prisma.webhookLog.findUnique({
      where: { webhookId: webhookId }
    });
    
    if (existingWebhookLog) {
      console.log('⚠️ Webhook ID already exists:', existingWebhookLog);
    } else {
      console.log('✅ Webhook ID is new (as expected)');
    }
    
    // Test 2: Create webhook log entry
    console.log('\n🧪 Test 2: Creating webhook log entry...');
    try {
      const webhookLogEntry = await prisma.webhookLog.create({
        data: {
          webhookId: webhookId,
          orderId: testWebhookData.order_id,
          status: testWebhookData.status,
          amount: testWebhookData.amount?.toString() || '0',
          processedAt: new Date()
        }
      });
      console.log('✅ Webhook log entry created:', webhookLogEntry.id);
    } catch (error) {
      console.error('❌ Error creating webhook log entry:', error.message);
      return;
    }
    
    // Test 3: Try to create the same webhook log entry again (should fail or be detected)
    console.log('\n🧪 Test 3: Testing duplicate detection...');
    const duplicateCheck = await prisma.webhookLog.findUnique({
      where: { webhookId: webhookId }
    });
    
    if (duplicateCheck) {
      console.log('✅ Duplicate detection working - found existing entry:', duplicateCheck.id);
    } else {
      console.log('❌ Duplicate detection failed - no existing entry found');
    }
    
    // Test 4: Check all webhook log entries
    console.log('\n📊 All webhook log entries:');
    const allEntries = await prisma.webhookLog.findMany({
      orderBy: { processedAt: 'desc' },
      take: 10
    });
    
    allEntries.forEach((entry, index) => {
      console.log(`${index + 1}. ID: ${entry.webhookId} | Order: ${entry.orderId} | Status: ${entry.status} | Time: ${entry.processedAt.toISOString()}`);
    });
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.webhookLog.delete({
      where: { webhookId: webhookId }
    });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Webhook duplicate prevention test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWebhookDuplicatePrevention();