/**
 * Cryptomus Webhook Monitor
 * Monitors incoming webhooks from Cryptomus and logs detailed information
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5202; // Different port to avoid conflicts

// Middleware to parse JSON and capture raw body
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Log file path
const logFile = path.join(__dirname, 'webhook-monitor.log');

// Function to log with timestamp
function logWithTimestamp(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  
  // Also write to file
  fs.appendFileSync(logFile, logMessage);
}

// Webhook endpoint
app.post('/webhook', (req, res) => {
  logWithTimestamp('🚀 WEBHOOK RECEIVED!');
  logWithTimestamp('Headers: ' + JSON.stringify(req.headers, null, 2));
  
  try {
    // Parse body
    let body;
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString());
    } else {
      body = req.body;
    }
    
    logWithTimestamp('Body: ' + JSON.stringify(body, null, 2));
    
    // Verify signature if present
    const receivedSign = req.headers['sign'];
    if (receivedSign) {
      const apiKey = 'OnKtlbdNm9L9plzZpzZPNwYh39gHBr3UnL5f8OEPc9ot3MTxlsETx5I0nwyFgfKn82ke13V4cZFgOF0vH5UN6wt1QaGuEKnbHwQDIuLXrIrW7SUgLgMrm0JYA0JzPxvj';
      const dataString = Buffer.from(JSON.stringify(body)).toString('base64');
      const expectedSign = crypto
        .createHash('md5')
        .update(dataString + apiKey)
        .digest('hex');
      
      logWithTimestamp(`Signature verification:`);
      logWithTimestamp(`  Received: ${receivedSign}`);
      logWithTimestamp(`  Expected: ${expectedSign}`);
      logWithTimestamp(`  Valid: ${receivedSign === expectedSign}`);
    } else {
      logWithTimestamp('No signature header found');
    }
    
    // Extract key information
    if (body) {
      logWithTimestamp('Key Information:');
      logWithTimestamp(`  Order ID: ${body.order_id || 'N/A'}`);
      logWithTimestamp(`  Status: ${body.status || 'N/A'}`);
      logWithTimestamp(`  Amount: ${body.amount || 'N/A'}`);
      logWithTimestamp(`  Currency: ${body.currency || 'N/A'}`);
      logWithTimestamp(`  UUID: ${body.uuid || 'N/A'}`);
      logWithTimestamp(`  Additional Data: ${body.additional_data || 'N/A'}`);
    }
    
    logWithTimestamp('✅ Webhook processed successfully');
    res.status(200).json({ status: 'ok', message: 'Webhook received and logged' });
    
  } catch (error) {
    logWithTimestamp('❌ Error processing webhook: ' + error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Cryptomus Webhook Monitor is running' 
  });
});

// Get recent logs endpoint
app.get('/logs', (req, res) => {
  try {
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf8');
      const lines = logs.split('\n').filter(line => line.trim()).slice(-50); // Last 50 lines
      res.json({ logs: lines });
    } else {
      res.json({ logs: ['No logs found'] });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

// Start server
app.listen(PORT, () => {
  logWithTimestamp(`🚀 Cryptomus Webhook Monitor started on port ${PORT}`);
  logWithTimestamp(`📋 Webhook URL: http://localhost:${PORT}/webhook`);
  logWithTimestamp(`🏥 Health check: http://localhost:${PORT}/health`);
  logWithTimestamp(`📜 View logs: http://localhost:${PORT}/logs`);
  logWithTimestamp('Waiting for webhooks...');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  logWithTimestamp('🛑 Webhook monitor shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logWithTimestamp('🛑 Webhook monitor shutting down...');
  process.exit(0);
});