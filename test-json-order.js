// Test JSON key ordering
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

console.log('Original JSON:');
console.log(JSON.stringify(webhookData));

// Simulate what happens in webhook handler
const bodyForSignature = { ...webhookData };
delete bodyForSignature.sign;

console.log('\nAfter removing sign:');
console.log(JSON.stringify(bodyForSignature));

// Test if they match
const match = JSON.stringify(webhookData) === JSON.stringify(bodyForSignature);
console.log('\nDo they match?', match);