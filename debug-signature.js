const crypto = require('crypto');

// Debug signature calculation
function debugSignature() {
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  
  const webhookData = {
    "type": "payment",
    "uuid": "fd2d3c34-09bc-40b6-b343-3ef26afb0c1e",
    "order_id": "cm_order_1755524167337_vxqrmvujz",
    "amount": "0.56000000",
    "payment_amount": "0.55000000",
    "payment_amount_usd": "0.55",
    "merchant_amount": "0.53900000",
    "commission": "0.01100000",
    "is_final": true,
    "status": "paid",
    "from": null,
    "wallet_address_uuid": null,
    "network": "bsc",
    "currency": "USD",
    "payer_currency": "USDT",
    "payer_amount": "0.55000000",
    "payer_amount_exchange_rate": "1.00098768",
    "additional_data": "{\"user_id\":\"7d14fc11-a0bf-449f-97af-6c3e9faa8841\",\"game\":\"Black Desert Online\",\"service\":\"Power Leveling\",\"customer_email\":\"gamalkhaled981@gmail.com\"}",
    "transfer_id": "2230a287-6aa8-47cd-a1df-e8da7c36d62a"
  };
  
  const receivedSign = "fbd1386c730d3323a465fd065b176b10";
  
  console.log('🔍 Debugging signature calculation...');
  console.log('Received signature:', receivedSign);
  
  // Method 1: Current implementation (base64 + md5)
  const dataString1 = Buffer.from(JSON.stringify(webhookData)).toString('base64');
  const expectedSign1 = crypto.createHash('md5').update(dataString1 + apiKey).digest('hex');
  console.log('Method 1 (base64+md5):', expectedSign1);
  
  // Method 2: Direct JSON + md5
  const dataString2 = JSON.stringify(webhookData);
  const expectedSign2 = crypto.createHash('md5').update(dataString2 + apiKey).digest('hex');
  console.log('Method 2 (json+md5):', expectedSign2);
  
  // Method 3: Sorted keys + md5
  const sortedData = {};
  Object.keys(webhookData).sort().forEach(key => {
    sortedData[key] = webhookData[key];
  });
  const dataString3 = JSON.stringify(sortedData);
  const expectedSign3 = crypto.createHash('md5').update(dataString3 + apiKey).digest('hex');
  console.log('Method 3 (sorted+md5):', expectedSign3);
  
  // Method 4: Query string format
  const queryString = Object.keys(webhookData)
    .sort()
    .map(key => `${key}=${webhookData[key]}`)
    .join('&');
  const expectedSign4 = crypto.createHash('md5').update(queryString + apiKey).digest('hex');
  console.log('Method 4 (query+md5):', expectedSign4);
  
  // Method 5: Just API key + data
  const expectedSign5 = crypto.createHash('md5').update(apiKey + JSON.stringify(webhookData)).digest('hex');
  console.log('Method 5 (key+json):', expectedSign5);
}

debugSignature();