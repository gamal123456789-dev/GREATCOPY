// Debug script to test image upload directly
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');

async function testUpload() {
    console.log('🔍 Testing image upload...');
    
    // Create a test image file (1.5MB)
    const testImagePath = path.join(__dirname, 'test-image.txt');
    const testContent = 'A'.repeat(1.5 * 1024 * 1024); // 1.5MB of 'A' characters
    
    try {
        // Create test file
        fs.writeFileSync(testImagePath, testContent);
        console.log(`✅ Created test file: ${testImagePath} (${(testContent.length / 1024 / 1024).toFixed(2)} MB)`);
        
        // Prepare form data
        const form = new FormData();
        form.append('image', fs.createReadStream(testImagePath), {
            filename: 'test-image.txt',
            contentType: 'text/plain'
        });
        
        console.log('📤 Uploading to /api/upload-image...');
        
        // Make request
        const response = await axios.post('http://localhost:5200/api/upload-image', form, {
            headers: {
                ...form.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        
        console.log(`📊 Response status: ${response.status}`);
        console.log(`📊 Response headers:`, response.headers);
        
        console.log(`📊 Response body:`, response.data);
        
        if (response.status === 200) {
            console.log('✅ Upload successful!');
        } else {
            console.log('❌ Upload failed!');
        }
        
    } catch (error) {
        console.error('❌ Error during upload:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        // Clean up test file
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
            console.log('🧹 Cleaned up test file');
        }
    }
}

// Test with different sizes
async function testMultipleSizes() {
    const sizes = [
        { name: '500KB', size: 0.5 * 1024 * 1024 },
        { name: '1MB', size: 1 * 1024 * 1024 },
        { name: '1.5MB', size: 1.5 * 1024 * 1024 },
        { name: '2MB', size: 2 * 1024 * 1024 },
        { name: '5MB', size: 5 * 1024 * 1024 }
    ];
    
    for (const testSize of sizes) {
        console.log(`\n🧪 Testing ${testSize.name} upload...`);
        
        const testImagePath = path.join(__dirname, `test-${testSize.name}.txt`);
        const testContent = 'A'.repeat(Math.floor(testSize.size));
        
        try {
            // Create test file
            fs.writeFileSync(testImagePath, testContent);
            console.log(`✅ Created ${testSize.name} test file`);
            
            // Prepare form data
            const form = new FormData();
            form.append('image', fs.createReadStream(testImagePath), {
                filename: `test-${testSize.name}.txt`,
                contentType: 'text/plain'
            });
            
            const startTime = Date.now();
            
            // Make request
            const response = await axios.post('http://localhost:5200/api/upload-image', form, {
                headers: {
                    ...form.getHeaders()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`📊 ${testSize.name} - Status: ${response.status}, Duration: ${duration}ms`);
            
            if (response.status === 200) {
                console.log(`✅ ${testSize.name} upload successful! File: ${response.data.imageUrl}`);
            } else {
                console.log(`❌ ${testSize.name} upload failed: ${response.data}`);
            }
            
        } catch (error) {
            console.error(`❌ ${testSize.name} error:`, error.message);
        } finally {
            // Clean up test file
            if (fs.existsSync(testImagePath)) {
                fs.unlinkSync(testImagePath);
            }
        }
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

if (require.main === module) {
    console.log('🚀 Starting upload tests...');
    testMultipleSizes().then(() => {
        console.log('\n✅ All tests completed!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testUpload, testMultipleSizes };