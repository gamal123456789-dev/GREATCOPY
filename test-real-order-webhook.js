/**
 * Test Real Order Webhook
 * Tests webhook for the actual order shown in the screenshots
 */

const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5201';

// Generate webhook signature (matching Cryptomus webhook verification)
function createWebhookSignature(payload) {
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  
  // Convert payload to base64 encoded string (same as webhook handler)
  const dataString = Buffer.from(JSON.stringify(payload)).toString('base64');
  
  // Create MD5 hash of dataString + apiKey (same as webhook handler)
  const signature = crypto
    .createHash('md5')
    .update(dataString + apiKey)
    .digest('hex');
    
  return signature;
}

// Create webhook payload for the real order from screenshots
function createRealOrderWebhookPayload() {
  // Based on the database query, the real order ID is: cm_order_1755343940009_by7rsot2p
  const orderId = 'cm_order_1755343940009_by7rsot2p';
  
  const payload = {
    uuid: `cryptomus_${orderId}`, // Cryptomus payment UUID
    order_id: orderId, // This should match the orderId in payment session
    amount: '0.57', // Amount from screenshot
    payment_amount: '0.57',
    payer_amount: '0.57',
    discount_percent: 0,
    discount: '0.00',
    payer_currency: 'USDT',
    currency: 'USD',
    merchant_amount: '0.56',
    network: 'tron',
    address: 'TRealAddress123',
    txid: 'real_transaction_id_123',
    status: 'paid',
    is_final: true,
    additional_data: JSON.stringify({
      userId: 'real_user_id',
      customerName: 'Real Customer',
      game: 'Black Desert Online',
      service: 'Level 1 to 7 Main Questline (Balenos to Mediah)',
      price: 0.57
    }),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return payload;
}

// Send webhook to our endpoint
async function sendWebhook(payload, signature) {
  try {
    console.log('🔄 Sending webhook for real order to server...');
    console.log('📦 Payload summary:', {
      uuid: payload.uuid,
      order_id: payload.order_id,
      status: payload.status,
      amount: payload.amount
    });
    
    const response = await axios.post(`${BASE_URL}/api/pay/cryptomus/webhook`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      }
    });
    
    console.log('✅ Webhook sent successfully:', response.status);
    console.log('📋 Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error sending webhook:', error.response?.data || error.message);
    console.error('❌ Status:', error.response?.status);
    return false;
  }
}

// Main test function
async function testRealOrderWebhook() {
  console.log('🚀 Testing webhook for real order from screenshots...');
  console.log('🌐 Base URL:', BASE_URL);
  
  try {
    // Create webhook payload for real order
    const payload = createRealOrderWebhookPayload();
    
    // Create signature
    const signature = createWebhookSignature(payload);
    console.log('🔐 Webhook signature created:', signature.substring(0, 10) + '...');
    
    // Send webhook
    const success = await sendWebhook(payload, signature);
    
    if (success) {
      console.log('\n✅ Real order webhook test completed successfully!');
      console.log('📢 Check the admin notification system to see if the notification was received.');
      console.log('🌐 Admin panel: http://localhost:5201/admin-notifications.html');
      console.log('📱 Also check the server logs for notification details.');
    } else {
      console.log('\n❌ Real order webhook test failed!');
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testRealOrderWebhook().catch(console.error);
}

module.exports = { testRealOrderWebhook };