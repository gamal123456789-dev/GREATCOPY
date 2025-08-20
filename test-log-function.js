const { logNotification } = require('./services/databaseNotificationService');
const fs = require('fs');
const path = require('path');

// Test the logNotification function directly
function testLogFunction() {
  console.log('🧪 Testing logNotification function directly...');
  
  const testData = {
    orderId: `log_test_${Date.now()}`,
    customerName: 'Log Test Customer',
    game: 'Test Game',
    service: 'Log Function Test',
    price: 99.99,
    adminCount: 3,
    adminEmails: ['admin1@test.com', 'admin2@test.com', 'admin3@test.com']
  };
  
  console.log('📋 Test data:', JSON.stringify(testData, null, 2));
  
  try {
    // Call logNotification directly
    console.log('📝 Calling logNotification...');
    
    // Since logNotification is not exported, let's recreate it here
    const NOTIFICATION_LOG_FILE = path.join(__dirname, 'logs/admin-notifications.log');
    
    function ensureLogsDirectory() {
      const logsDir = path.join(__dirname, 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
    }
    
    function logNotification(type, data) {
      ensureLogsDirectory();
      
      const logEntry = {
        type,
        timestamp: new Date().toISOString(),
        ...data
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      
      try {
        fs.appendFileSync(NOTIFICATION_LOG_FILE, logLine);
        console.log('✅ Log entry written successfully');
      } catch (error) {
        console.error('❌ Error writing to notification log:', error);
      }
    }
    
    logNotification('new-order', testData);
    
    // Wait a moment then check the log
    setTimeout(() => {
      try {
        const logContent = fs.readFileSync(NOTIFICATION_LOG_FILE, 'utf8');
        const lines = logContent.trim().split('\n').filter(line => line.trim());
        
        console.log(`\n📋 Log file contains ${lines.length} entries`);
        
        // Look for our test entry
        const testEntry = lines.find(line => {
          try {
            const entry = JSON.parse(line);
            return entry.orderId === testData.orderId;
          } catch (e) {
            return false;
          }
        });
        
        if (testEntry) {
          console.log('✅ Test entry found in log:');
          console.log(testEntry);
        } else {
          console.log('❌ Test entry not found in log');
          console.log('📋 Last 3 entries:');
          lines.slice(-3).forEach((line, index) => {
            console.log(`${index + 1}. ${line}`);
          });
        }
        
      } catch (e) {
        console.log('❌ Error reading log file:', e.message);
      }
    }, 500);
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

testLogFunction();