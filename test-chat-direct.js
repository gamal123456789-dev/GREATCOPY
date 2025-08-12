const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5200';
const TEST_ORDER_ID = 'test-order-123';

// Create test files of different sizes
function createTestFile(sizeInMB, filename) {
  const sizeInBytes = sizeInMB * 1024 * 1024;
  const buffer = Buffer.alloc(sizeInBytes);
  
  // Fill with some pattern to make it look like image data
  for (let i = 0; i < sizeInBytes; i++) {
    buffer[i] = i % 256;
  }
  
  fs.writeFileSync(filename, buffer);
  console.log(`✅ Created ${sizeInMB}MB test file: ${filename}`);
  return filename;
}

// Test chat image upload
async function testChatImageUpload(filePath, message = '') {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`\n🧪 Testing chat upload: ${path.basename(filePath)} (${fileSizeMB}MB)`);
    
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filePath));
    if (message) {
      formData.append('message', message);
    }
    
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/api/chat/${TEST_ORDER_ID}`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000 // 60 seconds timeout
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`📊 ${fileSizeMB}MB - Status: ${response.status}, Duration: ${duration}ms`);
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ ${fileSizeMB}MB chat upload successful!`);
      if (response.data.imageUrl) {
        console.log(`🖼️ Image URL: ${response.data.imageUrl}`);
      }
      if (response.data.id) {
        console.log(`🆔 Message ID: ${response.data.id}`);
      }
      return true;
    } else {
      console.log(`❌ ${fileSizeMB}MB chat upload failed!`);
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    const fileSizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
    console.log(`❌ ${fileSizeMB}MB chat upload error:`, error.message);
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📝 Response:`, error.response.data);
    }
    return false;
  }
}

// Main test function
async function runChatUploadTests() {
  console.log('🚀 Starting Chat Image Upload Tests...');
  console.log(`🎯 Target: ${BASE_URL}/api/chat/${TEST_ORDER_ID}`);
  
  const testSizes = [0.5, 1, 1.5, 2, 5]; // MB
  const testFiles = [];
  
  // Create test files
  console.log('\n📁 Creating test files...');
  for (const size of testSizes) {
    const filename = `test-chat-${size}MB.png`;
    createTestFile(size, filename);
    testFiles.push(filename);
  }
  
  // Test each file
  console.log('\n🧪 Testing chat uploads...');
  let successCount = 0;
  
  for (const file of testFiles) {
    const success = await testChatImageUpload(file, `Test message with ${path.basename(file)}`);
    if (success) successCount++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Cleanup test files
  console.log('\n🧹 Cleaning up test files...');
  for (const file of testFiles) {
    try {
      fs.unlinkSync(file);
      console.log(`🗑️ Deleted: ${file}`);
    } catch (error) {
      console.log(`⚠️ Could not delete: ${file}`);
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Successful uploads: ${successCount}/${testFiles.length}`);
  console.log(`❌ Failed uploads: ${testFiles.length - successCount}/${testFiles.length}`);
  
  if (successCount === testFiles.length) {
    console.log('🎉 All chat upload tests passed!');
  } else {
    console.log('⚠️ Some chat upload tests failed.');
  }
}

// Run the tests
runChatUploadTests().catch(console.error);