const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');

// Function to create test image files
function createTestImage(sizeInMB, filename) {
    const sizeInBytes = Math.floor(sizeInMB * 1024 * 1024);
    // Create a simple PNG-like header followed by data
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const remainingSize = sizeInBytes - pngHeader.length;
    const data = Buffer.alloc(remainingSize, 0xFF); // Fill with 0xFF bytes
    const fullBuffer = Buffer.concat([pngHeader, data]);
    
    fs.writeFileSync(filename, fullBuffer);
    return filename;
}

// Test upload function
async function testUploadImage(filename, sizeInMB) {
    console.log(`\n🧪 Testing upload: ${filename} (${sizeInMB.toFixed(2)}MB)`);
    
    try {
        const form = new FormData();
        form.append('image', fs.createReadStream(filename), {
            filename: path.basename(filename),
            contentType: 'image/png'
        });
        
        const startTime = Date.now();
        
        const response = await axios.post('http://localhost:5200/api/upload-image', form, {
            headers: {
                ...form.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000 // 60 second timeout
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ ${sizeInMB.toFixed(2)}MB upload successful!`);
        console.log(`📊 Status: ${response.status}`);
        console.log(`⏱️ Duration: ${duration}ms`);
        console.log(`📁 Image URL: ${response.data.imageUrl}`);
        console.log(`📏 File size: ${(response.data.size / 1024 / 1024).toFixed(2)}MB`);
        
        return { success: true, duration, size: response.data.size };
        
    } catch (error) {
        console.log(`❌ ${sizeInMB.toFixed(2)}MB upload error: ${error.message}`);
        if (error.response) {
            console.log(`📊 Status: ${error.response.status}`);
            console.log(`📝 Response:`, error.response.data);
        }
        return { success: false, error: error.message };
    }
}

// Main test function
async function runUploadTests() {
    console.log('🚀 Starting Upload-Image API Tests...');
    console.log('🎯 Target: http://localhost:5200/api/upload-image\n');
    
    const testSizes = [
        { name: '0.5MB', size: 0.5 },
        { name: '1MB', size: 1.0 },
        { name: '1.5MB', size: 1.5 },
        { name: '2MB', size: 2.0 },
        { name: '5MB', size: 5.0 }
    ];
    
    console.log('📁 Creating test files...');
    const testFiles = [];
    
    for (const test of testSizes) {
        const filename = `test-upload-${test.name}.png`;
        createTestImage(test.size, filename);
        testFiles.push({ filename, size: test.size, name: test.name });
        console.log(`✅ Created ${test.name} test file: ${filename}`);
    }
    
    console.log('\n🧪 Testing uploads...');
    
    const results = [];
    
    for (const testFile of testFiles) {
        const result = await testUploadImage(testFile.filename, testFile.size);
        results.push({ ...result, name: testFile.name, size: testFile.size });
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🧹 Cleaning up test files...');
    for (const testFile of testFiles) {
        if (fs.existsSync(testFile.filename)) {
            fs.unlinkSync(testFile.filename);
            console.log(`🗑️ Deleted: ${testFile.filename}`);
        }
    }
    
    console.log('\n📊 Test Summary:');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful uploads: ${successful.length}/${results.length}`);
    console.log(`❌ Failed uploads: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
        console.log('\n✅ Successful uploads:');
        successful.forEach(result => {
            console.log(`  - ${result.name}: ${result.duration}ms, ${(result.size / 1024 / 1024).toFixed(2)}MB`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ Failed uploads:');
        failed.forEach(result => {
            console.log(`  - ${result.name}: ${result.error}`);
        });
        console.log('⚠️ Some upload tests failed.');
    } else {
        console.log('\n🎉 All upload tests passed!');
    }
}

// Run the tests
runUploadTests().catch(console.error);