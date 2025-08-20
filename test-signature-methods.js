const crypto = require('crypto');

function testSignatureMethods() {
  console.log('🔍 Testing different signature calculation methods...');
  
  const testData = {
    "type": "payment",
    "uuid": "57e2ae53-f78b-4e8b-a0d6-bdbe033240b6",
    "order_id": "cm_order_1755432978430_uyt2emv8w",
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
    "payer_amount_exchange_rate": "1.00048341",
    "additional_data": "{\"user_id\":\"7d14fc11-a0bf-449f-97af-6c3e9faa8841\",\"game\":\"Black Desert Online\",\"service\":\"Power Leveling\",\"customer_email\":\"gamalkhaled981@gmail.com\"}",
    "transfer_id": "fb9fa611-e59b-4d3c-9433-442a5a16b8cb",
    "sign": "6488c59fcb499680a403d745e1b96488"
  };
  
  const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
  const receivedSign = testData.sign;
  
  console.log('📋 Received signature:', receivedSign);
  
  // Method 1: Current method (base64 + apiKey)
  const dataString1 = Buffer.from(JSON.stringify(testData)).toString('base64');
  const expectedSign1 = crypto
    .createHash('md5')
    .update(dataString1 + apiKey)
    .digest('hex');
  console.log('\n🔐 Method 1 (current): base64(JSON) + apiKey');
  console.log('  Data string length:', dataString1.length);
  console.log('  Expected sign:', expectedSign1);
  console.log('  Match:', receivedSign === expectedSign1);
  
  // Method 2: Without sign field in data
  const dataWithoutSign = { ...testData };
  delete dataWithoutSign.sign;
  const dataString2 = Buffer.from(JSON.stringify(dataWithoutSign)).toString('base64');
  const expectedSign2 = crypto
    .createHash('md5')
    .update(dataString2 + apiKey)
    .digest('hex');
  console.log('\n🔐 Method 2: base64(JSON without sign) + apiKey');
  console.log('  Data string length:', dataString2.length);
  console.log('  Expected sign:', expectedSign2);
  console.log('  Match:', receivedSign === expectedSign2);
  
  // Method 3: Direct JSON string + apiKey
  const dataString3 = JSON.stringify(testData);
  const expectedSign3 = crypto
    .createHash('md5')
    .update(dataString3 + apiKey)
    .digest('hex');
  console.log('\n🔐 Method 3: JSON string + apiKey');
  console.log('  Expected sign:', expectedSign3);
  console.log('  Match:', receivedSign === expectedSign3);
  
  // Method 4: Direct JSON string without sign + apiKey
  const dataString4 = JSON.stringify(dataWithoutSign);
  const expectedSign4 = crypto
    .createHash('md5')
    .update(dataString4 + apiKey)
    .digest('hex');
  console.log('\n🔐 Method 4: JSON string without sign + apiKey');
  console.log('  Expected sign:', expectedSign4);
  console.log('  Match:', receivedSign === expectedSign4);
  
  // Method 5: Sorted keys
  const sortedData = JSON.stringify(dataWithoutSign, Object.keys(dataWithoutSign).sort());
  const dataString5 = Buffer.from(sortedData).toString('base64');
  const expectedSign5 = crypto
    .createHash('md5')
    .update(dataString5 + apiKey)
    .digest('hex');
  console.log('\n🔐 Method 5: base64(sorted JSON without sign) + apiKey');
  console.log('  Expected sign:', expectedSign5);
  console.log('  Match:', receivedSign === expectedSign5);
  
  console.log('\n🎯 Testing complete. If none match, signature verification needs to be disabled or fixed.');
}

testSignatureMethods();