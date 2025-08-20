const { getSocketIO, setSocketIO } = require('./lib/socket-cjs');

console.log('🔍 Testing Socket.IO instance availability...');

// Test 1: Check if Socket.IO instance is available
console.log('\n1️⃣ Checking current Socket.IO instance:');
const currentInstance = getSocketIO();
console.log('Current instance:', !!currentInstance);

// Test 2: Check global state
console.log('\n2️⃣ Checking global state:');
console.log('Global socketIOInstance:', !!global.socketIOInstance);

// Test 3: Wait a bit and check again (in case server is still starting)
console.log('\n3️⃣ Waiting 3 seconds and checking again...');
setTimeout(() => {
  const instanceAfterWait = getSocketIO();
  console.log('Instance after wait:', !!instanceAfterWait);
  console.log('Global after wait:', !!global.socketIOInstance);
  
  if (instanceAfterWait) {
    console.log('✅ Socket.IO instance is available!');
    console.log('Instance details:', {
      hasEmit: !!instanceAfterWait.emit,
      hasTo: !!instanceAfterWait.to,
      socketsCount: instanceAfterWait.sockets?.sockets?.size || 0
    });
  } else {
    console.log('❌ Socket.IO instance is still not available');
    console.log('This suggests setSocketIO was never called or failed');
  }
  
  process.exit(0);
}, 3000);

console.log('\n⏳ Waiting for server to initialize...');