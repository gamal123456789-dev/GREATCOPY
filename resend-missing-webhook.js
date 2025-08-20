require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resendMissingWebhook() {
  try {
    const orderId = 'cm_order_1755507139724_lfqw076dy';
    
    console.log('🔄 Resending webhook for missing notification...');
    console.log('Order ID:', orderId);
    console.log('============================================');
    
    // Webhook data from logs
    const webhookData = {
      type: 'payment',
      uuid: '6b164b6b-c9ab-4845-bfe2-7adceceec015',
      order_id: orderId,
      amount: '0.56000000',
      payment_amount: '0.55000000',
      payment_amount_usd: '0.55',
      merchant_amount: '0.53900000',
      commission: '0.01100000',
      is_final: true,
      status: 'paid',
      from: null,
      wallet_address_uuid: null,
      network: 'bsc',
      currency: 'USD',
      payer_currency: 'USDT',
      payer_amount: '0.55000000',
      payer_amount_exchange_rate: '1.00090877',
      additional_data: JSON.stringify({
        user_id: '7d14fc11-a0bf-449f-97af-6c3e9faa8841',
        game: 'Black Desert Online',
        service: 'Power Leveling',
        customer_email: 'gamalkhaled981@gmail.com'
      }),
      transfer_id: '1bca27a2-6918-4230-8e98-1f84d2751a90'
    };
    
    // Generate signature
    const crypto = require('crypto');
    const apiKey = process.env.CRYPTOMUS_API_KEY || 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
    const dataString = Buffer.from(JSON.stringify(webhookData)).toString('base64');
    const signature = crypto.createHash('md5').update(dataString + apiKey).digest('hex');
    
    console.log('📤 Sending webhook to localhost...');
    
    const response = await axios.post('http://localhost:3000/api/pay/cryptomus/webhook', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'sign': signature
      },
      timeout: 10000
    });
    
    console.log('✅ Webhook response:', response.status, response.data);
    
    // Wait a moment for processing
    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check notifications after webhook
    const notifications = await prisma.notification.findMany({
      where: {
        userId: '7d14fc11-a0bf-449f-97af-6c3e9faa8841',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Last minute
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n📊 Results:');
    console.log('New notifications:', notifications.length);
    
    if (notifications.length > 0) {
      console.log('✅ Notification sent successfully!');
      notifications.forEach((n, index) => {
        console.log(`${index + 1}. Type: ${n.type}`);
        console.log(`   Title: ${n.title}`);
        console.log(`   Created: ${n.createdAt}`);
      });
    } else {
      console.log('❌ No new notifications found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

resendMissingWebhook();