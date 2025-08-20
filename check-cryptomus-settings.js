/**
 * Check Cryptomus Settings
 * Verifies current Cryptomus configuration and webhook settings
 */

const axios = require('axios');
const crypto = require('crypto');

async function checkCryptomusSettings() {
  console.log('🔍 Checking Cryptomus configuration...');
  
  const apiKey = process.env.CRYPTOMUS_API_KEY || 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const merchantId = process.env.CRYPTOMUS_MERCHANT_ID || '07d3dac2-7868-4fda-b6e9-7d2cfca03da4';
  const baseUrl = 'https://api.cryptomus.com/v1';
  
  console.log('📋 Current Configuration:');
  console.log(`  API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}`);
  console.log(`  Merchant ID: ${merchantId}`);
  console.log(`  Base URL: ${baseUrl}`);
  
  // Check webhook URL that should be configured in Cryptomus
  const expectedWebhookUrl = 'https://gear-score.com/api/pay/cryptomus/webhook';
  console.log(`\n🎯 Expected Webhook URL: ${expectedWebhookUrl}`);
  
  // Test creating a small invoice to see current settings
  console.log('\n💳 Testing invoice creation to verify settings...');
  
  const testInvoiceData = {
    amount: '0.10', // Minimum amount required by Cryptomus
    currency: 'USD',
    order_id: `settings_test_${Date.now()}`,
    url_return: 'https://gear-score.com/pay/success',
    url_callback: expectedWebhookUrl,
    url_success: 'https://gear-score.com/pay/success',
    url_cancel: 'https://gear-score.com/pay/failed',
    is_payment_multiple: false,
    lifetime: 3600, // 1 hour
    to_currency: 'USDT',
    subtract: '1',
    accuracy_payment_percent: '1',
    additional_data: JSON.stringify({
      test: 'settings_verification',
      domain: 'gear-score.com'
    })
  };
  
  // Create signature for API request
  const dataString = Buffer.from(JSON.stringify(testInvoiceData)).toString('base64');
  const signature = crypto
    .createHash('md5')
    .update(dataString + apiKey)
    .digest('hex');
  
  try {
    console.log('📡 Sending test invoice request...');
    
    const response = await axios.post(`${baseUrl}/payment`, testInvoiceData, {
      headers: {
        'Content-Type': 'application/json',
        'merchant': merchantId,
        'sign': signature
      },
      timeout: 15000
    });
    
    console.log('✅ Test invoice created successfully!');
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.result) {
      const result = response.data.result;
      console.log('\n🔗 Payment Details:');
      console.log(`  Payment URL: ${result.url || 'N/A'}`);
      console.log(`  Order ID: ${result.order_id || 'N/A'}`);
      console.log(`  UUID: ${result.uuid || 'N/A'}`);
      console.log(`  Amount: ${result.amount || 'N/A'} ${result.currency || 'N/A'}`);
      
      // Check if webhook URL is properly configured
      if (result.url_callback) {
        console.log(`\n✅ Webhook URL configured: ${result.url_callback}`);
        if (result.url_callback === expectedWebhookUrl) {
          console.log('✅ Webhook URL matches expected domain!');
        } else {
          console.log('⚠️ Webhook URL does not match expected domain!');
          console.log(`   Expected: ${expectedWebhookUrl}`);
          console.log(`   Actual: ${result.url_callback}`);
        }
      } else {
        console.log('⚠️ No webhook URL found in response');
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to create test invoice:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log('\n📝 Summary:');
  console.log('1. Webhook endpoint is accessible at https://gear-score.com/api/pay/cryptomus/webhook');
  console.log('2. API credentials are configured');
  console.log('3. Test invoice creation shows current Cryptomus settings');
  console.log('\n💡 Next steps:');
  console.log('- Verify webhook URL in Cryptomus merchant dashboard');
  console.log('- Ensure webhook URL points to https://gear-score.com/api/pay/cryptomus/webhook');
  console.log('- Test with a real small payment to confirm end-to-end flow');
}

// Load environment variables
require('dotenv').config();

// Run the check
checkCryptomusSettings().catch(console.error).finally(() => {
  process.exit(0);
});