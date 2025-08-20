/**
 * Test Real Admin Notification via Webhook
 * Sends a real webhook to test admin notifications on gear-score.com
 */

const axios = require('axios');
const crypto = require('crypto');

// Webhook configuration
const WEBHOOK_URL = 'https://gear-score.com/api/pay/cryptomus/webhook';
const MERCHANT_UUID = process.env.CRYPTOMUS_MERCHANT_UUID;
const API_KEY = process.env.CRYPTOMUS_API_KEY;

function generateWebhookSignature(data) {
  const jsonString = JSON.stringify(data);
  const hash = crypto.createHash('md5');
  hash.update(jsonString + API_KEY);
  return hash.digest('hex');
}

async function sendTestWebhook() {
  console.log('🚀 Testing Real Admin Notification via Webhook...');
  console.log('🌐 Target URL:', WEBHOOK_URL);
  
  // Create test webhook payload
  const webhookData = {
    type: 'payment',
    uuid: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    order_id: `test_admin_notification_${Date.now()}`,
    amount: '5.00000000',
    payment_amount: '5.00000000',
    payment_amount_usd: '5.00',
    merchant_amount: '4.90000000',
    commission: '0.10000000',
    is_final: true,
    status: 'paid',
    from: null,
    wallet_address_uuid: null,
    network: 'bsc',
    currency: 'USD',
    payer_currency: 'USDT',
    payer_amount: '5.00000000',
    payer_amount_exchange_rate: '1.00000000',
    additional_data: JSON.stringify({
      user_id: 'test-user-admin-notification',
      game: 'Test Game for Admin',
      service: 'Admin Notification Test',
      customer_email: 'admin-test@gear-score.com'
    }),
    transfer_id: `transfer-${Date.now()}`,
    sign: '' // Will be calculated below
  };
  
  // Generate signature
  const tempData = { ...webhookData };
  delete tempData.sign;
  webhookData.sign = generateWebhookSignature(tempData);
  
  console.log('📤 Sending webhook with data:');
  console.log('   - Order ID:', webhookData.order_id);
  console.log('   - Amount:', webhookData.amount);
  console.log('   - Status:', webhookData.status);
  console.log('   - Game:', JSON.parse(webhookData.additional_data).game);
  
  try {
    const response = await axios.post(WEBHOOK_URL, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cryptomus-Webhook-Test'
      },
      timeout: 30000
    });
    
    console.log('✅ Webhook sent successfully!');
    console.log('📊 Response status:', response.status);
    console.log('📄 Response data:', response.data);
    
    console.log('\n🔍 What should happen now:');
    console.log('1. ✅ Order should be created/updated in database');
    console.log('2. ✅ Admin notification should be logged to admin-notifications.log');
    console.log('3. 🔔 Admin should receive real-time notification (if connected to Socket.IO)');
    console.log('4. 🌐 Admin should receive browser notification (if supported)');
    
    console.log('\n📋 To verify:');
    console.log('- Check admin-notifications.log: tail -5 logs/admin-notifications.log');
    console.log('- Check webhook-debug.log: tail -5 logs/webhook-debug.log');
    console.log('- Open admin panel in browser and check for notifications');
    
  } catch (error) {
    console.error('❌ Error sending webhook:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
  }
}

// Also test the notification logs
async function checkNotificationLogs() {
  console.log('\n📋 Checking recent notification logs...');
  
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    console.log('\n📄 Recent admin notifications:');
    const adminLogs = await execAsync('tail -3 logs/admin-notifications.log 2>/dev/null || echo "No admin notification logs found"');
    console.log(adminLogs.stdout);
    
    console.log('\n📄 Recent webhook debug logs:');
    const webhookLogs = await execAsync('tail -3 logs/webhook-debug.log 2>/dev/null || echo "No webhook debug logs found"');
    console.log(webhookLogs.stdout);
    
  } catch (error) {
    console.error('❌ Error checking logs:', error.message);
  }
}

// Run the test
async function runTest() {
  console.log('🎯 Testing Admin Notifications on gear-score.com');
  console.log('=' .repeat(60));
  
  await checkNotificationLogs();
  await sendTestWebhook();
  
  // Wait a bit then check logs again
  setTimeout(async () => {
    console.log('\n🔍 Checking logs after webhook...');
    await checkNotificationLogs();
  }, 3000);
}

runTest().catch(console.error);