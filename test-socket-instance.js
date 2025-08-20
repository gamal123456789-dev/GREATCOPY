const { getSocketIO, setSocketIO } = require('./lib/socket-cjs');

console.log('🔍 Testing Socket.IO instance availability...');

// Check current state
const currentInstance = getSocketIO();
console.log('📊 Current Socket.IO instance:', {
  exists: !!currentInstance,
  type: typeof currentInstance,
  hasEmit: !!(currentInstance && currentInstance.emit),
  hasTo: !!(currentInstance && currentInstance.to),
  globalExists: !!global.socketIOInstance
});

if (currentInstance) {
  console.log('✅ Socket.IO instance is available');
  console.log('🏠 Current rooms:', Array.from(currentInstance.sockets.adapter.rooms.keys()));
  console.log('👥 Connected sockets:', currentInstance.sockets.sockets.size);
} else {
  console.log('❌ Socket.IO instance is NOT available');
  console.log('🔍 Global instance check:', !!global.socketIOInstance);
}

// Test notification sending
console.log('\n🧪 Testing notification sending...');
const { sendDatabaseNotification } = require('./services/databaseNotificationService');

const testData = {
  userId: 'test_socket_diagnostic_' + Date.now(),
  orderId: 'test_order_diagnostic_' + Date.now(),
  customerName: 'Socket Diagnostic Test',
  game: 'Diagnostic Game',
  service: 'Diagnostic Service',
  price: 0.01,
  status: 'pending',
  paymentMethod: 'Diagnostic Payment',
  timestamp: new Date().toISOString(),
  customerEmail: 'diagnostic@example.com'
};

sendDatabaseNotification('payment-confirmed', testData)
  .then(() => {
    console.log('✅ Diagnostic notification test completed');
  })
  .catch((error) => {
    console.error('❌ Diagnostic notification test failed:', error);
  });